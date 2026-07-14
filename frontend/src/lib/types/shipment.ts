export type ShipmentStatus =
    | "PENDING"
    | "PICKED_UP"
    | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "DELAYED"
    | "CANCELLED";

export interface Shipment {
    id: string;
    tracking_number: string;
    sender_name: string;
    sender_phone: string;
    receiver_name: string;
    receiver_phone: string;
    delivery_address: string;
    origin_hub: string;
    destination_hub: string;
    expected_delivery_date: string;
    status: ShipmentStatus;
    current_hub?: string;
    created_at: string;
    updated_at: string;
}

export interface ShipmentEvent {
    id: string;
    shipment_id: string;
    status: ShipmentStatus;
    remarks: string;
    created_at: string;
    created_by?: string;
}

export interface CreateShipmentPayload {
    sender_name: string;
    sender_phone: string;
    receiver_name: string;
    receiver_phone: string;
    delivery_address: string;
    origin_hub: string;
    destination_hub: string;
    expected_delivery_date: string;
}

export interface UpdateShipmentStatusPayload {
    status: ShipmentStatus;
    remarks: string;
}