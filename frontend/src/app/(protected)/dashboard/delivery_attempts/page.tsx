"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Loader2,
    Truck,
    User,
    Clock,
    Inbox,
    PlusCircle,
    PackageSearch,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from "lucide-react";

import { private_api_call } from "@/actions/private_api_call";

// Self-contained types mirroring the backend's delivery_attempt schemas.
// Replace with an import from a shared types file if/when one exists.
type DeliveryAttemptResult =
    | "SUCCESS"
    | "FAILED"
    | "CUSTOMER_UNAVAILABLE"
    | "WRONG_ADDRESS"
    | "REJECTED";

interface DeliveryAttempt {
    attempt_id: string;
    shipment_id: string;
    rider_id: string;
    result: DeliveryAttemptResult;
    remarks: string | null;
    attempt_time: string;
}

interface DeliveryAttemptListResponse {
    attempts: DeliveryAttempt[];
    total: number;
}

const RESULT_OPTIONS: { value: DeliveryAttemptResult; label: string }[] = [
    { value: "SUCCESS", label: "Success" },
    { value: "FAILED", label: "Failed" },
    { value: "CUSTOMER_UNAVAILABLE", label: "Customer Unavailable" },
    { value: "WRONG_ADDRESS", label: "Wrong Address" },
    { value: "REJECTED", label: "Rejected" },
];

async function getShipmentByTracking(tracking_number: string) {
    try {
        const response = await private_api_call({
            path: `shipments/tracking/${tracking_number}`,
            method: "GET",
        });
        return response;
    } catch (error) {
        return error;
    }
}

async function getDeliveryAttempts(shipment_id: string) {
    try {
        const response = await private_api_call({
            path: `delivery-attempts/${shipment_id}`,
            method: "GET",
        });
        return response;
    } catch (error) {
        return error;
    }
}

async function createDeliveryAttempt(
    shipment_id: string,
    result: DeliveryAttemptResult,
    remarks: string
) {
    try {
        const response = await private_api_call({
            path: "delivery-attempts",
            method: "POST",
            body: {
                shipment_id,
                result,
                remarks: remarks || null,
            },
        });
        return response;
    } catch (error) {
        return error;
    }
}

// Narrows the return value of the helper calls above (which can be the
// private_api_call result OR a raw Error thrown inside the try/catch)
// down to the shape we can safely read `.success` / `.data` / `.message` from.
function isApiResult(
    value: unknown
): value is { success: boolean; data: unknown; message?: string } {
    return typeof value === "object" && value !== null && "success" in value;
}

function resultBadge(result: DeliveryAttemptResult) {
    switch (result) {
        case "SUCCESS":
            return (
                <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Success
                </Badge>
            );
        case "FAILED":
            return (
                <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3.5 w-3.5" />
                    Failed
                </Badge>
            );
        case "CUSTOMER_UNAVAILABLE":
            return (
                <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Customer Unavailable
                </Badge>
            );
        case "WRONG_ADDRESS":
            return (
                <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Wrong Address
                </Badge>
            );
        case "REJECTED":
            return (
                <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3.5 w-3.5" />
                    Rejected
                </Badge>
            );
        default:
            return <Badge variant="secondary">{result}</Badge>;
    }
}

export default function DeliveryAttemptsPage() {
    const [trackingNumber, setTrackingNumber] = useState("");
    const [shipmentId, setShipmentId] = useState("");
    const [loadedTrackingNumber, setLoadedTrackingNumber] = useState<
        string | null
    >(null);
    const [attempts, setAttempts] = useState<DeliveryAttempt[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);
    const [isSubmittingAttempt, setIsSubmittingAttempt] = useState(false);

    const [selectedResult, setSelectedResult] =
        useState<DeliveryAttemptResult | "">("");
    const [remarks, setRemarks] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const notifyError = (message: string) => {
        setErrorMessage(message);
        if (typeof toast !== "undefined") {
            toast.error(message);
        }
    };

    const notifySuccess = (message: string) => {
        if (typeof toast !== "undefined") {
            toast.success(message);
        }
    };

    const fetchAttempts = async (id: string) => {
        setIsLoadingAttempts(true);
        setErrorMessage(null);
        try {
            const response = await getDeliveryAttempts(id);

            if (!isApiResult(response)) {
                notifyError(
                    response instanceof Error
                        ? response.message
                        : "Failed to load delivery attempts."
                );
                setAttempts([]);
                return;
            }

            if (!response.success) {
                notifyError(response.message || "Failed to load delivery attempts.");
                setAttempts([]);
                return;
            }

            const data = response.data as DeliveryAttemptListResponse;
            // Backend already orders newest first.
            setAttempts(data?.attempts ?? []);
        } catch (error) {
            notifyError(
                error instanceof Error
                    ? error.message
                    : "Failed to load delivery attempts."
            );
            setAttempts([]);
        } finally {
            setIsLoadingAttempts(false);
        }
    };

    const handleLoadAttempts = async () => {
        const trimmedTracking = trackingNumber.trim();
        if (!trimmedTracking) {
            notifyError("Please enter a Tracking Number.");
            return;
        }

        setIsLoadingAttempts(true);
        setErrorMessage(null);
        try {
            const shipmentResponse = await getShipmentByTracking(trimmedTracking);

            if (!isApiResult(shipmentResponse)) {
                notifyError(
                    shipmentResponse instanceof Error
                        ? shipmentResponse.message
                        : "Failed to look up shipment."
                );
                setIsLoadingAttempts(false);
                return;
            }

            if (!shipmentResponse.success) {
                notifyError(
                    shipmentResponse.message ||
                    "No shipment found for that tracking number."
                );
                setIsLoadingAttempts(false);
                return;
            }

            const resolvedShipmentId = (
                shipmentResponse.data as { shipment_id?: string } | null
            )?.shipment_id;

            if (!resolvedShipmentId) {
                notifyError("No shipment found for that tracking number.");
                setIsLoadingAttempts(false);
                return;
            }

            setShipmentId(resolvedShipmentId);
            setLoadedTrackingNumber(trimmedTracking);
            setHasSearched(true);
            await fetchAttempts(resolvedShipmentId);
        } catch (error) {
            notifyError(
                error instanceof Error ? error.message : "Failed to look up shipment."
            );
            setIsLoadingAttempts(false);
        }
    };

    const handleLogAttempt = async () => {
        if (!shipmentId) {
            notifyError("Load a shipment before logging an attempt.");
            return;
        }

        if (!selectedResult) {
            notifyError("Please select a result.");
            return;
        }

        setIsSubmittingAttempt(true);
        setErrorMessage(null);
        try {
            const response = await createDeliveryAttempt(
                shipmentId,
                selectedResult,
                remarks.trim()
            );

            if (!isApiResult(response)) {
                notifyError(
                    response instanceof Error
                        ? response.message
                        : "Failed to log delivery attempt."
                );
                return;
            }

            if (!response.success) {
                notifyError(response.message || "Failed to log delivery attempt.");
                return;
            }

            setSelectedResult("");
            setRemarks("");
            notifySuccess("Delivery attempt logged successfully.");
            await fetchAttempts(shipmentId);
        } catch (error) {
            notifyError(
                error instanceof Error
                    ? error.message
                    : "Failed to log delivery attempt."
            );
        } finally {
            setIsSubmittingAttempt(false);
        }
    };

    const formatAttemptTime = (isoDate: string) => {
        try {
            return new Date(isoDate).toLocaleString();
        } catch {
            return isoDate;
        }
    };

    const isBusy = isLoadingAttempts || isSubmittingAttempt;

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Delivery Attempts
                </h1>
                <p className="text-sm text-muted-foreground">
                    Look up a shipment to view its delivery attempt history, or log a
                    new attempt.
                </p>
            </div>

            {/* Search Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Find a Shipment</CardTitle>
                    <CardDescription>
                        Enter a Tracking Number and load its delivery attempts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex flex-1 flex-col gap-1.5">
                            <Label htmlFor="tracking-number">Tracking Number</Label>
                            <Input
                                id="tracking-number"
                                placeholder="e.g. SHP-1001"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleLoadAttempts();
                                    }
                                }}
                                disabled={isBusy}
                            />
                        </div>
                        <Button
                            onClick={handleLoadAttempts}
                            disabled={isBusy}
                            className="sm:w-auto"
                        >
                            {isLoadingAttempts ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Load Attempts
                                </>
                            )}
                        </Button>
                    </div>
                    {errorMessage && (
                        <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
                    )}
                </CardContent>
            </Card>

            {hasSearched && (
                <>
                    <Separator />

                    {/* Attempts List */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Delivery attempts for{" "}
                                <span className="font-semibold text-foreground">
                                    {loadedTrackingNumber}
                                </span>
                            </h2>
                        </div>

                        {isLoadingAttempts ? (
                            <div className="flex flex-col gap-3">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : attempts.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                    <Inbox className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm font-medium">No delivery attempts yet</p>
                                    <p className="text-sm text-muted-foreground">
                                        This shipment doesn&apos;t have any delivery attempts
                                        logged. Add the first one below.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {attempts.map((attempt) => (
                                    <Card key={attempt.attempt_id}>
                                        <CardContent className="flex flex-col gap-2 py-4">
                                            <div className="flex items-center justify-between gap-2">
                                                {resultBadge(attempt.result)}
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatAttemptTime(attempt.attempt_time)}
                                                </span>
                                            </div>
                                            {attempt.remarks && (
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                                    {attempt.remarks}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <User className="h-3.5 w-3.5" />
                                                Rider: {attempt.rider_id}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Log Attempt */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Log Delivery Attempt</CardTitle>
                            <CardDescription>
                                Record the outcome of a delivery attempt for this shipment.
                                Only delivery riders can log attempts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="attempt-result">Result</Label>
                                <Select
                                    value={selectedResult}
                                    onValueChange={(value) =>
                                        setSelectedResult(value as DeliveryAttemptResult)
                                    }
                                    disabled={isBusy}
                                >
                                    <SelectTrigger id="attempt-result">
                                        <SelectValue placeholder="Select a result" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RESULT_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="attempt-remarks">Remarks (optional)</Label>
                                <Textarea
                                    id="attempt-remarks"
                                    placeholder="Add any notes about this attempt..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    disabled={isBusy}
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button onClick={handleLogAttempt} disabled={isBusy}>
                                {isSubmittingAttempt ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Logging...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Log Attempt
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </>
            )}

            {!hasSearched && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <PackageSearch className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">No shipment loaded</p>
                        <p className="text-sm text-muted-foreground">
                            Enter a Tracking Number above and click Load Attempts to get
                            started.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}