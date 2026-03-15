import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Star } from 'lucide-react';
import StarRating from './StarRating';
import * as feedbackService from '@/services/feedback.service';

interface RatingSummaryProps {
    targetType: 'lab' | 'phlebotomist' | 'product';
    targetId: string;
    refreshKey?: number;
    compact?: boolean;
    className?: string;
}

const RatingSummary = ({
    targetType,
    targetId,
    refreshKey,
    compact = false,
    className,
}: RatingSummaryProps) => {
    const [stats, setStats] = useState<{
        averageRating: number;
        totalReviews: number;
        distribution: Record<number, number>;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (targetId) {
            fetchStats();
        }
    }, [targetId, refreshKey]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await feedbackService.getRatingStats(targetType, targetId);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching rating stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return compact ? null : (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!stats || stats.totalReviews === 0) {
        if (compact) {
            return (
                <div className={`flex items-center gap-1 text-sm text-muted-foreground ${className || ''}`}>
                    <Star className="h-3.5 w-3.5 fill-gray-200 text-gray-200" />
                    <span>No reviews</span>
                </div>
            );
        }
        return null;
    }

    // Compact mode: just show stars + count inline
    if (compact) {
        return (
            <div className={`flex items-center gap-1.5 ${className || ''}`}>
                <StarRating value={stats.averageRating} readonly size="sm" />
                <span className="text-sm font-medium text-gray-700">
                    {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                    ({stats.totalReviews})
                </span>
            </div>
        );
    }

    // Full mode: detailed breakdown
    const maxCount = Math.max(...Object.values(stats.distribution), 1);

    return (
        <Card className={className}>
            <CardContent className="pt-6">
                <div className="flex items-start gap-8">
                    {/* Left: Big rating number */}
                    <div className="text-center flex-shrink-0">
                        <div className="text-5xl font-bold text-gray-900">
                            {stats.averageRating.toFixed(1)}
                        </div>
                        <div className="mt-2">
                            <StarRating value={stats.averageRating} readonly size="md" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                        </p>
                    </div>

                    {/* Right: Distribution bars */}
                    <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((starLevel) => {
                            const count = stats.distribution[starLevel] || 0;
                            const percentage = stats.totalReviews > 0
                                ? (count / stats.totalReviews) * 100
                                : 0;

                            return (
                                <div key={starLevel} className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-600 w-3 text-right">
                                        {starLevel}
                                    </span>
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500 ease-out"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor:
                                                    starLevel >= 4
                                                        ? '#22c55e'
                                                        : starLevel === 3
                                                            ? '#f59e0b'
                                                            : '#ef4444',
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground w-8 text-right">
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default RatingSummary;
