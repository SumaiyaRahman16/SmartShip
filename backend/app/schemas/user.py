from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    WAREHOUSE_OPERATOR = "WAREHOUSE_OPERATOR"
    DELIVERY_RIDER = "DELIVERY_RIDER"


# ==========================================================
# Create User
# ==========================================================

class CreateUserRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole
    assigned_hub_id: Optional[UUID] = None


# ==========================================================
# Update User
# ==========================================================

class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    role: Optional[UserRole] = None
    assigned_hub_id: Optional[UUID] = None


# ==========================================================
# User Response
# ==========================================================

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    full_name: str
    email: EmailStr
    phone: Optional[str]
    role: UserRole
    assigned_hub_id: Optional[UUID]
    created_at: datetime


# ==========================================================
# User Summary
# ==========================================================

class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    full_name: str
    role: UserRole


# ==========================================================
# User List Response
# ==========================================================

class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int


UserCreate = CreateUserRequest
UserOut = UserResponse
UserUpdate = UpdateUserRequest