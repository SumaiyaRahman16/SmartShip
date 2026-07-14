-- ==========================================================
-- 001_create_hubs.sql
-- Description: Creates the hubs table.
-- ==========================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE hubs (
    hub_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hub_name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_hub_name UNIQUE (hub_name)
);

-- Index for searching hubs by city
CREATE INDEX idx_hubs_city
ON hubs(city);