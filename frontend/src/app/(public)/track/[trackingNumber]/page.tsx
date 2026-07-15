"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Package,
    MapPin,
    Calendar,
    Clock,
    Hash,
    CheckCircle2,
    CircleDot,
    ArrowLeft,
} from "lucide-react";

import { public_api_call } from "@/actions/public_api_call";
import { STATUS_CONFIG } from "@/lib/constants/shipment-status";
import type { ShipmentStatus } from "@/lib/types/shipment";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";

// =========================================================
// TYPES (kept local to this page — exact response shape from
// GET /tracking/{tracking_number} isn't confirmed, so both a
// joined-name shape and a raw-id shape are supported defensively.
// =========================================================

type TrackingTimelineEvent = {
    event_id?: string;
    id?: string;
    status?: string;
    status_id?: number;
    event_time?: string;
    hub?: string;
    remarks?: string | null;
};

type TrackingDetail = {
    tracking_number: string;
    status?: string;
    status_id?: number;
    current_hub?: string;
    expected_delivery_date?: string;
    updated_at?: string;
    timeline: TrackingTimelineEvent[];
};

// shipment_statuses is a fixed, small lookup table with no dedicated
// endpoint — used only as a fallback if the tracking response ever sends
// status_id instead of a joined status name.
const STATUS_ID_TO_NAME: Record<number, ShipmentStatus> = {
    1: "CREATED",
    2: "PICKED_UP",
    3: "ARRIVED_HUB",
    4: "DEPARTED_HUB",
    5: "OUT_FOR_DELIVERY",
    6: "DELIVERED",
    7: "DELIVERY_FAILED",
};

function resolveStatusName(raw: { status?: string; status_id?: number }): ShipmentStatus {
    if (raw.status) return raw.status as ShipmentStatus;
    if (typeof raw.status_id === "number") {
        return STATUS_ID_TO_NAME[raw.status_id] ?? "CREATED";
    }
    return "CREATED";
}

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

export default function TrackingDetailPage() {
    const params = useParams<{ trackingNumber: string }>();
    const router = useRouter();
    const trackingNumber = decodeURIComponent(params.trackingNumber ?? "");

    const [detail, setDetail] = useState<TrackingDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTracking = async () => {
        setIsLoading(true);
        setError(null);
        setNotFound(false);
        try {
            const response = await public_api_call({
                path: `tracking/${trackingNumber}`,
                method: "GET",
            });

            if (!response.success) {
                // Distinguish "doesn't exist" from a genuine backend error so
                // real failures don't get silently mislabeled as "not found".
                const message = response.message ?? "";
                if (message.toLowerCase().includes("not found")) {
                    setNotFound(true);
                } else {
                    setError(
                        message || "We couldn't fetch this shipment right now. Please try again in a moment."
                    );
                }
                setDetail(null);
                return;
            }

            if (!response.data) {
                setNotFound(true);
                setDetail(null);
                return;
            }

            setDetail(response.data);
        } catch (err) {
            setError(
                "We couldn't fetch this shipment right now. Please try again in a moment."
            );
            setDetail(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (trackingNumber) {
            fetchTracking();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackingNumber]);

    const statusName = detail ? resolveStatusName(detail) : null;
    const statusConfig = statusName
        ? STATUS_CONFIG[statusName] ?? STATUS_CONFIG.CREATED
        : null;

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12 sm:py-16">
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Shipment Tracking
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Real-time status for tracking number{" "}
                        <span className="font-medium text-foreground">
                            {trackingNumber}
                        </span>
                    </p>
                </div>

                {isLoading && (
                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                        </Card>
                        <div className="flex flex-col gap-3">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </div>
                )}

                {!isLoading && error && (
                    <div className="flex flex-col gap-4">
                        <Alert variant="destructive">
                            <AlertTitle>Something went wrong</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        <Button
                            variant="outline"
                            className="w-fit"
                            onClick={() => router.push("/public/track")}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Tracking
                        </Button>
                    </div>
                )}

                {!isLoading && !error && notFound && (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <Package className="h-10 w-10 text-muted-foreground" />
                            <p className="text-base font-medium">Shipment not found</p>
                            <p className="max-w-sm text-sm text-muted-foreground">
                                The tracking number does not exist.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-2"
                                onClick={() => router.push("/public/track")}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Tracking
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {!isLoading && !error && !notFound && detail && statusConfig && (
                    <div className="flex flex-col gap-6">
                        <Card className="overflow-hidden">
                            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                    {detail.tracking_number}
                                </CardTitle>
                                <Badge
                                    variant="outline"
                                    className={`w-fit text-sm ${statusConfig.badgeClassName}`}
                                >
                                    {statusConfig.label}
                                </Badge>
                            </CardHeader>
                            <Separator />
                            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Current Hub
                                        </p>
                                        <p className="text-sm font-medium">
                                            {detail.current_hub || "—"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Expected Delivery Date
                                        </p>
                                        <p className="text-sm font-medium">
                                            {formatDate(detail.expected_delivery_date)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Last Updated
                                        </p>
                                        <p className="text-sm font-medium">
                                            {formatDate(detail.updated_at)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div>
                            <h2 className="mb-4 text-base font-medium">
                                Shipment Timeline
                            </h2>
                            {detail.timeline.length === 0 ? (
                                <Card>
                                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                                        No status updates yet.
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {detail.timeline.map((event, index) => {
                                        const eventStatusName = resolveStatusName(event);
                                        const eventConfig =
                                            STATUS_CONFIG[eventStatusName] ?? STATUS_CONFIG.CREATED;
                                        const isLatest = index === 0;
                                        return (
                                            <Card
                                                key={event.event_id ?? event.id ?? index}
                                                className={
                                                    isLatest ? "border-primary/40 shadow-sm" : ""
                                                }
                                            >
                                                <CardContent className="flex items-start gap-4 py-5">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                                                        {isLatest ? (
                                                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                        ) : (
                                                            <CircleDot className="h-5 w-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-1 flex-col gap-2">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={eventConfig.badgeClassName}
                                                            >
                                                                {eventConfig.label}
                                                            </Badge>
                                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                {formatDate(event.event_time)}
                                                            </span>
                                                        </div>
                                                        {event.hub && (
                                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                                <MapPin className="h-3.5 w-3.5" />
                                                                <span className="text-foreground">
                                                                    {event.hub}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {event.remarks && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {event.remarks}
                                                            </p>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}