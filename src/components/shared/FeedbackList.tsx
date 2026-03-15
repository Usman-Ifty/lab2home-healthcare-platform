import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, MessageSquare, User } from 'lucide-react';
import StarRating from './StarRating';
import * as feedbackService from '@/services/feedback.service';

interface FeedbackListProps {
    targetType: 'lab' | 'phlebotomist' | 'product';
    targetId: string;
    refreshKey?: number; // increment to trigger refresh
    className?: string;
}

const FeedbackList = ({ targetType, targetId, refreshKey, className }: FeedbackListProps) => {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (targetId) {
            fetchFeedbacks();
        }
    }, [targetId, page, refreshKey]);

    const fetchFeedbacks = async () => {
        try {
            setLoading(true);
            const response = await feedbackService.getFeedbackForTarget(targetType, targetId, {
                page,
                limit: 5,
            });
            setFeedbacks(response.data.feedbacks);
            setTotalPages(response.data.pagination.pages);
            setTotal(response.data.pagination.total);
        } catch (error) {
            console.error('Error fetching feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading && feedbacks.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    Reviews
                    {total > 0 && (
                        <span className="text-sm font-normal text-muted-foreground">
                            ({total})
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {feedbacks.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageSquare className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">
                            No reviews yet. Be the first to share your experience!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {feedbacks.map((feedback: any, index: number) => (
                            <div key={feedback._id}>
                                {index > 0 && <Separator className="my-4" />}
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <span className="font-medium text-sm text-gray-900">
                                                {feedback.patient?.fullName || 'Anonymous'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(feedback.createdAt)}
                                            </span>
                                        </div>
                                        <div className="mt-1">
                                            <StarRating
                                                value={feedback.rating}
                                                readonly
                                                size="sm"
                                            />
                                        </div>
                                        {feedback.comment && (
                                            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                                                {feedback.comment}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground px-2">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default FeedbackList;
