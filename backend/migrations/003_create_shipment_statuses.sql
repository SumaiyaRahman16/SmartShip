-- ==========================================================
-- 003_create_shipment_statuses.sql
-- Description: Creates the shipment_statuses lookup table.
-- ==========================================================

CREATE TABLE shipment_statuses (
    status_id SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO shipment_statuses (status_name)
VALUES
('CREATED'),
('PICKED_UP'),
('ARRIVED_HUB'),
('DEPARTED_HUB'),
('OUT_FOR_DELIVERY'),
('DELIVERED'),
('DELIVERY_FAILED');