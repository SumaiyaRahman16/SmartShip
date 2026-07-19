from uuid import UUID

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, status

from core.dependencies import get_current_user, require_roles
from db.connection import get_db
from schemas.shipment_notes import (
 CreateShipmentNoteRequest,
   ShipmentNoteListResponse,
    ShipmentNoteResponse,
)
from schemas.user import UserRole
from services import shipment_note_service

router = APIRouter(
    prefix="/shipment-notes",
    tags=["shipment-notes"],
)

@router.post(
    "",
    response_model=ShipmentNoteResponse,
    status_code=status.HTTP_201_CREATED,
)

def create_shipment_note(
    request: CreateShipmentNoteRequest,
    db=Depends(get_db),
    current_user=Depends(
    require_roles(UserRole.WAREHOUSE_OPERATOR)
)
):
    return shipment_note_service.create_shipment_note(db, request, current_user.user_id)


@router.get(
    "/{shipment_id}",
    response_model=ShipmentNoteListResponse,
)
def get_shipment_notes(
    shipment_id: UUID,
    db=Depends(get_db),
    _current_user=Depends(get_current_user),
):
    notes = shipment_note_service.get_shipment_notes(
        db,
        shipment_id,
    )

    return ShipmentNoteListResponse(
        notes=notes,
        total=len(notes),
    )