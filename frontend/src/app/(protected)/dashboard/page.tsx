"use client";

import Link from "next/link";
import {
    Package,
    Users,
    Building2,
    Truck,
    Plus,
    Search,
    ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
    const cards = [
        {
            title: "Shipments",
            description: "View and manage all shipments",
            icon: Package,
            href: "/dashboard/shipments",
        },
        {
            title: "Employees",
            description: "Manage warehouse staff and riders",
            icon: Users,
            href: "/dashboard/users",
        },
        {
            title: "Hubs",
            description: "Manage logistics hubs",
            icon: Building2,
            href: "/dashboard/hubs",
        },
        {
            title: "Assignments",
            description: "Assign shipments to riders",
            icon: Truck,
            href: "/dashboard/assignments",
        },

    ];

    const recentActivity = [
        "Shipment SHP001245 created",
        "Shipment SHP001241 arrived at Dhaka Hub",
        "Shipment SHP001230 assigned to Rahim Rider",
        "Shipment SHP001198 delivered successfully",
    ];

    return (
        <div className="space-y-8 p-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="mt-2 text-muted-foreground">
                    Welcome back! Manage your logistics operations from one place.
                </p>
            </div>

            {/* Navigation Cards */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <Link key={card.title} href={card.href}>
                            <Card className="transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                                <CardHeader>
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>

                                    <CardTitle>{card.title}</CardTitle>

                                    <CardDescription>{card.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="flex items-center justify-between">
                                    <span className="text-sm text-primary font-medium">
                                        Open Module
                                    </span>

                                    <ArrowRight className="h-4 w-4 text-primary" />
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                        Frequently used actions for logistics management.
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-wrap gap-4">
                    <Link href="/dashboard/shipments/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Shipment
                        </Button>
                    </Link>

                    <Link href="/tracking">
                        <Button variant="outline">
                            <Search className="mr-2 h-4 w-4" />
                            Track Shipment
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Latest shipment updates in the system.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <ul className="space-y-3">
                        {recentActivity.map((activity, index) => (
                            <li
                                key={index}
                                className="rounded-lg border p-3 text-sm text-muted-foreground"
                            >
                                {activity}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}