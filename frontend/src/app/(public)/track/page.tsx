"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Search, Truck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PublicTrackingSearchPage() {
    const router = useRouter();
    const [trackingNumber, setTrackingNumber] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        const query = trackingNumber.trim();
        if (!query) {
            setError("Please enter a tracking number");
            return;
        }
        setError(null);
        router.push(`/tracking/${encodeURIComponent(query)}`);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-16">
            <div className="flex w-full max-w-md flex-col gap-8">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <img width="50" height="50" src="https://img.icons8.com/ios-filled/50/successful-delivery.png" alt="successful-delivery" />
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Track Your Shipment
                    </h1>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        Enter your tracking number to see the latest status and delivery
                        timeline for your SmartShip package.
                    </p>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleTrack} className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tracking_number">Tracking Number</Label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="tracking_number"
                                        value={trackingNumber}
                                        onChange={(e) => {
                                            setTrackingNumber(e.target.value);
                                            if (error) setError(null);
                                        }}
                                        placeholder="e.g. TRK-2026-000123"
                                        className="h-12 pl-10 text-base"
                                        aria-invalid={!!error}
                                        autoFocus
                                    />
                                </div>
                                {error && (
                                    <p className="text-xs text-destructive">{error}</p>
                                )}
                            </div>

                            <Button type="submit" size="lg" className="h-12 w-full text-base">
                                <Truck className="mr-2 h-5 w-5" />
                                Track Shipment
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground">
                    You can find your tracking number in your shipment confirmation
                    email or receipt.
                </p>
            </div>
        </div>
    );
}