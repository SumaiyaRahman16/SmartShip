"""
Public tracking lookup: shipment details, latest status, current hub,
last updated time, and the complete shipment timeline.

No authentication required - used by the public GET /tracking/{tracking_number}
endpoint.
"""

# pyrefly: ignore [missing-import]
from fastapi import HTTPException, status

from schemas.tracking import TrackingResponse, TrackingTimelineEvent


def get_tracking_info(conn, tracking_number: str) -> TrackingResponse:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                sh.shipment_id,
                sh.tracking_number,
                st.status_name AS status,
                h.hub_name AS current_hub,
                sh.expected_delivery_date,
                cs.updated_at
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
            SELECT e.event_id AS id,
                   s.status_name AS status,
                   h.hub_name AS hub,
                   e.remarks,
                   e.event_time
            FROM shipment_events e
            JOIN shipment_statuses s ON s.status_id = e.status_id
            LEFT JOIN hubs h ON h.hub_id = e.hub_id
            WHERE e.shipment_id = %s
            ORDER BY e.event_time DESC
            """,
            (header["shipment_id"],),
        )
        timeline_rows = cur.fetchall()

    return TrackingResponse(
        tracking_number=header["tracking_number"],
        status=header["status"],
        current_hub=header["current_hub"],
        expected_delivery_date=header["expected_delivery_date"],
        updated_at=header["updated_at"],
        timeline=[TrackingTimelineEvent(**row) for row in timeline_rows],
    )
