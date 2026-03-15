import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import StarRating from "@/components/shared/StarRating";
import * as feedbackService from "@/services/feedback.service";

const LabReviews = () => {
    const { token, user } = useAuth();
    const [reviews, setReviews] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchData = async () => {
        if (!token || !user?.id) return;
        try {
            setLoading(true);
            const [reviewsRes, statsRes] = await Promise.all([
                feedbackService.getFeedbackForTarget("lab", user.id, { page, limit: 10 }),
                feedbackService.getRatingStats("lab", user.id)
            ]);

            setReviews(reviewsRes.data?.feedbacks || []);
            setTotalPages(reviewsRes.data?.pagination?.pages || 1);
            setStats(statsRes.data || null);
        } catch (error) {
            console.error("Error fetching lab reviews:", error);
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token, user?.id, page]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <DashboardLayout role="lab">
            <div className="relative z-10 space-y-8 max-w-6xl mx-auto pb-12">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-3xl p-8 shadow-sm border border-blue-100 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-inner shrink-0 text-blue-700">
                            <Star className="h-8 w-8 fill-current" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Patient Reviews</h1>
                            <p className="text-gray-600 mt-2 max-w-2xl leading-relaxed">
                                View feedback directly from your patients to understand your lab's performance and areas of improvement.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {loading && !reviews.length ? (
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-48 w-full rounded-2xl" />
                        <Skeleton className="h-48 w-full rounded-2xl" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Stats Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="rounded-3xl shadow-sm border-blue-100/50 bg-white sticky top-6">
                                <CardContent className="p-6">
                                    <h3 className="font-bold text-gray-900 text-lg mb-6">Overall Rating</h3>
                                    <div className="flex flex-col items-center justify-center py-4 border-b border-gray-100 mb-6">
                                        <span className="text-5xl font-extrabold text-gray-900 tracking-tighter">
                                            {stats?.averageRating ? (Number(stats.averageRating) === Math.floor(stats.averageRating) ? `${stats.averageRating}.0` : stats.averageRating) : "0.0"}
                                        </span>
                                        <div className="my-3">
                                            <StarRating value={stats?.averageRating || 0} readonly size="md" />
                                        </div>
                                        <span className="text-sm text-gray-500 font-medium">
                                            Based on {stats?.totalReviews || 0} reviews
                                        </span>
                                    </div>

                                    {stats?.distribution && (
                                        <div className="space-y-3">
                                            {[5, 4, 3, 2, 1].map((stars) => {
                                                const count = stats.distribution[stars] || 0;
                                                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                                                return (
                                                    <div key={stars} className="flex items-center gap-3">
                                                        <span className="text-sm font-medium text-gray-600 w-3">{stars}</span>
                                                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                                        <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-amber-500 rounded-full"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-500 w-8 text-right font-medium">
                                                            {count}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Reviews List */}
                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex items-center justify-between px-1 mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Recent Feedback</h2>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                    {stats?.totalReviews || 0} Total
                                </Badge>
                            </div>

                            {reviews.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 text-center px-4">
                                    <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <MessageSquare className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
                                    <p className="text-gray-500 max-w-sm text-center">
                                        Once patients start booking and completing tests with your lab, their reviews will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((review: any, idx) => (
                                        <motion.div
                                            key={review._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <Card className="rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                                                <CardContent className="p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h4 className="font-semibold text-gray-900">
                                                                    {review.patient?.fullName || "Anonymous Patient"}
                                                                </h4>
                                                                {review.booking && (
                                                                    <Badge variant="outline" className="text-[10px] uppercase font-mono bg-gray-50">
                                                                        Verified Patient
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                {formatDate(review.createdAt)}
                                                            </p>
                                                        </div>
                                                        <StarRating value={review.rating} readonly size="sm" />
                                                    </div>
                                                    {review.comment && (
                                                        <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl text-sm italic">
                                                            "{review.comment}"
                                                        </p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center items-center gap-2 mt-8">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                className="rounded-full"
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-sm font-medium text-gray-500">
                                                Page {page} of {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={page === totalPages}
                                                className="rounded-full"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default LabReviews;
