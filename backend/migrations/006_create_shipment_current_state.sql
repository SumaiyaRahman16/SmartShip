-- ==========================================================
-- 006_create_shipment_current_state.sql
-- Description: Creates the shipment_current_state table.
-- ==========================================================

CREATE TABLE shipment_current_state (
    shipment_id UUID PRIMARY KEY,

    current_status_id INTEGER NOT NULL,

    current_hub_id UUID NOT NULL,

    last_event_id UUID NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_current_state_shipment
        FOREIGN KEY (shipment_id)
        REFERENCES shipments(shipment_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_current_state_status
        FOREIGN KEY (current_status_id)
        REFERENCES shipment_statuses(status_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_current_state_hub
        FOREIGN KEY (current_hub_id)
        REFERENCES hubs(hub_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_current_state_event
        FOREIGN KEY (last_event_id)
        REFERENCES shipment_events(event_id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_current_status
ON shipment_current_state(current_status_id);

CREATE INDEX idx_current_hub
ON shipment_current_state(current_hub_id);