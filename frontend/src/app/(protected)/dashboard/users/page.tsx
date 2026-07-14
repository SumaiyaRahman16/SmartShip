"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Users as UsersIcon,
    UserPlus,
    Mail,
    Phone,
    Building2,
    RefreshCw,
    Pencil,
    Trash2,
    Loader2,
} from "lucide-react";

import { private_api_call } from "@/actions/private_api_call";
import type { EmployeeUser, UserRole } from "@/lib/types/user";
import { ROLE_CONFIG } from "@/lib/constants/user-role";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";

const ROLE_OPTIONS = Object.keys(ROLE_CONFIG) as UserRole[];

interface Hub {
    hub_id: string;
    hub_name: string;
    city: string;
    address?: string;
}

interface EmployeeFormValues {
    name: string;
    email: string;
    phone: string;
    role: UserRole | "";
    assigned_hub: string;
    password?: string;
}

type FormErrors = Partial<Record<keyof EmployeeFormValues, string>>;

const emptyForm: EmployeeFormValues = {
    name: "",
    email: "",
    phone: "",
    role: "",
    assigned_hub: "",
    password: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmployeeForm(values: EmployeeFormValues, isCreate = false): FormErrors {
    const errors: FormErrors = {};
    if (!values.name.trim()) errors.name = "Full name is required";
    if (!values.email.trim()) {
        errors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(values.email.trim())) {
        errors.email = "Enter a valid email address";
    }
    if (!values.phone.trim()) errors.phone = "Phone is required";
    if (!values.role) errors.role = "Role is required";
    if (!values.assigned_hub.trim()) errors.assigned_hub = "Assigned hub is required";
    if (isCreate) {
        if (!values.password || values.password.length < 8) {
            errors.password = "Password must be at least 8 characters";
        }
    }
    return errors;
}

function getErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === "object" && err !== null && "message" in err) {
        const message = (err as { message?: unknown }).message;
        if (typeof message === "string" && message) return message;
    }
    return fallback;
}

export default function UsersListPage() {
    const [users, setUsers] = useState<EmployeeUser[]>([]);
    const [hubs, setHubs] = useState<Hub[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create dialog state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<EmployeeFormValues>(emptyForm);
    const [createErrors, setCreateErrors] = useState<FormErrors>({});
    const [isCreating, setIsCreating] = useState(false);

    // Edit dialog state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<EmployeeFormValues>(emptyForm);
    const [editErrors, setEditErrors] = useState<FormErrors>({});
    const [isLoadingEditUser, setIsLoadingEditUser] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Delete dialog state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState<EmployeeUser | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchHubs = async (): Promise<Hub[]> => {
        try {
            const response = await private_api_call({
                path: "hubs",
                method: "GET",
            });
            if (response && response.success && Array.isArray(response.data)) {
                setHubs(response.data);
                return response.data;
            }
        } catch (err) {
            console.error("Failed to load hubs:", err);
        }
        return [];
    };

    const fetchUsers = async (hubsList?: Hub[]) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await private_api_call({
                path: "users",
                method: "GET",
            });
            if (!response || !response.success) {
                throw new Error(response?.message ?? "Failed to load users");
            }
            const rawData = Array.isArray(response.data)
                ? response.data
                : [];
            
            const currentHubs = hubsList ?? hubs;
            const mappedData: EmployeeUser[] = rawData.map((u: any) => {
                const hub = currentHubs.find((h) => h.hub_id === u.assigned_hub_id);
                return {
                    id: u.user_id,
                    name: u.full_name,
                    email: u.email,
                    role: u.role,
                    phone: u.phone ?? "",
                    assigned_hub: hub ? hub.hub_name : "",
                    created_at: u.created_at,
                };
            });
            setUsers(mappedData);
        } catch (err) {
            setError("We couldn't load employees. Please try again.");
            toast.error(getErrorMessage(err, "Failed to load users"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            const loadedHubs = await fetchHubs();
            await fetchUsers(loadedHubs);
        };
        loadInitialData();
    }, []);

    // ---------- Create ----------

    const openCreateDialog = () => {
        setCreateForm(emptyForm);
        setCreateErrors({});
        setIsCreateOpen(true);
    };

    const handleCreateChange = (
        field: keyof EmployeeFormValues,
        value: string
    ) => {
        setCreateForm((prev) => ({ ...prev, [field]: value }));
        if (createErrors[field]) {
            setCreateErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateEmployeeForm(createForm, true);
        if (Object.keys(validationErrors).length > 0) {
            setCreateErrors(validationErrors);
            return;
        }

        setIsCreating(true);
        const requestBody = {
            full_name: createForm.name.trim(),
            email: createForm.email.trim(),
            phone: createForm.phone.trim(),
            role: createForm.role,
            assigned_hub_id: createForm.assigned_hub || null,
            password: createForm.password?.trim() || "",
        };

        // Temporary console.log statements immediately before the API call to print request body and endpoint
        console.log("[Create Employee] Endpoint: POST /users");
        console.log("[Create Employee] Request Body:", requestBody);

        try {
            const response = await private_api_call({
                path: "users",
                method: "POST",
                body: requestBody,
            });

            // Temporary console.log statements immediately after the API call to print response
            console.log("[Create Employee] Response:", response);

            if (!response || !response.success) {
                console.error("[Create Employee] Error Response:", response);
                throw new Error(response?.message ?? "Failed to create employee");
            }

            toast.success("Employee created successfully");
            setIsCreateOpen(false);
            setCreateForm(emptyForm);
            fetchUsers();
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to create employee"));
        } finally {
            setIsCreating(false);
        }
    };

    // ---------- Edit ----------

    const openEditDialog = async (user: EmployeeUser) => {
        setEditingUserId(user.id);
        setEditErrors({});
        setIsEditOpen(true);
        setIsLoadingEditUser(true);
        // Pre-fill immediately with the row data, mapping the hub name to hub_id UUID.
        const initialHub = hubs.find((h) => h.hub_name === user.assigned_hub);
        setEditForm({
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            assigned_hub: initialHub ? initialHub.hub_id : "",
        });
        try {
            const response = await private_api_call({
                path: `users/${user.id}`,
                method: "GET",
            });
            if (response && response.success && response.data) {
                const data = response.data;
                setEditForm({
                    name: data.full_name ?? "",
                    email: data.email ?? "",
                    phone: data.phone ?? "",
                    role: data.role ?? "",
                    assigned_hub: data.assigned_hub_id ?? "",
                });
            }
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to load employee details"));
        } finally {
            setIsLoadingEditUser(false);
        }
    };

    const handleEditChange = (
        field: keyof EmployeeFormValues,
        value: string
    ) => {
        setEditForm((prev) => ({ ...prev, [field]: value }));
        if (editErrors[field]) {
            setEditErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUserId) return;

        const validationErrors = validateEmployeeForm(editForm);
        if (Object.keys(validationErrors).length > 0) {
            setEditErrors(validationErrors);
            return;
        }

        setIsSaving(true);
        try {
            const response = await private_api_call({
                path: `users/${editingUserId}`,
                method: "PUT",
                body: {
                    full_name: editForm.name.trim(),
                    email: editForm.email.trim(),
                    phone: editForm.phone.trim(),
                    role: editForm.role,
                    assigned_hub_id: editForm.assigned_hub || null,
                },
            });
            if (!response || !response.success) {
                throw new Error(response?.message ?? "Failed to update employee");
            }
            toast.success("Employee updated successfully");
            setIsEditOpen(false);
            setEditingUserId(null);
            fetchUsers();
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to update employee"));
        } finally {
            setIsSaving(false);
        }
    };

    // ---------- Delete ----------

    const openDeleteDialog = (user: EmployeeUser) => {
        setDeletingUser(user);
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingUser) return;
        setIsDeleting(true);
        try {
            await private_api_call({
                path: `users/${deletingUser.id}`,
                method: "DELETE",
            });
            toast.success("Employee deleted successfully");
            setIsDeleteOpen(false);
            setDeletingUser(null);
            fetchUsers();
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to delete employee"));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage employees and their hub assignments.
                    </p>
                </div>
                <Button onClick={openCreateDialog}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Employee
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-medium">
                        All Employees
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchUsers()}
                        disabled={isLoading}
                        aria-label="Refresh users"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <Alert variant="destructive">
                            <AlertTitle>Something went wrong</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Assigned Hub</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 6 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-32" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-40" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-5 w-20 rounded-full" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-28" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-24" />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Skeleton className="h-8 w-8 rounded-md" />
                                                        <Skeleton className="h-8 w-8 rounded-md" />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-56 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                                        <UsersIcon className="h-7 w-7" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-foreground">
                                                            No employees yet
                                                        </p>
                                                        <p className="text-xs">
                                                            Add your first employee to start managing your
                                                            team and hub assignments.
                                                        </p>
                                                    </div>
                                                    <Button size="sm" onClick={openCreateDialog}>
                                                        <UserPlus className="mr-2 h-4 w-4" />
                                                        Add Employee
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => {
                                            const roleConfig =
                                                ROLE_CONFIG[user.role] ?? ROLE_CONFIG.ADMIN;
                                            return (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">
                                                        {user.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Mail className="h-3.5 w-3.5" />
                                                            <span className="text-foreground">
                                                                {user.email}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={roleConfig.badgeClassName}
                                                        >
                                                            {roleConfig.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Phone className="h-3.5 w-3.5" />
                                                            <span className="text-foreground">
                                                                {user.phone}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Building2 className="h-3.5 w-3.5" />
                                                            <span className="text-foreground">
                                                                {user.assigned_hub || "—"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label="Edit employee"
                                                                onClick={() => openEditDialog(user)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label="Delete employee"
                                                                onClick={() => openDeleteDialog(user)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Employee Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Employee</DialogTitle>
                        <DialogDescription>
                            Create a new employee record and assign them to a hub.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="create_name">Full Name</Label>
                            <Input
                                id="create_name"
                                value={createForm.name}
                                onChange={(e) => handleCreateChange("name", e.target.value)}
                                placeholder="e.g. Amelia Stone"
                                aria-invalid={!!createErrors.name}
                            />
                            {createErrors.name && (
                                <p className="text-xs text-destructive">{createErrors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="create_password">Password</Label>
                            <Input
                                id="create_password"
                                type="password"
                                value={createForm.password}
                                onChange={(e) => handleCreateChange("password", e.target.value)}
                                placeholder="At least 8 characters"
                                aria-invalid={!!createErrors.password}
                            />
                            {createErrors.password && (
                                <p className="text-xs text-destructive">{createErrors.password}</p>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="create_email">Email</Label>
                                <Input
                                    id="create_email"
                                    type="email"
                                    value={createForm.email}
                                    onChange={(e) => handleCreateChange("email", e.target.value)}
                                    placeholder="e.g. amelia@smartship.com"
                                    aria-invalid={!!createErrors.email}
                                />
                                {createErrors.email && (
                                    <p className="text-xs text-destructive">
                                        {createErrors.email}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create_phone">Phone</Label>
                                <Input
                                    id="create_phone"
                                    value={createForm.phone}
                                    onChange={(e) => handleCreateChange("phone", e.target.value)}
                                    placeholder="e.g. +1 555 123 4567"
                                    aria-invalid={!!createErrors.phone}
                                />
                                {createErrors.phone && (
                                    <p className="text-xs text-destructive">
                                        {createErrors.phone}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="create_role">Role</Label>
                                <Select
                                    value={createForm.role}
                                    onValueChange={(value) => handleCreateChange("role", value)}
                                >
                                    <SelectTrigger id="create_role" aria-invalid={!!createErrors.role}>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLE_OPTIONS.map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {ROLE_CONFIG[role].label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {createErrors.role && (
                                    <p className="text-xs text-destructive">{createErrors.role}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create_hub">Assigned Hub</Label>
                                <Select
                                    value={createForm.assigned_hub}
                                    onValueChange={(value) => handleCreateChange("assigned_hub", value)}
                                >
                                    <SelectTrigger id="create_hub" aria-invalid={!!createErrors.assigned_hub}>
                                        <SelectValue placeholder="Select a hub" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hubs.map((hub) => (
                                            <SelectItem key={hub.hub_id} value={hub.hub_id}>
                                                {hub.hub_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {createErrors.assigned_hub && (
                                    <p className="text-xs text-destructive">
                                        {createErrors.assigned_hub}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                disabled={isCreating}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Employee
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Employee Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                        <DialogDescription>
                            Update this employee&apos;s information and hub assignment.
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingEditUser ? (
                        <div className="space-y-4 py-2">
                            <Skeleton className="h-9 w-full" />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Skeleton className="h-9 w-full" />
                                <Skeleton className="h-9 w-full" />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Skeleton className="h-9 w-full" />
                                <Skeleton className="h-9 w-full" />
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_name">Full Name</Label>
                                <Input
                                    id="edit_name"
                                    value={editForm.name}
                                    onChange={(e) => handleEditChange("name", e.target.value)}
                                    placeholder="e.g. Amelia Stone"
                                    aria-invalid={!!editErrors.name}
                                />
                                {editErrors.name && (
                                    <p className="text-xs text-destructive">{editErrors.name}</p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_email">Email</Label>
                                    <Input
                                        id="edit_email"
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => handleEditChange("email", e.target.value)}
                                        placeholder="e.g. amelia@smartship.com"
                                        aria-invalid={!!editErrors.email}
                                    />
                                    {editErrors.email && (
                                        <p className="text-xs text-destructive">
                                            {editErrors.email}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_phone">Phone</Label>
                                    <Input
                                        id="edit_phone"
                                        value={editForm.phone}
                                        onChange={(e) => handleEditChange("phone", e.target.value)}
                                        placeholder="e.g. +1 555 123 4567"
                                        aria-invalid={!!editErrors.phone}
                                    />
                                    {editErrors.phone && (
                                        <p className="text-xs text-destructive">
                                            {editErrors.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_role">Role</Label>
                                    <Select
                                        value={editForm.role}
                                        onValueChange={(value) => handleEditChange("role", value)}
                                    >
                                        <SelectTrigger id="edit_role" aria-invalid={!!editErrors.role}>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLE_OPTIONS.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {ROLE_CONFIG[role].label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {editErrors.role && (
                                        <p className="text-xs text-destructive">{editErrors.role}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_hub">Assigned Hub</Label>
                                    <Select
                                        value={editForm.assigned_hub}
                                        onValueChange={(value) => handleEditChange("assigned_hub", value)}
                                    >
                                        <SelectTrigger id="edit_hub" aria-invalid={!!editErrors.assigned_hub}>
                                            <SelectValue placeholder="Select a hub" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {hubs.map((hub) => (
                                                <SelectItem key={hub.hub_id} value={hub.hub_id}>
                                                    {hub.hub_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {editErrors.assigned_hub && (
                                        <p className="text-xs text-destructive">
                                            {editErrors.assigned_hub}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditOpen(false)}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Employee</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this employee?
                        </DialogDescription>
                    </DialogHeader>
                    {deletingUser && (
                        <div className="rounded-md border bg-muted/40 p-3 text-sm">
                            <p className="font-medium">{deletingUser.name}</p>
                            <p className="text-muted-foreground">{deletingUser.email}</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}