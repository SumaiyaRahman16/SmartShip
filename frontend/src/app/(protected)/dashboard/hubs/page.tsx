"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Building2,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    MapPin,
} from "lucide-react";

import { private_api_call } from "@/actions/private_api_call"; // existing server action, do not recreate — adjust path if it lives elsewhere

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// =========================================================
// TYPES (kept inline in this module — no extra files)
// =========================================================

type Hub = {
    hub_id: number;
    hub_name: string;
    city: string;
    address: string;
    created_at: string;
};

type HubFormState = {
    hub_name: string;
    city: string;
    address: string;
};

const EMPTY_FORM: HubFormState = {
    hub_name: "",
    city: "",
    address: "",
};

// =========================================================
// PAGE
// =========================================================

export default function HubsPage() {
    const [hubs, setHubs] = useState<Hub[]>([]);
    const [loading, setLoading] = useState(true);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingHub, setEditingHub] = useState<Hub | null>(null);
    const [form, setForm] = useState<HubFormState>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<Hub | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchHubs();
    }, []);

    async function fetchHubs() {
        try {
            setLoading(true);
            const res = await private_api_call({ path: "hubs", method: "GET" });
            if (!res.success) {
                toast.error(res.message ?? "Failed to load hubs");
                return;
            }
            setHubs(res.data ?? []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load hubs");
        } finally {
            setLoading(false);
        }
    }

    function openCreateDialog() {
        setEditingHub(null);
        setForm(EMPTY_FORM);
        setDialogOpen(true);
    }

    function openEditDialog(hub: Hub) {
        setEditingHub(hub);
        setForm({
            hub_name: hub.hub_name,
            city: hub.city,
            address: hub.address,
        });
        setDialogOpen(true);
    }

    async function handleSubmit() {
        if (!form.hub_name.trim() || !form.city.trim() || !form.address.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            setSubmitting(true);

            if (editingHub) {
                const res = await private_api_call({
                    path: `hubs/${editingHub.hub_id}`,
                    method: "PUT",
                    body: form,
                });
                if (!res.success) {
                    toast.error(res.message ?? "Failed to update hub");
                    return;
                }
                setHubs((prev) =>
                    prev.map((h) => (h.hub_id === editingHub.hub_id ? res.data : h))
                );
                toast.success("Hub updated successfully");
            } else {
                const res = await private_api_call({
                    path: "hubs",
                    method: "POST",
                    body: form,
                });
                if (!res.success) {
                    toast.error(res.message ?? "Failed to create hub");
                    return;
                }
                setHubs((prev) => [...prev, res.data]);
                toast.success("Hub created successfully");
            }

            setDialogOpen(false);
            setEditingHub(null);
            setForm(EMPTY_FORM);
        } catch (err) {
            console.error(err);
            toast.error(editingHub ? "Failed to update hub" : "Failed to create hub");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;

        try {
            setDeleting(true);
            const res = await private_api_call({
                path: `hubs/${deleteTarget.hub_id}`,
                method: "DELETE",
            });
            if (!res.success) {
                toast.error(res.message ?? "Failed to delete hub");
                return;
            }
            setHubs((prev) => prev.filter((h) => h.hub_id !== deleteTarget.hub_id));
            toast.success("Hub deleted successfully");
            setDeleteTarget(null);
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete hub");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Hubs</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage logistics hubs used across shipments and assignments.
                    </p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Hub
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="h-4 w-4" />
                        All Hubs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : hubs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Building2 className="mb-3 h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                No hubs found. Create your first hub to get started.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Hub Name</TableHead>
                                    <TableHead>City</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hubs.map((hub) => (
                                    <TableRow key={hub.hub_id}>
                                        <TableCell className="font-medium">
                                            {hub.hub_name}
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {hub.city}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {hub.address}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditDialog(hub)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => setDeleteTarget(hub)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingHub ? "Edit Hub" : "Add Hub"}</DialogTitle>
                        <DialogDescription>
                            {editingHub
                                ? "Update the details for this hub."
                                : "Create a new logistics hub."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="hub_name">Hub Name</Label>
                            <Input
                                id="hub_name"
                                value={form.hub_name}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, hub_name: e.target.value }))
                                }
                                placeholder="e.g. Dhaka Central Hub"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                value={form.city}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, city: e.target.value }))
                                }
                                placeholder="e.g. Dhaka"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={form.address}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, address: e.target.value }))
                                }
                                placeholder="e.g. House 12, Road 5, Banani"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingHub ? "Save Changes" : "Create Hub"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Hub</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-medium">{deleteTarget?.hub_name}</span>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}