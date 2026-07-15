"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    Truck,
    Plus,
    Loader2,
    CheckCircle2,
    PackageSearch,
    User,
} from "lucide-react";

import { private_api_call } from "@/actions/private_api_call";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// =========================================================
// TYPES (kept inline in this module — no extra files)
// =========================================================

type AssignmentStatus = "ASSIGNED" | "COMPLETED";

type Assignment = {
    assignment_id: string;
    shipment_id: string;
    rider_id: string;
    status: AssignmentStatus;
    assigned_at: string;
    completed_at: string | null;
    // Optional — present only if the backend joins these in.
    tracking_number?: string;
    receiver_name?: string;
    rider_name?: string;
};

type ShipmentOption = {
    shipment_id: string;
    tracking_number: string;
    receiver_name: string;
    delivery_address: string;
};

type RiderOption = {
    user_id: string;
    full_name: string;
    role: string;
};

const STATUS_BADGE: Record<AssignmentStatus, { label: string; className: string }> = {
    ASSIGNED: {
        label: "Assigned",
        className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    },
    COMPLETED: {
        label: "Completed",
        className: "bg-green-100 text-green-700 hover:bg-green-100",
    },
};

// =========================================================
// PAGE
// =========================================================

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [shipments, setShipments] = useState<ShipmentOption[]>([]);
    const [riders, setRiders] = useState<RiderOption[]>([]);
    const [loading, setLoading] = useState(true);

    const [riderFilter, setRiderFilter] = useState<string>("ALL");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedShipmentId, setSelectedShipmentId] = useState<string>("");
    const [selectedRiderId, setSelectedRiderId] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);

    const [completingId, setCompletingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [assignmentsRes, shipmentsRes, usersRes] = await Promise.all([
                private_api_call({ path: "assignments", method: "GET" }),
                private_api_call({ path: "shipments", method: "GET" }),
                private_api_call({ path: "users", method: "GET" }),
            ]);

            if (!assignmentsRes.success) {
                toast.error(assignmentsRes.message ?? "Failed to load assignments");
            } else {
                setAssignments(assignmentsRes.data ?? []);
            }

            if (shipmentsRes.success) {
                setShipments(shipmentsRes.data ?? []);
            }

            if (usersRes.success) {
                const riderList = (usersRes.data ?? []).filter(
                    (u: RiderOption) => u.role === "DELIVERY_RIDER"
                );
                setRiders(riderList);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load assignments");
        } finally {
            setLoading(false);
        }
    }

    const shipmentsById = useMemo(() => {
        const map = new Map<string, ShipmentOption>();
        shipments.forEach((s) => map.set(s.shipment_id, s));
        return map;
    }, [shipments]);

    const ridersById = useMemo(() => {
        const map = new Map<string, RiderOption>();
        riders.forEach((r) => map.set(r.user_id, r));
        return map;
    }, [riders]);

    function resolveTracking(a: Assignment) {
        return a.tracking_number ?? shipmentsById.get(a.shipment_id)?.tracking_number ?? `#${a.shipment_id}`;
    }

    function resolveReceiver(a: Assignment) {
        return a.receiver_name ?? shipmentsById.get(a.shipment_id)?.receiver_name ?? "—";
    }

    function resolveRiderName(a: Assignment) {
        return a.rider_name ?? ridersById.get(a.rider_id)?.full_name ?? `#${a.rider_id}`;
    }

    const visibleAssignments = useMemo(() => {
        if (riderFilter === "ALL") return assignments;
        return assignments.filter((a) => String(a.rider_id) === riderFilter);
    }, [assignments, riderFilter]);

    function openCreateDialog() {
        setSelectedShipmentId("");
        setSelectedRiderId("");
        setDialogOpen(true);
    }

    async function handleCreateAssignment() {
        if (!selectedShipmentId || !selectedRiderId) {
            toast.error("Please select both a shipment and a rider");
            return;
        }

        try {
            setSubmitting(true);
            const res = await private_api_call({
                path: "assignments",
                method: "POST",
                body: {
                    shipment_id: selectedShipmentId,
                    rider_id: selectedRiderId,
                },
            });

            if (!res.success) {
                toast.error(res.message ?? "Failed to create assignment");
                return;
            }

            setAssignments((prev) => [...prev, res.data]);
            toast.success("Rider assigned successfully");
            setDialogOpen(false);
            setSelectedShipmentId("");
            setSelectedRiderId("");
        } catch (err) {
            console.error(err);
            toast.error("Failed to create assignment");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleComplete(assignment: Assignment) {
        try {
            setCompletingId(assignment.assignment_id);
            const res = await private_api_call({
                path: `assignments/${assignment.assignment_id}/complete`,
                method: "PUT",
            });

            if (!res.success) {
                toast.error(res.message ?? "Failed to complete assignment");
                return;
            }

            setAssignments((prev) =>
                prev.map((a) =>
                    a.assignment_id === assignment.assignment_id ? res.data : a
                )
            );
            toast.success("Assignment marked as completed");
        } catch (err) {
            console.error(err);
            toast.error("Failed to complete assignment");
        } finally {
            setCompletingId(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Assignments</h1>
                    <p className="text-sm text-muted-foreground">
                        Assign riders to shipments and track delivery completion.
                    </p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Rider
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Truck className="h-4 w-4" />
                        All Assignments
                    </CardTitle>

                    <div className="w-[220px]">
                        <Select value={riderFilter} onValueChange={setRiderFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by rider" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Riders</SelectItem>
                                {riders.map((r) => (
                                    <SelectItem key={r.user_id} value={String(r.user_id)}>
                                        {r.full_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : visibleAssignments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <PackageSearch className="mb-3 h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                No assignments found.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tracking Number</TableHead>
                                    <TableHead>Receiver</TableHead>
                                    <TableHead>Rider</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Assigned At</TableHead>
                                    <TableHead>Completed At</TableHead>
                                    <TableHead className="w-[140px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleAssignments.map((a) => (
                                    <TableRow key={a.assignment_id}>
                                        <TableCell className="font-medium">
                                            {resolveTracking(a)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {resolveReceiver(a)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-1">
                                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                                {resolveRiderName(a)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={STATUS_BADGE[a.status].className} variant="secondary">
                                                {STATUS_BADGE[a.status].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {a.assigned_at ? new Date(a.assigned_at).toLocaleString() : "—"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {a.completed_at ? new Date(a.completed_at).toLocaleString() : "—"}
                                        </TableCell>
                                        <TableCell>
                                            {a.status !== "COMPLETED" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleComplete(a)}
                                                    disabled={completingId === a.assignment_id}
                                                >
                                                    {completingId === a.assignment_id ? (
                                                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                                                    )}
                                                    Complete
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Assign Rider Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Rider</DialogTitle>
                        <DialogDescription>
                            Select a shipment and a rider to create a new delivery assignment.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Shipment</Label>
                            <Select value={selectedShipmentId} onValueChange={setSelectedShipmentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a shipment" />
                                </SelectTrigger>
                                <SelectContent>
                                    {shipments.map((s) => (
                                        <SelectItem key={s.shipment_id} value={String(s.shipment_id)}>
                                            {s.tracking_number} — {s.receiver_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Rider</Label>
                            <Select value={selectedRiderId} onValueChange={setSelectedRiderId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a rider" />
                                </SelectTrigger>
                                <SelectContent>
                                    {riders.map((r) => (
                                        <SelectItem key={r.user_id} value={String(r.user_id)}>
                                            {r.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                        <Button onClick={handleCreateAssignment} disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Assign Rider
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}