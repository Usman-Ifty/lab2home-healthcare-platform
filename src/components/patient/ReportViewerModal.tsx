import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, X, Loader2 } from "lucide-react";
import { ReportBooking, getReportUrl } from "@/services/reportService";
import { toast } from "sonner";
import axios from "axios";
import { getToken } from "@/utils/storage";

interface ReportViewerModalProps {
    booking: ReportBooking | null;
    isOpen: boolean;
    onClose: () => void;
    onDownload: (booking: ReportBooking) => void;
}

export function ReportViewerModal({
    booking,
    isOpen,
    onClose,
    onDownload,
}: ReportViewerModalProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [fileType, setFileType] = useState<'pdf' | 'image' | 'unknown'>('unknown');
    const [imageUrl, setImageUrl] = useState<string>('');

    useEffect(() => {
        if (isOpen && booking) {
            setLoading(true);
            setError(false);
            detectFileType();
        }

        // Cleanup image URL when modal closes
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [isOpen, booking]);

    const detectFileType = async () => {
        if (!booking) return;

        try {
            const token = getToken();
            const reportUrl = getReportUrl(booking._id);

            // Fetch the file to check its content type
            const response = await axios.get(reportUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob',
            });

            const contentType = response.headers['content-type'] || '';

            if (contentType.includes('pdf')) {
                setFileType('pdf');
                setLoading(false);
            } else if (contentType.includes('image')) {
                setFileType('image');
                // Create object URL for image
                const blob = new Blob([response.data], { type: contentType });
                const url = URL.createObjectURL(blob);
                setImageUrl(url);
                setLoading(false);
            } else {
                setFileType('unknown');
                setLoading(false);
            }
        } catch (err) {
            console.error('Error detecting file type:', err);
            setError(true);
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!booking) return;

        if (fileType === 'pdf') {
            const reportUrl = getReportUrl(booking._id);
            const printWindow = window.open(reportUrl, '_blank');

            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            } else {
                toast.error("Please allow pop-ups to print the report");
            }
        } else if (fileType === 'image') {
            // For images, open in new window and print
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
          <html>
            <head><title>Print Report</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;">
              <img src="${imageUrl}" style="max-width:100%;height:auto;" onload="window.print();"/>
            </body>
          </html>
        `);
                printWindow.document.close();
            } else {
                toast.error("Please allow pop-ups to print the report");
            }
        }
    };

    const handleIframeLoad = () => {
        setLoading(false);
    };

    const handleIframeError = () => {
        setLoading(false);
        setError(true);
        toast.error("Failed to load report. Please try downloading instead.");
    };

    if (!booking) return null;

    const testNames = booking.tests.map((t) => t.name).join(", ");
    const reportUrl = getReportUrl(booking._id);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 [&>button]:hidden">
                {/* Custom Header with integrated close button */}
                <div className="relative px-6 py-4 border-b border-border flex-shrink-0">
                    <div className="flex items-start gap-4">
                        {/* Title Section */}
                        <div className="flex-1 min-w-0 mr-12">
                            <h2 className="text-xl font-semibold text-foreground mb-1 pr-8">
                                {testNames}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {booking.lab.labName} • {new Date(booking.reportUploadedAt || "").toLocaleDateString()}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0 mr-8">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                                className="gap-2"
                                disabled={fileType === 'unknown'}
                            >
                                <Printer className="h-4 w-4" />
                                <span className="hidden sm:inline">Print</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDownload(booking)}
                                className="gap-2"
                            >
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Download</span>
                            </Button>
                        </div>

                        {/* Close Button - Absolutely positioned */}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* File Viewer */}
                <div className="flex-1 relative bg-muted/30 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10"
                            >
                                <div className="text-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Loading report...</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center max-w-md px-4">
                                <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
                                    <X className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Failed to Load Report</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    The report preview couldn't be loaded. Please try downloading the report instead.
                                </p>
                                <Button onClick={() => onDownload(booking)} className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Download Report
                                </Button>
                            </div>
                        </div>
                    ) : fileType === 'pdf' ? (
                        <iframe
                            src={reportUrl}
                            className="w-full h-full border-0"
                            title={`Report for ${testNames}`}
                            onLoad={handleIframeLoad}
                            onError={handleIframeError}
                        />
                    ) : fileType === 'image' ? (
                        <div className="w-full h-full overflow-auto flex items-center justify-center p-4 bg-background">
                            <img
                                src={imageUrl}
                                alt={`Report for ${testNames}`}
                                className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                                onLoad={() => setLoading(false)}
                                onError={() => {
                                    setError(true);
                                    setLoading(false);
                                    toast.error("Failed to load image report");
                                }}
                            />
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
