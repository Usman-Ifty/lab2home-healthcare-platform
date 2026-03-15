import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Star, MessageSquare, Package } from "lucide-react";
import { toast } from "sonner";
import StarRating from "@/components/shared/StarRating";
import * as feedbackService from "@/services/feedback.service";

const AdminProductReviews = () => {
    const { token } = useAuth();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReviews, setTotalReviews] = useState(0);

    const fetchData = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const reviewsRes = await feedbackService.getAllProductReviews(token, { page, limit: 10 });
            setReviews(reviewsRes.data?.feedbacks || []);
            setTotalPages(reviewsRes.data?.pagination?.pages || 1);
            setTotalReviews(reviewsRes.data?.pagination?.total || 0);
        } catch (error) {
            console.error("Error fetching admin product reviews:", error);
            toast.error("Failed to load product reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token, page]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <DashboardLayout role="admin">
            <div className="relative z-10 space-y-8 max-w-6xl mx-auto pb-12">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-50 to-fuchsia-50/30 rounded-3xl p-8 shadow-sm border border-purple-100 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 shadow-inner shrink-0 text-purple-700">
                            <Package className="h-8 w-8 fill-current opacity-20 absolute" />
                            <Star className="h-6 w-6 relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Marketplace Product Reviews</h1>
                            <p className="text-gray-600 mt-2 max-w-2xl leading-relaxed">
                                Monitor all patient feedback across the entire product marketplace to ensure quality control.
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
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1 mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">All Product Feedback</h2>
                            <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                                {totalReviews} Total Reviews
                            </Badge>
                        </div>

                        {reviews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center px-4">
                                <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <MessageSquare className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Product Reviews Yet</h3>
                                <p className="text-gray-500 max-w-sm text-center">
                                    Once patients start reviewing products from the marketplace, you'll be able to monitor all feedback here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 text-left">
                                {reviews.map((review: any, idx) => (
                                    <motion.div
                                        key={review._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Card className="rounded-2xl border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
                                            <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-fuchsia-400" />
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row md:items-start gap-6">

                                                    {/* Left: Product Info */}
                                                    <div className="w-full md:w-64 flex-shrink-0 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                                            {review.target?.name || "Unknown Product"}
                                                        </h4>
                                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                                            <span>Product ID:</span>
                                                            <span className="font-mono text-xs">{review.target?._id?.slice(-8) || "N/A"}</span>
                                                        </div>
                                                        {review.target?.price && (
                                                            <div className="mt-2 font-medium text-purple-700">
                                                                ${review.target.price}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Right: Review Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <h4 className="font-semibold text-gray-900">
                                                                        {review.patient?.fullName || "Anonymous Patient"}
                                                                    </h4>
                                                                    {review.order && (
                                                                        <Badge variant="outline" className="text-[10px] uppercase font-mono bg-purple-50 text-purple-700 border-purple-200">
                                                                            Verified Purchase
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
                                                    </div>
                                                </div>
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
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminProductReviews;
