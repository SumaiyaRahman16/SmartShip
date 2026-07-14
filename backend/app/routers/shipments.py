from fastapi import APIRouter, Depends, status

from core.dependencies import get_current_user, require_roles
from db.connection import get_db
from schemas.shipment import ShipmentCreate, ShipmentOut, ShipmentUpdate
from schemas.user import UserRole
from services import shipment_service

router = APIRouter(prefix="/shipments", tags=["shipments"])


@router.post("", response_model=ShipmentOut, status_code=status.HTTP_201_CREATED)
def create_shipment(
    shipment: ShipmentCreate,
    db=Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.WAREHOUSE_OPERATOR)),
):
    return shipment_service.create_shipment(db, shipment, created_by=current_user.user_id)


@router.get("", response_model=list[ShipmentOut])
def get_shipments(
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_db),
    _current_user=Depends(get_current_user),
):
    return shipment_service.get_shipments(db, skip=skip, limit=limit)


@router.get("/tracking/{tracking_number}", response_model=ShipmentOut)
def get_shipment_by_tracking_number(
    tracking_number: str,
    db=Depends(get_db),
    _current_user=Depends(get_current_user),
):
    return shipment_service.get_shipment_by_tracking_number(db, tracking_number)


@router.get("/{shipment_id}", response_model=ShipmentOut)
def get_shipment(
    shipment_id: int,
    db=Depends(get_db),
    _current_user=Depends(get_current_user),
):
    return shipment_service.get_shipment_by_id(db, shipment_id)


@router.put("/{shipment_id}", response_model=ShipmentOut)
def update_shipment(
    shipment_id: int,
    shipment: ShipmentUpdate,
    db=Depends(get_db),
    _current_user=Depends(require_roles(UserRole.ADMIN, UserRole.WAREHOUSE_OPERATOR)),
):
    return shipment_service.update_shipment(db, shipment_id, shipment)
