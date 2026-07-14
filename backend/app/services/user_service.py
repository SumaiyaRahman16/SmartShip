"""
CRUD operations for users.
"""

from typing import Optional

import psycopg2
from fastapi import HTTPException, status

from core.security import hash_password
from schemas.user import UserCreate, UserOut, UserUpdate

_USER_COLUMNS = "user_id, full_name, email, phone, role, assigned_hub_id, created_at"


def create_user(conn, user: UserCreate) -> UserOut:
    password_hash = hash_password(user.password)

    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO users (full_name, email, password_hash, phone, role, assigned_hub_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING {_USER_COLUMNS}
                """,
                (
                    user.full_name,
                    user.email,
                    password_hash,
                    user.phone,
                    user.role.value,
                    user.assigned_hub_id,
                ),
            )
            row = cur.fetchone()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with email '{user.email}' already exists",
        )
    except psycopg2.errors.ForeignKeyViolation:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"assigned_hub_id {user.assigned_hub_id} does not reference an existing hub",
        )

    return UserOut(**row)


def get_users(conn, skip: int = 0, limit: int = 100) -> list[UserOut]:
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT {_USER_COLUMNS}
            FROM users
            ORDER BY user_id
            OFFSET %s LIMIT %s
            """,
            (skip, limit),
        )
        rows = cur.fetchall()
    return [UserOut(**row) for row in rows]


def get_user_by_id(conn, user_id: int) -> UserOut:
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT {_USER_COLUMNS} FROM users WHERE user_id = %s",
            (user_id,),
        )
        row = cur.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )
    return UserOut(**row)


def get_user_credentials_by_email(conn, email: str) -> Optional[dict]:
    """
    Internal helper used by auth_service. Returns the raw row (including
    password_hash) or None. Not exposed to routers directly.
    """
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT user_id, full_name, email, password_hash, phone, role,
                   assigned_hub_id, created_at
            FROM users
            WHERE email = %s
            """,
            (email,),
        )
        return cur.fetchone()


def update_user(conn, user_id: int, user: UserUpdate) -> UserOut:
    fields = user.model_dump(exclude_unset=True)
    if not fields:
        return get_user_by_id(conn, user_id)

    if "password" in fields:
        fields["password_hash"] = hash_password(fields.pop("password"))
    if "role" in fields:
        fields["role"] = fields["role"].value if hasattr(fields["role"], "value") else fields["role"]

    set_clause = ", ".join(f"{field} = %s" for field in fields)
    values = list(fields.values()) + [user_id]

    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                UPDATE users
                SET {set_clause}
                WHERE user_id = %s
                RETURNING {_USER_COLUMNS}
                """,
                values,
            )
            row = cur.fetchone()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already in use by another user",
        )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )
    return UserOut(**row)


def delete_user(conn, user_id: int) -> None:
    with conn.cursor() as cur:
        cur.execute("DELETE FROM users WHERE user_id = %s RETURNING user_id", (user_id,))
        row = cur.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )
