"""
Insert shipment event, get shipment timeline, get latest shipment event,
update current shipment state.

insert_shipment_event follows the required transaction shape:

    Begin transaction
        -> Insert into shipment_events
        -> Update shipment_current_state
    Commit

    On any failure -> Rollback
"""

import psycopg2
from fastapi import HTTPException, status

from schemas.shipment_event import ShipmentEventCreate, ShipmentEventOut

_EVENT_COLUMNS = "event_id, shipment_id, hub_id, performed_by, status_id, remarks, event_time"


def _get_status_id(cur, status_code: str) -> int:
    cur.execute("SELECT status_id FROM shipment_statuses WHERE status_code = %s", (status_code,))
    row = cur.fetchone()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown shipment status '{status_code}'",
        )
    return row["status_id"]


def _row_to_event_out(row: dict, status_code: str) -> ShipmentEventOut:
    return ShipmentEventOut(
        event_id=row["event_id"],
        shipment_id=row["shipment_id"],
        hub_id=row["hub_id"],
        performed_by=row["performed_by"],
        status=status_code,
        remarks=row["remarks"],
        event_time=row["event_time"],
    )


def insert_shipment_event(conn, event: ShipmentEventCreate, performed_by: int) -> ShipmentEventOut:
    try:
        with conn.cursor() as cur:
            # Ensure the shipment exists before appending an event to it.
            cur.execute(
                "SELECT 1 FROM shipments WHERE shipment_id = %s",
                (event.shipment_id,),
            )
            if cur.fetchone() is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Shipment with id {event.shipment_id} not found",
                )

            status_id = _get_status_id(cur, event.status.value)

            cur.execute(
                f"""
                INSERT INTO shipment_events (shipment_id, hub_id, performed_by, status_id, remarks)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING {_EVENT_COLUMNS}
                """,
                (event.shipment_id, event.hub_id, performed_by, status_id, event.remarks),
            )
            event_row = cur.fetchone()

            _update_current_state(
                cur,
                shipment_id=event.shipment_id,
                status_id=status_id,
                hub_id=event.hub_id,
                event_id=event_row["event_id"],
            )

        conn.commit()
        return _row_to_event_out(event_row, event.status.value)

    except psycopg2.errors.ForeignKeyViolation:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="hub_id does not reference an existing hub",
        )
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise


def _update_current_state(cur, shipment_id: int, status_id: int, hub_id: int | None, event_id: int) -> None:
    """
    Upserts shipment_current_state. Must be called within the same
    transaction/cursor as the event insert it follows.
    """
    cur.execute(
        """
        INSERT INTO shipment_current_state (shipment_id, current_status_id, current_hub_id, last_event_id, updated_at)
        VALUES (%s, %s, %s, %s, NOW())
        ON CONFLICT (shipment_id) DO UPDATE SET
            current_status_id = EXCLUDED.current_status_id,
            current_hub_id = COALESCE(EXCLUDED.current_hub_id, shipment_current_state.current_hub_id),
            last_event_id = EXCLUDED.last_event_id,
            updated_at = NOW()
        """,
        (shipment_id, status_id, hub_id, event_id),
    )


def get_shipment_timeline(conn, shipment_id: int) -> list[ShipmentEventOut]:
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM shipments WHERE shipment_id = %s", (shipment_id,))
        if cur.fetchone() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Shipment with id {shipment_id} not found",
            )

        cur.execute(
            f"""
            SELECT e.event_id, e.shipment_id, e.hub_id, e.performed_by,
                   s.status_code AS status, e.remarks, e.event_time
            FROM shipment_events e
            JOIN shipment_statuses s ON s.status_id = e.status_id
            WHERE e.shipment_id = %s
            ORDER BY e.event_time ASC
            """,
            (shipment_id,),
        )
        rows = cur.fetchall()

    return [ShipmentEventOut(**row) for row in rows]


def get_latest_event(conn, shipment_id: int) -> ShipmentEventOut:
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT e.event_id, e.shipment_id, e.hub_id, e.performed_by,
                   s.status_code AS status, e.remarks, e.event_time
            FROM shipment_events e
            JOIN shipment_statuses s ON s.status_id = e.status_id
            WHERE e.shipment_id = %s
            ORDER BY e.event_time DESC
            LIMIT 1
            """,
            (shipment_id,),
        )
        row = cur.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No events found for shipment {shipment_id}",
        )
    return ShipmentEventOut(**row)
