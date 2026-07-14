"""
Public tracking lookup: shipment details, latest status, current hub,
last updated time, and the complete shipment timeline.

No authentication required - used by the public GET /tracking/{tracking_number}
endpoint.
"""

from fastapi import HTTPException, status

from schemas.shipment_event import ShipmentEventOut
from schemas.tracking import TrackingResponse


def get_tracking_info(conn, tracking_number: str) -> TrackingResponse:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                sh.shipment_id,
                sh.tracking_number,
                sh.sender_name,
                sh.receiver_name,
                sh.receiver_phone,
                sh.delivery_address,
                sh.expected_delivery_date,
                st.status_code AS current_status,
                cs.current_hub_id,
                h.hub_name AS current_hub_name,
                cs.updated_at AS last_updated_at
            FROM shipments sh
            JOIN shipment_current_state cs ON cs.shipment_id = sh.shipment_id
            JOIN shipment_statuses st ON st.status_id = cs.current_status_id
            LEFT JOIN hubs h ON h.hub_id = cs.current_hub_id
            WHERE sh.tracking_number = %s
            """,
            (tracking_number,),
        )
        header = cur.fetchone()

        if header is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Shipment with tracking number '{tracking_number}' not found",
            )

        cur.execute(
            """
            SELECT e.event_id, e.shipment_id, e.hub_id, e.performed_by,
                   s.status_code AS status, e.remarks, e.event_time
            FROM shipment_events e
            JOIN shipment_statuses s ON s.status_id = e.status_id
            WHERE e.shipment_id = %s
            ORDER BY e.event_time ASC
            """,
            (header["shipment_id"],),
        )
        timeline_rows = cur.fetchall()

    return TrackingResponse(
        tracking_number=header["tracking_number"],
        sender_name=header["sender_name"],
        receiver_name=header["receiver_name"],
        receiver_phone=header["receiver_phone"],
        delivery_address=header["delivery_address"],
        expected_delivery_date=(
            header["expected_delivery_date"].isoformat()
            if header["expected_delivery_date"]
            else None
        ),
        current_status=header["current_status"],
        current_hub_id=header["current_hub_id"],
        current_hub_name=header["current_hub_name"],
        last_updated_at=header["last_updated_at"],
        timeline=[ShipmentEventOut(**row) for row in timeline_rows],
    )
