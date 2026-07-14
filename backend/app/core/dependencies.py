from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.security import decode_token
from db.connection import get_db
from schemas.user import UserOut, UserRole

bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    conn=Depends(get_db),
) -> UserOut:
    payload = decode_token(credentials.credentials)

    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    with conn.cursor() as cur:
        cur.execute(
            "SELECT user_id, email, full_name, role, phone, assigned_hub_id, created_at FROM users WHERE user_id = %s",
            (payload["sub"],),
        )
        user = cur.fetchone()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return UserOut(
        user_id=user["user_id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        phone=user["phone"],
        assigned_hub_id=user["assigned_hub_id"],
        created_at=user["created_at"]
    )


def require_roles(*roles: UserRole):
    def dependency(current_user: UserOut = Depends(get_current_user)):
        if current_user.role not in [role.value for role in roles] and current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for this user role",
            )
        return current_user
    return dependency


CurrentUser = UserOut
