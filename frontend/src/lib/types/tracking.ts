import type { ShipmentStatus } from "@/lib/types/shipment";

export interface TrackingTimelineEntry {
    id: string;
    status: ShipmentStatus;
    remarks?: string;
    created_at: string;
}

export interface TrackingResult {
    tracking_number: string;
    status: ShipmentStatus;
    current_hub?: string;
    updated_at: string;
    timeline: TrackingTimelineEntry[];
}

export interface TrackingTimelineEvent {
    id: string;
    status: ShipmentStatus;
    hub?: string;
    remarks?: string;
    event_time: string;
}

export interface TrackingDetail {
    tracking_number: string;
    status: ShipmentStatus;
    current_hub?: string;
    expected_delivery_date?: string;
    updated_at: string;
    timeline: TrackingTimelineEvent[];
}