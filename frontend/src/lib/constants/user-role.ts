import type { UserRole } from "@/lib/types/user";

interface RoleConfig {
    label: string;
    badgeClassName: string;
}

// • ADMIN
// • WAREHOUSE_OPERATOR
// • DELIVERY_RIDER

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
    ADMIN: {
        label: "Admin",
        badgeClassName:
            "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-900",
    },
    WAREHOUSE_OPERATOR: {
        label: "Warehouse Operator",
        badgeClassName:
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
    },
    DELIVERY_RIDER: {
        label: "Delivery Rider",
        badgeClassName:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
    },
};