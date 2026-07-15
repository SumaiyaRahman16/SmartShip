"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TrackingSearchPage() {
    const router = useRouter();
    const [trackingNumber, setTrackingNumber] = useState("");
    const [touched, setTouched] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        const value = trackingNumber.trim();
        if (!value) return;
        router.push(`track/${encodeURIComponent(value)}`);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <img width="50" height="50" src="https://img.icons8.com/ios-filled/50/successful-delivery.png" alt="successful-delivery" />

                    </div>
                    <CardTitle className="text-xl">Track Your Shipment</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Enter your tracking number to see real-time delivery status.
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tracking_number">Tracking Number</Label>
                            <Input
                                id="tracking_number"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="e.g. SS123456789"
                                autoFocus
                                aria-invalid={touched && !trackingNumber.trim()}
                            />
                            {touched && !trackingNumber.trim() && (
                                <p className="text-xs text-destructive">
                                    Please enter a tracking number
                                </p>
                            )}
                        </div>
                        <Button type="submit">
                            <Search className="mr-2 h-4 w-4" />
                            Track Shipment
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}