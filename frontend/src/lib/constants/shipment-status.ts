import type { ShipmentStatus } from "@/lib/types/shipment";

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
    "CREATED",
    "PICKED_UP",
    "ARRIVED_HUB",
    "DEPARTED_HUB",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "DELIVERY_FAILED",
];

interface StatusConfig {
    label: string;
    badgeClassName: string;
}

export const STATUS_CONFIG: Record<ShipmentStatus, StatusConfig> = {
    CREATED: {
        label: "Created",
        badgeClassName:
            "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    },
    PICKED_UP: {
        label: "Picked Up",
        badgeClassName:
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
    },
    ARRIVED_HUB: {
        label: "Arrived at Hub",
        badgeClassName:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
    },
    DEPARTED_HUB: {
        label: "Departed Hub",
        badgeClassName:
            "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60",
    },
    OUT_FOR_DELIVERY: {
        label: "Out for Delivery",
        badgeClassName:
            "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60",
    },
    DELIVERED: {
        label: "Delivered",
        badgeClassName:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
    },
    DELIVERY_FAILED: {
        label: "Delivery Failed",
        badgeClassName:
            "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60",
    },
};