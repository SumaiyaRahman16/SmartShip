from uuid import UUID

from fastapi import HTTPException, status

try:
    from schemas.shipment_notes import ShipmentNoteCreate
except ImportError:  # pragma: no cover - keeps the service compatible with older schema naming.
    from schemas.shipment_notes import CreateShipmentNoteRequest as ShipmentNoteCreate

from schemas.shipment_notes import ShipmentNoteResponse

_NOTE_COLUMNS = "note_id, shipment_id, user_id, note, created_at"


def create_shipment_note(
    conn,
    request: ShipmentNoteCreate,
    user_id: UUID,
) -> ShipmentNoteResponse:
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM shipments WHERE shipment_id = %s",
                (request.shipment_id,),
            )
            if cur.fetchone() is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Shipment with id {request.shipment_id} not found",
                )

            cur.execute(
                f"""
                INSERT INTO shipment_notes
                (
                    shipment_id,
                    user_id,
                    note
                )
                VALUES (%s, %s, %s)
                RETURNING {_NOTE_COLUMNS}
                """,
                (request.shipment_id, user_id, request.note),
            )
            row = cur.fetchone()

        conn.commit()
        return ShipmentNoteResponse(**row)

    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise


def get_shipment_notes(conn, shipment_id: UUID) -> list[ShipmentNoteResponse]:
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM shipments WHERE shipment_id = %s", (shipment_id,))
            if cur.fetchone() is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Shipment with id {shipment_id} not found",
                )

            cur.execute(
                f"""
                SELECT
                    {_NOTE_COLUMNS}
                FROM shipment_notes
                WHERE shipment_id = %s
                ORDER BY created_at DESC
                """,
                (shipment_id,),
            )
            rows = cur.fetchall()

        return [ShipmentNoteResponse(**row) for row in rows]

    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise