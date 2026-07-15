"""
Create shipment, list shipments, get shipment, update shipment,
find shipment by tracking number.

Creating a shipment is a multi-step, transactional operation:

    Begin transaction
        -> Insert into shipments
        -> Look up the CREATED status_id
        -> Insert the initial "CREATED" shipment_event
        -> Insert shipment_current_state
    Commit

    On any failure -> Rollback
"""

import secrets
import string
from uuid import UUID

import psycopg2
# pyrefly: ignore [missing-import]
from fastapi import HTTPException, status

from schemas.shipment import ShipmentCreate, ShipmentOut, ShipmentUpdate

_SHIPMENT_COLUMNS = (
    "shipment_id, tracking_number, sender_name, sender_phone, receiver_name, "
    "receiver_phone, delivery_address, origin_hub_id, destination_hub_id, "
    "expected_delivery_date, created_by, created_at"
)

_SHIPMENT_COLUMNS_WITH_STATUS = (
    "s.shipment_id, s.tracking_number, s.sender_name, s.sender_phone, s.receiver_name, "
    "s.receiver_phone, s.delivery_address, s.origin_hub_id, s.destination_hub_id, "
    "s.expected_delivery_date, s.created_by, s.created_at, "
    "st.status_name AS status, ch.hub_name AS current_hub, "
    "oh.hub_name AS origin_hub, dh.hub_name AS destination_hub"
)

_SHIPMENT_JOIN_QUERY = """
    FROM shipments s
    LEFT JOIN shipment_current_state cs ON cs.shipment_id = s.shipment_id
    LEFT JOIN shipment_statuses st ON st.status_id = cs.current_status_id
    LEFT JOIN hubs ch ON ch.hub_id = cs.current_hub_id
    LEFT JOIN hubs oh ON oh.hub_id = s.origin_hub_id
    LEFT JOIN hubs dh ON dh.hub_id = s.destination_hub_id
"""


def _generate_tracking_number() -> str:
    """
    Human-friendly, high-entropy tracking number, e.g. TRK-7F3K9QZP1A.
    Collisions are handled by retrying on UniqueViolation in create_shipment.
    """
    alphabet = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(alphabet) for _ in range(10))
    return f"TRK-{suffix}"


def _get_status_id(cur, status_code: str) -> int:
    cur.execute("SELECT status_id FROM shipment_statuses WHERE status_name = %s", (status_code,))
    row = cur.fetchone()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Shipment status '{status_code}' is not seeded in shipment_statuses",
        )
    return row["status_id"]


def create_shipment(conn, shipment: ShipmentCreate, created_by: int) -> ShipmentOut:
    max_attempts = 5

    for attempt in range(max_attempts):
        tracking_number = _generate_tracking_number()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    INSERT INTO shipments (
                        tracking_number, sender_name, sender_phone, receiver_name,
                        receiver_phone, delivery_address, origin_hub_id,
                        destination_hub_id, expected_delivery_date, created_by
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING {_SHIPMENT_COLUMNS}
                    """,
                    (
                        tracking_number,
                        shipment.sender_name,
                        shipment.sender_phone,
                        shipment.receiver_name,
                        shipment.receiver_phone,
                        shipment.delivery_address,
                        shipment.origin_hub_id,
                        shipment.destination_hub_id,
                        shipment.expected_delivery_date,
                        created_by,
                    ),
                )
                shipment_row = cur.fetchone()

                created_status_id = _get_status_id(cur, "CREATED")

                cur.execute(
                    """
                    INSERT INTO shipment_events (shipment_id, hub_id, performed_by, status_id, remarks)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING event_id, event_time
                    """,
                    (
                        shipment_row["shipment_id"],
                        shipment.origin_hub_id,
                        created_by,
                        created_status_id,
                        "Shipment created",
                    ),
                )
                event_row = cur.fetchone()

                cur.execute(
                    """
                    INSERT INTO shipment_current_state
                        (shipment_id, current_status_id, current_hub_id, last_event_id, updated_at)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        shipment_row["shipment_id"],
                        created_status_id,
                        shipment.origin_hub_id,
                        event_row["event_id"],
                        event_row["event_time"],
                    ),
                )

                cur.execute(
                    f"SELECT {_SHIPMENT_COLUMNS_WITH_STATUS} {_SHIPMENT_JOIN_QUERY} WHERE s.shipment_id = %s",
                    (shipment_row["shipment_id"],),
                )
                full_shipment_row = cur.fetchone()

            conn.commit()
            return ShipmentOut(**full_shipment_row)

        except psycopg2.errors.UniqueViolation:
            # tracking_number collision (astronomically unlikely) - retry
            conn.rollback()
            continue
        except psycopg2.errors.ForeignKeyViolation:
            conn.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="origin_hub_id, destination_hub_id or created_by does not reference an existing record",
            )
        except Exception:
            conn.rollback()
            raise

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to generate a unique tracking number, please retry",
    )


def get_shipments(conn, skip: int = 0, limit: int = 100) -> list[ShipmentOut]:
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT {_SHIPMENT_COLUMNS_WITH_STATUS}
            {_SHIPMENT_JOIN_QUERY}
            ORDER BY s.shipment_id DESC
            OFFSET %s LIMIT %s
            """,
            (skip, limit),
        )
        rows = cur.fetchall()
    return [ShipmentOut(**row) for row in rows]


def get_shipment_by_id(conn, shipment_id: UUID) -> ShipmentOut:
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT {_SHIPMENT_COLUMNS_WITH_STATUS} {_SHIPMENT_JOIN_QUERY} WHERE s.shipment_id = %s",
            (shipment_id,),
        )
        row = cur.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shipment with id {shipment_id} not found",
        )
    return ShipmentOut(**row)


def get_shipment_by_tracking_number(conn, tracking_number: str) -> ShipmentOut:
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT {_SHIPMENT_COLUMNS_WITH_STATUS} {_SHIPMENT_JOIN_QUERY} WHERE s.tracking_number = %s",
            (tracking_number,),
        )
        row = cur.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shipment with tracking number '{tracking_number}' not found",
        )
    return ShipmentOut(**row)


def update_shipment(conn, shipment_id: UUID, shipment: ShipmentUpdate) -> ShipmentOut:
    fields = shipment.model_dump(exclude_unset=True)
    if not fields:
        return get_shipment_by_id(conn, shipment_id)

    set_clause = ", ".join(f"{field} = %s" for field in fields)
    values = list(fields.values()) + [shipment_id]

    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                UPDATE shipments
                SET {set_clause}
                WHERE shipment_id = %s
                """,
                values,
            )
            if cur.rowcount == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Shipment with id {shipment_id} not found",
                )
    except psycopg2.errors.ForeignKeyViolation:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="destination_hub_id does not reference an existing hub",
        )

    return get_shipment_by_id(conn, shipment_id)
