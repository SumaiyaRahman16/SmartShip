import type { ShipmentStatus } from "@/lib/types/shipment";

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
    "PENDING",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "DELAYED",
    "CANCELLED",
];

interface StatusConfig {
    label: string;
    badgeClassName: string;
}

export const STATUS_CONFIG: Record<ShipmentStatus, StatusConfig> = {
    PENDING: {
        label: "Pending",
        badgeClassName:
            "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    },
    PICKED_UP: {
        label: "Picked Up",
        badgeClassName:
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
    },
    IN_TRANSIT: {
        label: "In Transit",
        badgeClassName:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
    },
    OUT_FOR_DELIVERY: {
        label: "Out for Delivery",
        badgeClassName:
            "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-900",
    },
    DELIVERED: {
        label: "Delivered",
        badgeClassName:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
    },
    DELAYED: {
        label: "Delayed",
        badgeClassName:
            "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900",
    },
    CANCELLED: {
        label: "Cancelled",
        badgeClassName:
            "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
    },
};