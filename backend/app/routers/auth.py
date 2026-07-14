from fastapi import APIRouter, Depends

from db.connection import get_db
from schemas.auth import LoginRequest, TokenResponse
from services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db=Depends(get_db)):
    return auth_service.login(db, credentials)
