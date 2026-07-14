from fastapi import APIRouter, Depends, status

from core.dependencies import get_current_user, require_roles
from db.connection import get_db
from schemas.hub import HubCreate, HubOut, HubUpdate
from schemas.user import UserRole
from services import hub_service

router = APIRouter(prefix="/hubs", tags=["hubs"])


@router.get("", response_model=list[HubOut])
def get_hubs(
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_db),
    _current_user=Depends(get_current_user),
):
    return hub_service.get_hubs(db, skip=skip, limit=limit)


@router.get("/{hub_id}", response_model=HubOut)
def get_hub(
    hub_id: int,
    db=Depends(get_db),
    _current_user=Depends(get_current_user),
):
    return hub_service.get_hub_by_id(db, hub_id)


@router.post("", response_model=HubOut, status_code=status.HTTP_201_CREATED)
def create_hub(
    hub: HubCreate,
    db=Depends(get_db),
    _current_user=Depends(require_roles(UserRole.ADMIN)),
):
    return hub_service.create_hub(db, hub)


@router.put("/{hub_id}", response_model=HubOut)
def update_hub(
    hub_id: int,
    hub: HubUpdate,
    db=Depends(get_db),
    _current_user=Depends(require_roles(UserRole.ADMIN)),
):
    return hub_service.update_hub(db, hub_id, hub)


@router.delete("/{hub_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hub(
    hub_id: int,
    db=Depends(get_db),
    _current_user=Depends(require_roles(UserRole.ADMIN)),
):
    hub_service.delete_hub(db, hub_id)
