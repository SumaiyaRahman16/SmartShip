"""
Authentication logic: verifies credentials and issues JWTs.

Full protected-route enforcement (the `get_current_user` dependency that
reads the `Authorization` header) will be added to core/dependencies.py
in the router-generation phase. This service only handles login.
"""

from fastapi import HTTPException, status

from core.security import create_access_token, verify_password
from schemas.auth import LoginRequest, TokenResponse
from schemas.user import UserOut
from services.user_service import get_user_credentials_by_email



def login(conn, credentials: LoginRequest) -> TokenResponse:
    row = get_user_credentials_by_email(conn, credentials.email)

    if row is None or not verify_password(credentials.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user = UserOut(
        user_id=row["user_id"],
        full_name=row["full_name"],
        email=row["email"],
        phone=row["phone"],
        role=row["role"],
        assigned_hub_id=row["assigned_hub_id"],
        created_at=row["created_at"],
    )

    access_token = create_access_token(
        # pyrefly: ignore [unexpected-keyword]
        subject=str(user.user_id),
        # pyrefly: ignore [unexpected-keyword]
        extra_claims={"role": user.role.value, "email": user.email},
    )

    return TokenResponse(access_token=access_token, user=user)
