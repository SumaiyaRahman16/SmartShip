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
    Search,
    Loader2,
    FileText,
    User,
    Clock,
    Inbox,
    PlusCircle,
    PackageSearch,
} from "lucide-react";

import { private_api_call } from "@/actions/private_api_call";
import type {
    ShipmentNote,
    ShipmentNoteListResponse,
} from "@/lib/types/shipment";

async function addnotes(shipment_id: string, note: string) {
    try {
        const response = await private_api_call({
            path: "shipment-notes",
            method: "POST",
            body: {
                shipment_id,
                note,
            },
        });
        return response;
    } catch (error) {
        return error;
    }
}

async function getnotes(shipment_id: string) {
    try {
        const response = await private_api_call({
            path: `shipment-notes/${shipment_id}`,
            method: "GET",
        });
        return response;
    } catch (error) {
        return error;
    }
}

// Resolves a human-entered tracking number (e.g. "SHP-1001") to the
// backend's internal shipment_id (UUID) via the existing tracking lookup
// endpoint. The UUID is never shown to or typed by the user.
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

// Narrows the return value of addnotes/getnotes (which can be the
// private_api_call result OR a raw Error thrown inside the try/catch)
// down to the shape we can safely read `.success` / `.data` / `.message` from.
function isApiResult(
    value: unknown
): value is { success: boolean; data: unknown; message?: string } {
    return typeof value === "object" && value !== null && "success" in value;
}

export default function ShipmentNotesPage() {
    const [trackingNumber, setTrackingNumber] = useState("");
    const [shipmentId, setShipmentId] = useState("");
    const [loadedTrackingNumber, setLoadedTrackingNumber] = useState<
        string | null
    >(null);
    const [notes, setNotes] = useState<ShipmentNote[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const [isLoadingNotes, setIsLoadingNotes] = useState(false);
    const [isAddingNote, setIsAddingNote] = useState(false);

    const [newNote, setNewNote] = useState("");
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

    const sortNotesNewestFirst = (list: ShipmentNote[]) => {
        return [...list].sort(
            (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    };

    const fetchNotes = async (id: string) => {
        setIsLoadingNotes(true);
        setErrorMessage(null);
        try {
            const response = await getnotes(id);

            if (!isApiResult(response)) {
                notifyError(
                    response instanceof Error
                        ? response.message
                        : "Failed to load shipment notes."
                );
                setNotes([]);
                return;
            }

            if (!response.success) {
                notifyError(response.message || "Failed to load shipment notes.");
                setNotes([]);
                return;
            }

            const data = response.data as ShipmentNoteListResponse;
            setNotes(sortNotesNewestFirst(data?.notes ?? []));
        } catch (error) {
            notifyError(
                error instanceof Error ? error.message : "Failed to load notes."
            );
            setNotes([]);
        } finally {
            setIsLoadingNotes(false);
        }
    };

    const handleLoadNotes = async () => {
        const trimmedTracking = trackingNumber.trim();
        if (!trimmedTracking) {
            notifyError("Please enter a Tracking Number.");
            return;
        }

        setIsLoadingNotes(true);
        setErrorMessage(null);
        try {
            const shipmentResponse = await getShipmentByTracking(trimmedTracking);

            if (!isApiResult(shipmentResponse)) {
                notifyError(
                    shipmentResponse instanceof Error
                        ? shipmentResponse.message
                        : "Failed to look up shipment."
                );
                setIsLoadingNotes(false);
                return;
            }

            if (!shipmentResponse.success) {
                notifyError(
                    shipmentResponse.message ||
                    "No shipment found for that tracking number."
                );
                setIsLoadingNotes(false);
                return;
            }

            const resolvedShipmentId = (
                shipmentResponse.data as { shipment_id?: string } | null
            )?.shipment_id;

            if (!resolvedShipmentId) {
                notifyError("No shipment found for that tracking number.");
                setIsLoadingNotes(false);
                return;
            }

            setShipmentId(resolvedShipmentId);
            setLoadedTrackingNumber(trimmedTracking);
            setHasSearched(true);
            await fetchNotes(resolvedShipmentId);
        } catch (error) {
            notifyError(
                error instanceof Error ? error.message : "Failed to look up shipment."
            );
            setIsLoadingNotes(false);
        }
    };

    const handleAddNote = async () => {
        const trimmedNote = newNote.trim();

        if (!shipmentId) {
            notifyError("Load a shipment before adding a note.");
            return;
        }

        if (!trimmedNote) {
            notifyError("Note cannot be empty.");
            return;
        }

        setIsAddingNote(true);
        setErrorMessage(null);
        try {
            const response = await addnotes(shipmentId, trimmedNote);

            if (!isApiResult(response)) {
                notifyError(
                    response instanceof Error ? response.message : "Failed to add note."
                );
                return;
            }

            if (!response.success) {
                notifyError(response.message || "Failed to add note.");
                return;
            }

            setNewNote("");
            notifySuccess("Note added successfully.");
            await fetchNotes(shipmentId);
        } catch (error) {
            notifyError(
                error instanceof Error ? error.message : "Failed to add note."
            );
        } finally {
            setIsAddingNote(false);
        }
    };

    const formatCreatedAt = (isoDate: string) => {
        try {
            return new Date(isoDate).toLocaleString();
        } catch {
            return isoDate;
        }
    };

    const isBusy = isLoadingNotes || isAddingNote;

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Shipment Notes
                </h1>
                <p className="text-sm text-muted-foreground">
                    Look up a shipment to view its notes, or add a new note for
                    warehouse operators to track.
                </p>
            </div>

            {/* Search Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Find a Shipment</CardTitle>
                    <CardDescription>
                        Enter a Tracking Number and load its notes.
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
                                        handleLoadNotes();
                                    }
                                }}
                                disabled={isBusy}
                            />
                        </div>
                        <Button
                            onClick={handleLoadNotes}
                            disabled={isBusy}
                            className="sm:w-auto"
                        >
                            {isLoadingNotes ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Load Notes
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

                    {/* Notes List */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Notes for{" "}
                                <span className="font-semibold text-foreground">
                                    {loadedTrackingNumber}
                                </span>
                            </h2>
                        </div>

                        {isLoadingNotes ? (
                            <div className="flex flex-col gap-3">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : notes.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                    <Inbox className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm font-medium">No notes yet</p>
                                    <p className="text-sm text-muted-foreground">
                                        This shipment doesn&apos;t have any notes. Add the first
                                        one below.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {notes.map((note) => (
                                    <Card key={note.note_id}>
                                        <CardContent className="flex flex-col gap-2 py-4">
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                                {note.note}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3.5 w-3.5" />
                                                    {note.user_id}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatCreatedAt(note.created_at)}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add Note */}
                    {/* <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Add Note</CardTitle>
                            <CardDescription>
                                Add a new note for this shipment. Visible to all warehouse
                                operators.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Write a note about this shipment..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                disabled={isBusy}
                                rows={4}
                            />
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button onClick={handleAddNote} disabled={isBusy}>
                                {isAddingNote ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Note
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card> */}
                </>
            )}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Add Note</CardTitle>
                    <CardDescription>
                        Add a new note for this shipment. Visible to all warehouse
                        operators.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="Write a note about this shipment..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        disabled={isBusy}
                        rows={4}
                    />
                </CardContent>
                <CardFooter className="justify-end">
                    <Button onClick={handleAddNote} disabled={isBusy}>
                        {isAddingNote ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Note
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            {!hasSearched && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <PackageSearch className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">No shipment loaded</p>
                        <p className="text-sm text-muted-foreground">
                            Enter a Tracking Number above and click Load Notes to get started.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}