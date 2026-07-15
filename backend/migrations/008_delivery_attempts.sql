CREATE TABLE delivery_attempts (
    attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    shipment_id UUID NOT NULL,
    rider_id UUID NOT NULL,

    result VARCHAR(30) NOT NULL CHECK (
        result IN (
            'SUCCESS',
            'FAILED',
            'CUSTOMER_UNAVAILABLE',
            'WRONG_ADDRESS',
            'REJECTED'
        )
    ),

    remarks TEXT,

    attempt_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_delivery_attempt_shipment
        FOREIGN KEY (shipment_id)
        REFERENCES shipments(shipment_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_delivery_attempt_rider
        FOREIGN KEY (rider_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);