"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, PackagePlus } from "lucide-react";

import { private_api_call } from "@/actions/private_api_call";
import type { CreateShipmentPayload } from "@/lib/types/shipment";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const initialFormState: CreateShipmentPayload = {
    sender_name: "",
    sender_phone: "",
    receiver_name: "",
    receiver_phone: "",
    delivery_address: "",
    origin_hub: "",
    destination_hub: "",
    expected_delivery_date: "",
};

type FormErrors = Partial<Record<keyof CreateShipmentPayload, string>>;

export default function CreateShipmentPage() {
    const router = useRouter();
    const [form, setForm] = useState<CreateShipmentPayload>(initialFormState);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (field: keyof CreateShipmentPayload, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const validate = (): boolean => {
        const nextErrors: FormErrors = {};
        (Object.keys(form) as (keyof CreateShipmentPayload)[]).forEach((key) => {
            if (!form[key].trim()) {
                nextErrors[key] = "This field is required";
            }
        });
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await private_api_call({
                path: "shipments",
                method: "POST",
                body: form,
            });
            toast.success("Shipment created successfully");
            const newId: string | undefined = response?.data?.id;
            if (newId) {
                router.push(`/dashboard/shipments/${newId}`);
            } else {
                router.push("/dashboard/shipments");
            }
        } catch (err) {
            toast.error("Failed to create shipment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
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
                        Create Shipment
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter shipment and delivery details below.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-medium">
                            <PackagePlus className="h-4 w-4" />
                            Shipment Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                                Sender Information
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="sender_name">Sender Name</Label>
                                    <Input
                                        id="sender_name"
                                        value={form.sender_name}
                                        onChange={(e) =>
                                            handleChange("sender_name", e.target.value)
                                        }
                                        placeholder="e.g. John Carter"
                                        aria-invalid={!!errors.sender_name}
                                    />
                                    {errors.sender_name && (
                                        <p className="text-xs text-destructive">
                                            {errors.sender_name}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sender_phone">Sender Phone</Label>
                                    <Input
                                        id="sender_phone"
                                        value={form.sender_phone}
                                        onChange={(e) =>
                                            handleChange("sender_phone", e.target.value)
                                        }
                                        placeholder="e.g. +1 555 123 4567"
                                        aria-invalid={!!errors.sender_phone}
                                    />
                                    {errors.sender_phone && (
                                        <p className="text-xs text-destructive">
                                            {errors.sender_phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                                Receiver Information
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="receiver_name">Receiver Name</Label>
                                    <Input
                                        id="receiver_name"
                                        value={form.receiver_name}
                                        onChange={(e) =>
                                            handleChange("receiver_name", e.target.value)
                                        }
                                        placeholder="e.g. Amelia Stone"
                                        aria-invalid={!!errors.receiver_name}
                                    />
                                    {errors.receiver_name && (
                                        <p className="text-xs text-destructive">
                                            {errors.receiver_name}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="receiver_phone">Receiver Phone</Label>
                                    <Input
                                        id="receiver_phone"
                                        value={form.receiver_phone}
                                        onChange={(e) =>
                                            handleChange("receiver_phone", e.target.value)
                                        }
                                        placeholder="e.g. +1 555 987 6543"
                                        aria-invalid={!!errors.receiver_phone}
                                    />
                                    {errors.receiver_phone && (
                                        <p className="text-xs text-destructive">
                                            {errors.receiver_phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <Label htmlFor="delivery_address">Delivery Address</Label>
                                <Input
                                    id="delivery_address"
                                    value={form.delivery_address}
                                    onChange={(e) =>
                                        handleChange("delivery_address", e.target.value)
                                    }
                                    placeholder="e.g. 221B Baker Street, Dhaka"
                                    aria-invalid={!!errors.delivery_address}
                                />
                                {errors.delivery_address && (
                                    <p className="text-xs text-destructive">
                                        {errors.delivery_address}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                                Routing
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="origin_hub">Origin Hub</Label>
                                    <Input
                                        id="origin_hub"
                                        value={form.origin_hub}
                                        onChange={(e) =>
                                            handleChange("origin_hub", e.target.value)
                                        }
                                        placeholder="e.g. Dhaka Central Hub"
                                        aria-invalid={!!errors.origin_hub}
                                    />
                                    {errors.origin_hub && (
                                        <p className="text-xs text-destructive">
                                            {errors.origin_hub}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="destination_hub">Destination Hub</Label>
                                    <Input
                                        id="destination_hub"
                                        value={form.destination_hub}
                                        onChange={(e) =>
                                            handleChange("destination_hub", e.target.value)
                                        }
                                        placeholder="e.g. Chattogram Hub"
                                        aria-invalid={!!errors.destination_hub}
                                    />
                                    {errors.destination_hub && (
                                        <p className="text-xs text-destructive">
                                            {errors.destination_hub}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 space-y-2 sm:w-1/2 sm:pr-2">
                                <Label htmlFor="expected_delivery_date">
                                    Expected Delivery Date
                                </Label>
                                <Input
                                    id="expected_delivery_date"
                                    type="date"
                                    value={form.expected_delivery_date}
                                    onChange={(e) =>
                                        handleChange("expected_delivery_date", e.target.value)
                                    }
                                    aria-invalid={!!errors.expected_delivery_date}
                                />
                                {errors.expected_delivery_date && (
                                    <p className="text-xs text-destructive">
                                        {errors.expected_delivery_date}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/dashboard/shipments")}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Create Shipment
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}