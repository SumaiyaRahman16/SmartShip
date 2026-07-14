from uuid import UUID
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

    user_id: UUID
    full_name: str
    email: EmailStr
    role: str


class TokenData(BaseModel):
    user_id: UUID
    email: EmailStr
    role: str


from schemas.user import UserOut

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut