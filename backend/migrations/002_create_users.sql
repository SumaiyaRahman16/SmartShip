-- ==========================================================
-- 002_create_users.sql
-- Description: Creates the users table.
-- ==========================================================



CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    full_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    phone VARCHAR(20),

    role VARCHAR(30) NOT NULL CHECK (
        role IN (
            'ADMIN',
            'WAREHOUSE_OPERATOR',
            'DELIVERY_RIDER'
        )
    ),

    assigned_hub_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_users_hub
        FOREIGN KEY (assigned_hub_id)
        REFERENCES hubs(hub_id)
        ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_users_role
ON users(role);

CREATE INDEX idx_users_hub
ON users(assigned_hub_id);