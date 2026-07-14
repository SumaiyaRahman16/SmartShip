-- ==========================================================
-- 007_create_shipment_assignments.sql
-- Description: Creates the shipment_assignments table.
-- ==========================================================

CREATE TABLE shipment_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    shipment_id UUID NOT NULL,

    rider_id UUID NOT NULL,

    status VARCHAR(30) NOT NULL CHECK (
        status IN (
            'ASSIGNED',
            'OUT_FOR_DELIVERY',
            'COMPLETED'
        )
    ),

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ,

    CONSTRAINT fk_assignment_shipment
        FOREIGN KEY (shipment_id)
        REFERENCES shipments(shipment_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_rider
        FOREIGN KEY (rider_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_assignment_rider
ON shipment_assignments(rider_id);

CREATE INDEX idx_assignment_shipment
ON shipment_assignments(shipment_id);

CREATE INDEX idx_assignment_status
ON shipment_assignments(status);