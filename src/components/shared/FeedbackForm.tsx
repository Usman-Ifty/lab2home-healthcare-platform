import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import StarRating from './StarRating';
import * as feedbackService from '@/services/feedback.service';

interface FeedbackFormProps {
    targetType: 'lab' | 'phlebotomist' | 'product';
    targetId: string;
    targetName?: string;
    bookingId?: string;
    orderId?: string;
    onSubmitted?: () => void;
    className?: string;
}

const FeedbackForm = ({
    targetType,
    targetId,
    targetName,
    bookingId,
    orderId,
    onSubmitted,
    className,
}: FeedbackFormProps) => {
    const { token } = useAuth();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [existingFeedback, setExistingFeedback] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        // Reset state when target changes
        setExistingFeedback(null);
        setRating(0);
        setComment('');
        setIsEditing(false);

        if (token && targetId) {
            checkExisting();
        } else {
            setChecking(false);
        }
    }, [token, targetId, targetType]);

    const checkExisting = async () => {
        if (!token) return;
        try {
            setChecking(true);
            const response = await feedbackService.checkExistingFeedback(token, targetType, targetId);
            if (response.data.hasReviewed && response.data.feedback) {
                setExistingFeedback(response.data.feedback);
                setRating(response.data.feedback.rating);
                setComment(response.data.feedback.comment || '');
            }
        } catch (error) {
            console.error('Error checking feedback:', error);
        } finally {
            setChecking(false);
        }
    };

    const handleSubmit = async () => {
        if (!token) {
            toast.error('Please login to submit a review');
            return;
        }

        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        try {
            setLoading(true);

            if (existingFeedback && isEditing) {
                await feedbackService.updateFeedback(token, existingFeedback._id, {
                    rating,
                    comment: comment.trim() || undefined,
                });
                toast.success('Review updated successfully!');
                setIsEditing(false);
            } else {
                await feedbackService.submitFeedback(token, {
                    targetType,
                    targetId,
                    rating,
                    comment: comment.trim() || undefined,
                    booking: bookingId,
                    order: orderId,
                });
                toast.success('Review submitted successfully!');
            }

            await checkExisting();
            onSubmitted?.();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to submit review';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!token || !existingFeedback) return;

        try {
            setLoading(true);
            await feedbackService.deleteFeedback(token, existingFeedback._id);
            toast.success('Review deleted');
            setExistingFeedback(null);
            setRating(0);
            setComment('');
            setIsEditing(false);
            onSubmitted?.();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete review');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    // Show existing review (read-only) with option to edit
    if (existingFeedback && !isEditing) {
        return (
            <Card className={className}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span>Your Review</span>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="text-muted-foreground hover:text-primary"
                            >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Edit
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDelete}
                                disabled={loading}
                                className="text-muted-foreground hover:text-red-500"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <StarRating value={existingFeedback.rating} readonly size="md" />
                    {existingFeedback.comment && (
                        <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                            {existingFeedback.comment}
                        </p>
                    )}
                </CardContent>
            </Card>
        );
    }

    const targetLabel =
        targetType === 'lab'
            ? 'Lab'
            : targetType === 'phlebotomist'
                ? 'Phlebotomist'
                : 'Product';

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                    {isEditing ? 'Edit Your Review' : `Rate this ${targetLabel}`}
                </CardTitle>
                {targetName && (
                    <p className="text-sm text-muted-foreground">{targetName}</p>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Your Rating
                    </label>
                    <StarRating value={rating} onChange={setRating} size="lg" />
                    {rating > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {rating === 1 && 'Poor'}
                            {rating === 2 && 'Fair'}
                            {rating === 3 && 'Good'}
                            {rating === 4 && 'Very Good'}
                            {rating === 5 && 'Excellent'}
                        </p>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Your Comment <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <Textarea
                        placeholder={`Share your experience with this ${targetLabel.toLowerCase()}...`}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={1000}
                        rows={3}
                        className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                        {comment.length}/1000
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || rating === 0}
                        className="flex-1"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        {isEditing ? 'Update Review' : 'Submit Review'}
                    </Button>
                    {isEditing && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditing(false);
                                setRating(existingFeedback.rating);
                                setComment(existingFeedback.comment || '');
                            }}
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default FeedbackForm;
