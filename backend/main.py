"""
Application entrypoint.

Wires together the connection pool lifecycle and all routers.
Run with:

    uvicorn main:app --reload
"""

import os
import sys
from pathlib import Path

# Add the 'app' directory to the python path so that downstream absolute imports (e.g. from db...) work at runtime.
sys.path.insert(0, str(Path(__file__).resolve().parent / "app"))

from contextlib import asynccontextmanager

from fastapi import FastAPI

from db.connection import close_db_pool, init_db_pool, get_connection
from db.migration_runner import run_migrations
from routers import (
    auth,
    hubs,
    shipment_assignments,
    shipment_events,
    shipments,
    tracking,
    users,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_pool()
    with get_connection() as conn:
        run_migrations(conn)
    yield
    close_db_pool()


app = FastAPI(
    title="Real-Time Logistics Tracking System",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(hubs.router)
app.include_router(shipments.router)
app.include_router(shipment_events.router)
app.include_router(shipment_assignments.router)
app.include_router(tracking.router)


@app.get("/", tags=["checking "])
def health_check():
    return {"status": "ok"}
