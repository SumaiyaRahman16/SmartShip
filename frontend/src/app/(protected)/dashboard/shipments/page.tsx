"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, Plus, Search, Eye, RefreshCw } from "lucide-react";

export { private_api_call } from "@/actions/private_api_call";
export { public_api_call } from "@/actions/public_api_call";
import type { Shipment } from "@/lib/types/shipment";
import { STATUS_CONFIG } from "@/lib/constants/shipment-status";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { private_api_call } from "@/actions/private_api_call";

export default function ShipmentsListPage() {
    const router = useRouter();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const fetchShipments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await private_api_call({
                path: "shipments",
                method: "GET",
            });
            if (response && response.success && Array.isArray(response.data)) {
                setShipments(response.data);
            } else if (Array.isArray(response)) {
                setShipments(response);
            } else {
                setError(response?.message ?? "We couldn't load shipments. Please try again.");
                toast.error(response?.message ?? "Failed to load shipments");
            }
        } catch (err) {
            setError("We couldn't load shipments. Please try again.");
            toast.error("Failed to load shipments");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShipments();
    }, []);

    const filteredShipments = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return shipments;
        return shipments.filter((shipment) => {
            return (
                shipment.tracking_number?.toLowerCase().includes(query) ||
                shipment.receiver_name?.toLowerCase().includes(query) ||
                shipment.status?.toLowerCase().includes(query)
            );
        });
    }, [shipments, search]);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Shipments</h1>
                    <p className="text-sm text-muted-foreground">
                        Track and manage all shipments across your network.
                    </p>
                </div>
                <Button onClick={() => router.push("/dashboard/shipments/create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Shipment
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-base font-medium">All Shipments</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by tracking #, receiver, status"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchShipments}
                            disabled={isLoading}
                            aria-label="Refresh shipments"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                            />
                        </Button>
                    </div>
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
                                        <TableHead>Tracking Number</TableHead>
                                        <TableHead>Receiver</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
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
                                                    <Skeleton className="h-4 w-28" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-5 w-24 rounded-full" />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredShipments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-40 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                    <Package className="h-8 w-8" />
                                                    <p className="text-sm font-medium">
                                                        No shipments found
                                                    </p>
                                                    <p className="text-xs">
                                                        {search
                                                            ? "Try adjusting your search."
                                                            : "Create your first shipment to get started."}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredShipments.map((shipment) => {
                                            const statusConfig =
                                                STATUS_CONFIG[shipment.status] ??
                                                STATUS_CONFIG.CREATED;
                                            return (
                                                <TableRow key={shipment.shipment_id}>
                                                    <TableCell className="font-medium">
                                                        {shipment.tracking_number}
                                                    </TableCell>
                                                    <TableCell>{shipment.receiver_name}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={statusConfig.badgeClassName}
                                                        >
                                                            {statusConfig.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="View shipment"
                                                            onClick={() =>
                                                                router.push(
                                                                    `/dashboard/shipments/${shipment.shipment_id}`
                                                                )
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
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
        </div>
    );
}