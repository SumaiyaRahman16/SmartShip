-- ==========================================================
-- 004_create_shipments.sql
-- Description: Creates the shipments table.
-- ==========================================================

CREATE TABLE shipments (
    shipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tracking_number VARCHAR(50) NOT NULL UNIQUE,

    sender_name VARCHAR(100) NOT NULL,
    sender_phone VARCHAR(20),

    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(20),

    delivery_address TEXT NOT NULL,

    origin_hub_id UUID NOT NULL,
    destination_hub_id UUID NOT NULL,

    expected_delivery_date DATE,

    created_by UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_shipments_origin_hub
        FOREIGN KEY (origin_hub_id)
        REFERENCES hubs(hub_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_shipments_destination_hub
        FOREIGN KEY (destination_hub_id)
        REFERENCES hubs(hub_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_shipments_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_shipments_tracking
ON shipments(tracking_number);

CREATE INDEX idx_shipments_origin_hub
ON shipments(origin_hub_id);

CREATE INDEX idx_shipments_destination_hub
ON shipments(destination_hub_id);