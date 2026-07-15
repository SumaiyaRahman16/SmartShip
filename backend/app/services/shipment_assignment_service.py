"""
Assign rider, complete assignment, list assignments, list rider assignments.
"""

from uuid import UUID
import psycopg2
# pyrefly: ignore [missing-import]
from fastapi import HTTPException, status

from schemas.shipment_assignment import ShipmentAssignmentCreate, ShipmentAssignmentOut

_ASSIGNMENT_SELECT = """
    SELECT
        a.assignment_id,
        a.shipment_id,
        sh.tracking_number,
        a.rider_id,
        u.full_name AS rider_name,
        a.status,
        a.assigned_at,
        a.completed_at
    FROM shipment_assignments a
    JOIN shipments sh ON sh.shipment_id = a.shipment_id
    JOIN users u ON u.user_id = a.rider_id
"""


def assign_rider(conn, assignment: ShipmentAssignmentCreate) -> ShipmentAssignmentOut:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM shipments WHERE shipment_id = %s",
            (assignment.shipment_id,),
        )
        if cur.fetchone() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Shipment with id {assignment.shipment_id} not found",
            )

        cur.execute(
            "SELECT role FROM users WHERE user_id = %s",
            (assignment.rider_id,),
        )
        rider_row = cur.fetchone()
        if rider_row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {assignment.rider_id} not found",
            )
        if rider_row["role"] != "DELIVERY_RIDER":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {assignment.rider_id} is not a DELIVERY_RIDER",
            )

        try:
            cur.execute(
                """
                WITH inserted AS (
                    INSERT INTO shipment_assignments (shipment_id, rider_id, status)
                    VALUES (%s, %s, 'ASSIGNED')
                    RETURNING assignment_id, shipment_id, rider_id, status, assigned_at, completed_at
                )
                SELECT
                    i.assignment_id,
                    i.shipment_id,
                    sh.tracking_number,
                    i.rider_id,
                    u.full_name AS rider_name,
                    i.status,
                    i.assigned_at,
                    i.completed_at
                FROM inserted i
                JOIN shipments sh ON sh.shipment_id = i.shipment_id
                JOIN users u ON u.user_id = i.rider_id
                """,
                (assignment.shipment_id, assignment.rider_id),
            )
            row = cur.fetchone()
        except psycopg2.errors.ForeignKeyViolation:
            conn.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="shipment_id or rider_id does not reference an existing record",
            )

    return ShipmentAssignmentOut(**row)


def complete_assignment(conn, assignment_id: UUID) -> ShipmentAssignmentOut:
    with conn.cursor() as cur:
        cur.execute(
            """
            WITH updated AS (
                UPDATE shipment_assignments
                SET status = 'COMPLETED', completed_at = NOW()
                WHERE assignment_id = %s AND status != 'COMPLETED'
                RETURNING assignment_id, shipment_id, rider_id, status, assigned_at, completed_at
            )
            SELECT
                u_arr.assignment_id,
                u_arr.shipment_id,
                sh.tracking_number,
                u_arr.rider_id,
                u.full_name AS rider_name,
                u_arr.status,
                u_arr.assigned_at,
                u_arr.completed_at
            FROM updated u_arr
            JOIN shipments sh ON sh.shipment_id = u_arr.shipment_id
            JOIN users u ON u.user_id = u_arr.rider_id
            """,
            (assignment_id,),
        )
        row = cur.fetchone()

        if row is None:
            # Distinguish "not found" from "already completed"
            cur.execute(
                "SELECT status FROM shipment_assignments WHERE assignment_id = %s",
                (assignment_id,),
            )
            existing = cur.fetchone()
            if existing is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Assignment with id {assignment_id} not found",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Assignment {assignment_id} is already completed",
            )

    return ShipmentAssignmentOut(**row)


def get_assignments(conn, skip: int = 0, limit: int = 100) -> list[ShipmentAssignmentOut]:
    with conn.cursor() as cur:
        cur.execute(
            f"""
            {_ASSIGNMENT_SELECT}
            ORDER BY a.assignment_id DESC
            OFFSET %s LIMIT %s
            """,
            (skip, limit),
        )
        rows = cur.fetchall()
    return [ShipmentAssignmentOut(**row) for row in rows]


def get_rider_assignments(conn, rider_id: UUID) -> list[ShipmentAssignmentOut]:
    with conn.cursor() as cur:
        cur.execute(
            f"""
            {_ASSIGNMENT_SELECT}
            WHERE a.rider_id = %s
            ORDER BY a.assigned_at DESC
            """,
            (rider_id,),
        )
        rows = cur.fetchall()
    return [ShipmentAssignmentOut(**row) for row in rows]
