export type UserRole =
    | "ADMIN"
    | "WAREHOUSE_OPERATOR"
    | "DELIVERY_RIDER";

export interface EmployeeUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone: string;
    assigned_hub?: string;
    created_at?: string;
}
interface EmployeeFormValues {
    name: string;
    email: string;
    phone: string;
    role: UserRole | "";
    assigned_hub_id: string; // UUID, was assigned_hub (free text)
    password: string; // only used on create
}