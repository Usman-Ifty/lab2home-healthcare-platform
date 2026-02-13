import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminStatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    description?: string;
    color?: "primary" | "success" | "warning" | "destructive" | "info";
    loading?: boolean;
}

export function AdminStatCard({
    title,
    value,
    icon: Icon,
    description,
    color = "primary",
    loading = false,
}: AdminStatCardProps) {
    const colorClasses = {
        primary: "bg-primary/10 text-primary",
        success: "bg-green-500/10 text-green-600",
        warning: "bg-yellow-500/10 text-yellow-600",
        destructive: "bg-red-500/10 text-red-600",
        info: "bg-blue-500/10 text-blue-600",
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn("p-2 rounded-lg", colorClasses[color])}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                        {description && <div className="h-4 w-32 bg-muted animate-pulse rounded" />}
                    </div>
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                        {description && (
                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
