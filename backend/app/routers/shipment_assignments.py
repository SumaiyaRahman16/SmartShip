from uuid import UUID
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status

from core.dependencies import CurrentUser, get_current_user, require_roles
from db.connection import get_db
from schemas.shipment_assignment import ShipmentAssignmentCreate, ShipmentAssignmentOut
from schemas.user import UserRole
from services import shipment_assignment_service

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.post("", response_model=ShipmentAssignmentOut, status_code=status.HTTP_201_CREATED)
def assign_rider(
    assignment: ShipmentAssignmentCreate,
    db=Depends(get_db),
    _current_user=Depends(require_roles(UserRole.ADMIN, UserRole.WAREHOUSE_OPERATOR)),
):
    return shipment_assignment_service.assign_rider(db, assignment)


@router.get("", response_model=list[ShipmentAssignmentOut])
def get_assignments(
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_db),
    _current_user=Depends(require_roles(UserRole.ADMIN, UserRole.WAREHOUSE_OPERATOR)),
):
    return shipment_assignment_service.get_assignments(db, skip=skip, limit=limit)


@router.get("/rider/{rider_id}", response_model=list[ShipmentAssignmentOut])
def get_rider_assignments(
    rider_id: UUID,
    db=Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    # Riders may only view their own assignments; admins/operators may view any.
    if current_user.role == UserRole.DELIVERY_RIDER and current_user.user_id != rider_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Riders may only view their own assignments",
        )
    return shipment_assignment_service.get_rider_assignments(db, rider_id)


@router.put("/{assignment_id}/complete", response_model=ShipmentAssignmentOut)
def complete_assignment(
    assignment_id: UUID,
    db=Depends(get_db),
    _current_user=Depends(
        require_roles(UserRole.ADMIN, UserRole.WAREHOUSE_OPERATOR, UserRole.DELIVERY_RIDER)
    ),
):
    return shipment_assignment_service.complete_assignment(db, assignment_id)
