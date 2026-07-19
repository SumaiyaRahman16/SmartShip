from uuid import UUID

from fastapi import HTTPException, status
from psycopg2.extras import RealDictCursor

from schemas.delivery_attempt import CreateDeliveryAttemptRequest


def create_delivery_attempt(db, rider_id: UUID, payload: CreateDeliveryAttemptRequest):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute(
            "SELECT shipment_id FROM shipments WHERE shipment_id = %s",
            (str(payload.shipment_id),),
        )
        shipment = cursor.fetchone()

        if not shipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shipment not found",
            )

        cursor.execute(
            """
            INSERT INTO delivery_attempts (shipment_id, rider_id, result, remarks)
            VALUES (%s, %s, %s, %s)
            RETURNING attempt_id, shipment_id, rider_id, result, remarks, attempt_time
            """,
            (str(payload.shipment_id), str(rider_id), payload.result.value, payload.remarks),
        )
        attempt = cursor.fetchone()

        db.commit()
        return attempt
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create delivery attempt: {str(e)}",
        )
    finally:
        cursor.close()


def get_delivery_attempts(db, shipment_id: UUID):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute(
            "SELECT shipment_id FROM shipments WHERE shipment_id = %s",
            (str(shipment_id),),
        )
        shipment = cursor.fetchone()

        if not shipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shipment not found",
            )

        cursor.execute(
            """
            SELECT attempt_id, shipment_id, rider_id, result, remarks, attempt_time
            FROM delivery_attempts
            WHERE shipment_id = %s
            ORDER BY attempt_time DESC
            """,
            (str(shipment_id),),
        )
        attempts = cursor.fetchall()

        return {"attempts": attempts, "total": len(attempts)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch delivery attempts: {str(e)}",
        )
    finally:
        cursor.close()