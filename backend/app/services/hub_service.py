"""
CRUD operations for hubs.
"""

from typing import Optional

from fastapi import HTTPException, status

from schemas.hub import HubCreate, HubOut, HubUpdate


def create_hub(conn, hub: HubCreate) -> HubOut:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO hubs (hub_name, city, address)
            VALUES (%s, %s, %s)
            RETURNING hub_id, hub_name, city, address, created_at
            """,
            (hub.hub_name, hub.city, hub.address),
        )
        row = cur.fetchone()
    return HubOut(**row)


def get_hubs(conn, skip: int = 0, limit: int = 100) -> list[HubOut]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT hub_id, hub_name, city, address, created_at
            FROM hubs
            ORDER BY hub_id
            OFFSET %s LIMIT %s
            """,
            (skip, limit),
        )
        rows = cur.fetchall()
    return [HubOut(**row) for row in rows]


def get_hub_by_id(conn, hub_id: int) -> HubOut:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT hub_id, hub_name, city, address, created_at
            FROM hubs
            WHERE hub_id = %s
            """,
            (hub_id,),
        )
        row = cur.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hub with id {hub_id} not found",
        )
    return HubOut(**row)


def update_hub(conn, hub_id: int, hub: HubUpdate) -> HubOut:
    fields = hub.model_dump(exclude_unset=True)
    if not fields:
        return get_hub_by_id(conn, hub_id)

    set_clause = ", ".join(f"{field} = %s" for field in fields)
    values = list(fields.values()) + [hub_id]

    with conn.cursor() as cur:
        cur.execute(
            f"""
            UPDATE hubs
            SET {set_clause}
            WHERE hub_id = %s
            RETURNING hub_id, hub_name, city, address, created_at
            """,
            values,
        )
        row = cur.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hub with id {hub_id} not found",
        )
    return HubOut(**row)


def delete_hub(conn, hub_id: int) -> None:
    with conn.cursor() as cur:
        cur.execute("DELETE FROM hubs WHERE hub_id = %s RETURNING hub_id", (hub_id,))
        row = cur.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hub with id {hub_id} not found",
        )
