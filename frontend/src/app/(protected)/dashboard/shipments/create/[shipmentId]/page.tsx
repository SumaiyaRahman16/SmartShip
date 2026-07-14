"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    ArrowLeft,
    Loader2,
    MapPin,
    Phone,
    User,
    Calendar,
    Building2,
    Clock,
    CheckCircle2,
} from "lucide-react";

import { private_api_call } from "@/actions/private_api_call";

import type { Shipment, ShipmentEvent } from "@/lib/types/shipment";
import { STATUS_CONFIG, SHIPMENT_STATUSES } from "@/lib/constants/shipment-status";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";

function formatDate(value?: string) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ShipmentDetailPage() {
    const params = useParams<{ shipmentId: string }>();
    const router = useRouter();
    const shipmentId = params.shipmentId;

    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [events, setEvents] = useState<ShipmentEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newStatus, setNewStatus] = useState<string>("");
    const [remarks, setRemarks] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [shipmentRes, eventsRes] = await Promise.all([
                private_api_call({
                    path: `/shipments/${shipmentId}`,
                    method: "GET",
                }),
                private_api_call({
                    path: `/shipment-events/${shipmentId}`,
                    method: "GET",
                }),
            ]);

            const shipmentData: Shipment = shipmentRes?.data ?? shipmentRes;
            const eventsData: ShipmentEvent[] = Array.isArray(eventsRes)
                ? eventsRes
                : eventsRes?.data ?? [];

            setShipment(shipmentData);
            setEvents(
                [...eventsData].sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                )
            );
            setNewStatus(shipmentData?.status ?? "");
        } catch (err) {
            setError("We couldn't load this shipment. Please try again.");
            toast.error("Failed to load shipment");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (shipmentId) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shipmentId]);

    const handleUpdateStatus = async () => {
        if (!newStatus) {
            toast.error("Please select a status");
            return;
        }
        if (!remarks.trim()) {
            toast.error("Please add remarks for this update");
            return;
        }

        setIsUpdating(true);
        try {
            await private_api_call({
                path: `/shipments/${shipmentId}`,
                method: "PUT",
                body: { status: newStatus },
            });

            await private_api_call({
                path: "/shipment-events",
                method: "POST",
                body: {
                    shipment_id: shipmentId,
                    status: newStatus,
                    remarks: remarks.trim(),
                },
            });

            toast.success("Shipment status updated");
            setRemarks("");
            await fetchData();
        } catch (err) {
            toast.error("Failed to update status. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 p-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-6 lg:grid-cols-3">
                    <Skeleton className="h-64 lg:col-span-2" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (error || !shipment) {
        return (
            <div className="flex flex-col gap-6 p-6">
                <Button
                    variant="ghost"
                    className="w-fit"
                    onClick={() => router.push("/dashboard/shipments")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Shipments
                </Button>
                <Alert variant="destructive">
                    <AlertTitle>Something went wrong</AlertTitle>
                    <AlertDescription>
                        {error ?? "Shipment not found."}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const statusConfig = STATUS_CONFIG[shipment.status] ?? STATUS_CONFIG.PENDING;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/dashboard/shipments")}
                        aria-label="Back to shipments"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {shipment.tracking_number}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Shipment details and delivery timeline
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className={`w-fit ${statusConfig.badgeClassName}`}>
                    {statusConfig.label}
                </Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="flex flex-col gap-6 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-medium">
                                Shipment Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        Sender
                                    </h3>
                                    <div className="flex items-start gap-2 text-sm">
                                        <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <span>{shipment.sender_name}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm">
                                        <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <span>{shipment.sender_phone}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        Receiver
                                    </h3>
                                    <div className="flex items-start gap-2 text-sm">
                                        <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <span>{shipment.receiver_name}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm">
                                        <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <span>{shipment.receiver_phone}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <span>{shipment.delivery_address}</span>
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-6" />

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        Routing
                                    </h3>
                                    <div className="flex items-start gap-2 text-sm">
                                        <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <span>
                                            {shipment.origin_hub} → {shipment.destination_hub}
                                        </span>
                                    </div>
                                    {shipment.current_hub && (
                                        <div className="flex items-start gap-2 text-sm">
                                            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                            <span>Currently at {shipment.current_hub}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        Delivery
                                    </h3>
                                    <div className="flex items-start gap-2 text-sm">
                                        <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <span>
                                            Expected {formatDate(shipment.expected_delivery_date)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-medium">Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {events.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    No status updates yet.
                                </p>
                            ) : (
                                <ol className="relative space-y-6 border-l pl-6">
                                    {events.map((event, index) => {
                                        const eventStatusConfig =
                                            STATUS_CONFIG[event.status] ?? STATUS_CONFIG.PENDING;
                                        return (
                                            <li key={event.id} className="relative">
                                                <span className="absolute -left-[29px] flex h-5 w-5 items-center justify-center rounded-full bg-background">
                                                    {index === 0 ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                    ) : (
                                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </span>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={eventStatusConfig.badgeClassName}
                                                    >
                                                        {eventStatusConfig.label}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(event.created_at)}
                                                    </span>
                                                </div>
                                                {event.remarks && (
                                                    <p className="mt-1 text-sm text-foreground">
                                                        {event.remarks}
                                                    </p>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ol>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-medium">
                                Update Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">New Status</p>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SHIPMENT_STATUSES.map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {STATUS_CONFIG[status].label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium">Remarks</p>
                                <Textarea
                                    placeholder="Add a note about this update..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows={4}
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleUpdateStatus}
                                disabled={isUpdating}
                            >
                                {isUpdating && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Update
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}