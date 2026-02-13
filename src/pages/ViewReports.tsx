import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    Filter,
    FileText,
    Loader2,
    TestTube,
    Calendar,
    SortAsc,
    SortDesc,
} from "lucide-react";
import { ReportCard } from "@/components/patient/ReportCard";
import { ReportViewerModal } from "@/components/patient/ReportViewerModal";
import {
    getPatientReports,
    downloadReport,
    ReportBooking,
} from "@/services/reportService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ViewReports = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [reports, setReports] = useState<ReportBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
    const [selectedReport, setSelectedReport] = useState<ReportBooking | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    // Fetch reports on mount
    useEffect(() => {
        const fetchReports = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                const data = await getPatientReports(user.id);
                setReports(data);
            } catch (error) {
                console.error("Error fetching reports:", error);
                toast.error("Failed to load reports. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [user?.id]);

    // Get unique categories from reports
    const categories = useMemo(() => {
        const cats = new Set<string>();
        reports.forEach((report) => {
            report.tests.forEach((test) => {
                if (test.category) cats.add(test.category);
            });
        });
        return Array.from(cats).sort();
    }, [reports]);

    // Filter and sort reports
    const filteredReports = useMemo(() => {
        let filtered = reports;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (report) =>
                    report.tests.some((test) => test.name.toLowerCase().includes(query)) ||
                    report.lab.labName.toLowerCase().includes(query)
            );
        }

        // Category filter
        if (categoryFilter !== "all") {
            filtered = filtered.filter((report) =>
                report.tests.some((test) => test.category === categoryFilter)
            );
        }

        // Sort
        filtered = [...filtered].sort((a, b) => {
            const dateA = new Date(a.reportUploadedAt || a.createdAt).getTime();
            const dateB = new Date(b.reportUploadedAt || b.createdAt).getTime();
            return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
        });

        return filtered;
    }, [reports, searchQuery, categoryFilter, sortOrder]);

    const handleViewReport = (booking: ReportBooking) => {
        setSelectedReport(booking);
        setIsViewerOpen(true);
    };

    const handleDownloadReport = async (booking: ReportBooking) => {
        try {
            const testName = booking.tests.map((t) => t.name).join("_");
            await downloadReport(booking._id, testName);
            toast.success("Report downloaded successfully!");
        } catch (error) {
            console.error("Error downloading report:", error);
            toast.error("Failed to download report. Please try again.");
        }
    };

    const handleCloseViewer = () => {
        setIsViewerOpen(false);
        setSelectedReport(null);
    };

    return (
        <DashboardLayout role="patient">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold text-foreground mb-2">My Reports</h1>
                <p className="text-muted-foreground">
                    View and download your test reports
                </p>
            </motion.div>

            {/* Search and Filters */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6 space-y-4"
            >
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search by test name or lab..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                            aria-label="Search reports"
                        />
                    </div>

                    {/* Category Filter */}
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filter by category">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sort Order */}
                    <Button
                        variant="outline"
                        onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                        className="gap-2 w-full sm:w-auto"
                        aria-label={`Sort by ${sortOrder === "newest" ? "oldest" : "newest"} first`}
                    >
                        {sortOrder === "newest" ? (
                            <>
                                <SortDesc className="h-4 w-4" />
                                Newest First
                            </>
                        ) : (
                            <>
                                <SortAsc className="h-4 w-4" />
                                Oldest First
                            </>
                        )}
                    </Button>
                </div>

                {/* Results count */}
                {!loading && (
                    <p className="text-sm text-muted-foreground">
                        Showing {filteredReports.length} of {reports.length} report{reports.length !== 1 ? "s" : ""}
                    </p>
                )}
            </motion.div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading your reports...</p>
                    </div>
                </div>
            )}

            {/* Empty State - No Reports */}
            {!loading && reports.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-center py-20"
                >
                    <div className="text-center max-w-md">
                        <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                            <FileText className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">No Reports Yet</h2>
                        <p className="text-muted-foreground mb-6">
                            You don't have any test reports yet. Book a test to get started!
                        </p>
                        <Button onClick={() => navigate("/patient/book-test")} className="gap-2">
                            <TestTube className="h-4 w-4" />
                            Book a Test
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Empty State - No Search Results */}
            {!loading && reports.length > 0 && filteredReports.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center py-20"
                >
                    <div className="text-center max-w-md">
                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                            <Search className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">No Results Found</h2>
                        <p className="text-muted-foreground mb-6">
                            Try adjusting your search or filters to find what you're looking for.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchQuery("");
                                setCategoryFilter("all");
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Reports Grid */}
            {!loading && filteredReports.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    {filteredReports.map((report, index) => (
                        <ReportCard
                            key={report._id}
                            booking={report}
                            onView={handleViewReport}
                            onDownload={handleDownloadReport}
                            index={index}
                        />
                    ))}
                </motion.div>
            )}

            {/* Report Viewer Modal */}
            <ReportViewerModal
                booking={selectedReport}
                isOpen={isViewerOpen}
                onClose={handleCloseViewer}
                onDownload={handleDownloadReport}
            />
        </DashboardLayout>
    );
};

export default ViewReports;
