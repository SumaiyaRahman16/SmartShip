-- ==========================================================
-- 005_create_shipment_events.sql
-- Description: Creates the shipment_events table.
-- ==========================================================

CREATE TABLE shipment_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    shipment_id UUID NOT NULL,

    hub_id UUID NOT NULL,

    performed_by UUID NOT NULL,

    status_id INTEGER NOT NULL,

    remarks TEXT,

    event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_events_shipment
        FOREIGN KEY (shipment_id)
        REFERENCES shipments(shipment_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_events_hub
        FOREIGN KEY (hub_id)
        REFERENCES hubs(hub_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_events_user
        FOREIGN KEY (performed_by)
        REFERENCES users(user_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_events_status
        FOREIGN KEY (status_id)
        REFERENCES shipment_statuses(status_id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_events_shipment
ON shipment_events(shipment_id);

CREATE INDEX idx_events_status
ON shipment_events(status_id);

CREATE INDEX idx_events_hub
ON shipment_events(hub_id);

CREATE INDEX idx_events_time
ON shipment_events(event_time);

CREATE INDEX idx_events_shipment_time
ON shipment_events(shipment_id, event_time);