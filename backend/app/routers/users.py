from fastapi import APIRouter, Depends, status

from core.dependencies import get_current_user, require_roles
from db.connection import get_db
from schemas.user import UserCreate, UserOut, UserRole, UserUpdate
from services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_db),
    _current_user=Depends(get_current_user),
):
    return user_service.get_users(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db=Depends(get_db),
    _current_user=Depends(get_current_user),
):
    return user_service.get_user_by_id(db, user_id)


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    user: UserCreate,
    db=Depends(get_db),
    _current_user=Depends(require_roles(UserRole.ADMIN)),
):
    return user_service.create_user(db, user)


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    user: UserUpdate,
    db=Depends(get_db),
    _current_user=Depends(require_roles(UserRole.ADMIN)),
):
    return user_service.update_user(db, user_id, user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db=Depends(get_db),
    _current_user=Depends(require_roles(UserRole.ADMIN)),
):
    user_service.delete_user(db, user_id)
