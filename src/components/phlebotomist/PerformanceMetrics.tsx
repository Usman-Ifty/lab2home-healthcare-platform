import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { phlebotomistService } from "@/services/phlebotomist.service";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Calendar, Clock, Award, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface PerformanceData {
    totalCompleted: number;
    thisWeek: number;
    thisMonth: number;
    averageCompletionTime: string;
    completionRate: string;
}

export const PerformanceMetrics = () => {
    const [metrics, setMetrics] = useState<PerformanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                setLoading(true);
                const response = await phlebotomistService.getPerformanceMetrics();

                if (response.success && response.data) {
                    setMetrics(response.data);
                } else {
                    toast({
                        title: "Error",
                        description: response.message || "Failed to load performance metrics",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error('Fetch metrics error:', error);
                toast({
                    title: "Error",
                    description: "Failed to load performance metrics",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <Card className="p-6 border-border bg-card shadow-soft">
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
            </Card>
        );
    }

    if (!metrics) {
        return null;
    }

    const metricsData = [
        {
            label: "Total Completed",
            value: metrics.totalCompleted,
            icon: Award,
            color: "text-primary",
            bgColor: "bg-primary/10",
        },
        {
            label: "This Week",
            value: metrics.thisWeek,
            icon: Calendar,
            color: "text-accent",
            bgColor: "bg-accent/10",
        },
        {
            label: "This Month",
            value: metrics.thisMonth,
            icon: TrendingUp,
            color: "text-success",
            bgColor: "bg-success/10",
        },
        {
            label: "Avg. Time",
            value: metrics.averageCompletionTime,
            icon: Clock,
            color: "text-warning",
            bgColor: "bg-warning/10",
        },
    ];

    return (
        <Card className="p-6 border-border bg-card shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
                {metricsData.map((metric, index) => (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                    >
                        <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                            <metric.icon className={`h-5 w-5 ${metric.color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{metric.label}</p>
                            <p className="text-lg font-bold text-foreground">{metric.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-success/10">
                <p className="text-sm text-center">
                    <span className="font-semibold text-success">Completion Rate:</span>{" "}
                    <span className="text-foreground">{metrics.completionRate}</span>
                </p>
            </div>
        </Card>
    );
};
