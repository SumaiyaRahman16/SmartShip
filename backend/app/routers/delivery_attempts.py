from uuid import UUID

from fastapi import APIRouter, Depends

from db.connection import get_db
from core.security import get_current_user, require_roles
from schemas.delivery_attempt import (
    CreateDeliveryAttemptRequest,
    DeliveryAttemptListResponse,
    DeliveryAttemptResponse,
)
from services import delivery_attempt_service

router = APIRouter(prefix="/delivery-attempts", tags=["Delivery Attempts"])


@router.post("", response_model=DeliveryAttemptResponse)
def create_delivery_attempt(
    payload: CreateDeliveryAttemptRequest,
    db=Depends(get_db),
    current_user: dict = Depends(require_roles("DELIVERY_RIDER")),
):
    return delivery_attempt_service.create_delivery_attempt(
        db, current_user["user_id"], payload
    )


@router.get("/{shipment_id}", response_model=DeliveryAttemptListResponse)
def get_delivery_attempts(
    shipment_id: UUID,
    db=Depends(get_db),
    current_user: dict = Depends(
        require_roles("ADMIN", "WAREHOUSE_OPERATOR", "DELIVERY_RIDER")
    ),
):
    return delivery_attempt_service.get_delivery_attempts(db, shipment_id)