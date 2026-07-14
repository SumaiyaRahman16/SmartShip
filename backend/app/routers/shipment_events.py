from fastapi import APIRouter, Depends, status

from core.dependencies import get_current_user, require_roles
from db.connection import get_db
from schemas.shipment_event import ShipmentEventCreate, ShipmentEventOut
from schemas.user import UserRole
from services import shipment_event_service

router = APIRouter(prefix="/shipment-events", tags=["shipment-events"])


@router.post("", response_model=ShipmentEventOut, status_code=status.HTTP_201_CREATED)
def create_shipment_event(
    event: ShipmentEventCreate,
    db=Depends(get_db),
    current_user=Depends(
        require_roles(UserRole.ADMIN, UserRole.WAREHOUSE_OPERATOR, UserRole.DELIVERY_RIDER)
    ),
):
    return shipment_event_service.insert_shipment_event(db, event, performed_by=current_user.user_id)


@router.get("/{shipment_id}", response_model=list[ShipmentEventOut])
def get_shipment_timeline(
    shipment_id: int,
    db=Depends(get_db),
    _current_user=Depends(get_current_user),
):
    return shipment_event_service.get_shipment_timeline(db, shipment_id)
