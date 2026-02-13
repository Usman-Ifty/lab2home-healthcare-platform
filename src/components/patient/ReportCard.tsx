import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Download,
    Eye,
    Calendar,
    Building2,
    TestTube,
} from "lucide-react";
import { ReportBooking } from "@/services/reportService";

interface ReportCardProps {
    booking: ReportBooking;
    onView: (booking: ReportBooking) => void;
    onDownload: (booking: ReportBooking) => void;
    index: number;
}

export function ReportCard({ booking, onView, onDownload, index }: ReportCardProps) {
    const testNames = booking.tests.map((t) => t.name).join(", ");
    const reportDate = booking.reportUploadedAt
        ? new Date(booking.reportUploadedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
        : "N/A";

    const bookingDate = new Date(booking.bookingDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card className="group relative overflow-hidden border-border bg-card hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                {/* Gradient accent on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
                                    {testNames}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Building2 className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{booking.lab.labName}</span>
                                </div>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className="bg-success/10 text-success border-success/20 flex-shrink-0"
                        >
                            Ready
                        </Badge>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TestTube className="h-4 w-4 flex-shrink-0" />
                            <span>Test Date: {bookingDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>Report Date: {reportDate}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            onClick={() => onView(booking)}
                            className="flex-1 gap-2"
                            variant="default"
                        >
                            <Eye className="h-4 w-4" />
                            View Report
                        </Button>
                        <Button
                            onClick={() => onDownload(booking)}
                            variant="outline"
                            size="icon"
                            className="flex-shrink-0"
                            aria-label="Download report"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
