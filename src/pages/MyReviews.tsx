import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Loader2,
    Star,
    MessageSquare,
    TestTube,
    Building2,
    Package,
    PlusCircle,
    X,
    Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import StarRating from '@/components/shared/StarRating';
import * as feedbackService from '@/services/feedback.service';
import FeedbackForm from '@/components/shared/FeedbackForm';
import { API_BASE_URL } from '@/lib/api';

interface PastTarget {
    type: 'lab' | 'phlebotomist';
    id: string;
    name: string;
    date: string;
    bookingId: string;
}

const targetTypeConfig = {
    lab: { label: 'Lab', icon: Building2, color: 'bg-blue-100 text-blue-700' },
    phlebotomist: { label: 'Phlebotomist', icon: TestTube, color: 'bg-green-100 text-green-700' },
    product: { label: 'Product', icon: Package, color: 'bg-purple-100 text-purple-700' },
};

const MyReviews = () => {
    const { token, user } = useAuth();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Rate Past Service Modal State
    const [showRateModal, setShowRateModal] = useState(false);
    const [pastTargets, setPastTargets] = useState<PastTarget[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(false);
    const [selectedTarget, setSelectedTarget] = useState<PastTarget | null>(null);

    useEffect(() => {
        if (token) {
            fetchReviews();
        }
    }, [token, activeTab, page]);

    const fetchReviews = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const params: any = { page, limit: 10 };
            if (activeTab !== 'all') {
                params.targetType = activeTab;
            }
            const response = await feedbackService.getMyReviews(token, params);
            setReviews(response.data?.feedbacks || []);
            setTotalPages(response.data?.pagination?.pages || 1);
            setTotal(response.data?.pagination?.total || 0);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const fetchPastTargets = async () => {
        if (!token || !user?.id) return;
        try {
            setLoadingTargets(true);
            // Fetch completed bookings
            const response = await fetch(`${API_BASE_URL}/bookings/patient/${user.id}?status=completed`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                // Get all existing reviews for this patient to filter out already-reviewed bookings
                const reviewsRes = await feedbackService.getMyReviews(token, { limit: 1000 });
                const existingReviews = reviewsRes.data?.feedbacks || [];
                const reviewedBookingTargets = new Set(
                    existingReviews
                        .filter((r: any) => r.booking)
                        .map((r: any) => `${r.targetType}-${r.targetId}-${r.booking}`)
                );

                const targets: PastTarget[] = [];

                data.data.forEach((booking: any) => {
                    const bookingDate = booking.bookingDate;
                    const bookingId = booking._id;

                    // Add Lab entry for this booking
                    if (booking.lab?._id && booking.lab?.labName) {
                        const key = `lab-${booking.lab._id}-${bookingId}`;
                        if (!reviewedBookingTargets.has(key)) {
                            targets.push({
                                type: 'lab',
                                id: booking.lab._id,
                                name: booking.lab.labName,
                                date: bookingDate,
                                bookingId,
                            });
                        }
                    }
                    // Add Phlebotomist entry for this booking
                    if (booking.phlebotomist?._id && booking.phlebotomist?.fullName) {
                        const key = `phlebotomist-${booking.phlebotomist._id}-${bookingId}`;
                        if (!reviewedBookingTargets.has(key)) {
                            targets.push({
                                type: 'phlebotomist',
                                id: booking.phlebotomist._id,
                                name: booking.phlebotomist.fullName,
                                date: bookingDate,
                                bookingId,
                            });
                        }
                    }
                });

                setPastTargets(
                    targets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                );
            }
        } catch (error) {
            console.error('Error fetching past targets:', error);
            toast.error('Failed to load past services');
        } finally {
            setLoadingTargets(false);
        }
    };

    useEffect(() => {
        if (showRateModal) {
            fetchPastTargets();
        }
    }, [showRateModal]);



    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getTargetName = (review: any) => {
        if (review.target) {
            return review.target.labName || review.target.name || review.target.fullName || 'Unknown';
        }
        return 'Unknown';
    };

    return (
        <DashboardLayout role="patient">
            {/* Background Decor */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
            </div>

            <div className="relative z-10 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
                        <p className="text-gray-600 mt-1">
                            Manage your ratings and reviews for labs, phlebotomists, and products
                        </p>
                    </div>
                    <Button
                        onClick={() => { setShowRateModal(true); setSelectedTarget(null); }}
                        className="gap-2 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Rate Past Service
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <Star className="h-6 w-6 text-amber-600 fill-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-amber-900">{total}</p>
                                <p className="text-sm text-amber-700">Total Reviews</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-900">
                                    {reviews.filter((r) => r.targetType === 'lab').length}
                                </p>
                                <p className="text-sm text-blue-700">Lab Reviews</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Package className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-900">
                                    {reviews.filter((r) => r.targetType === 'product').length}
                                </p>
                                <p className="text-sm text-purple-700">Product Reviews</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setPage(1); }}>
                    <TabsList className="bg-white shadow-sm">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="lab">Labs</TabsTrigger>
                        <TabsTrigger value="phlebotomist">Phlebotomists</TabsTrigger>
                        <TabsTrigger value="product">Products</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : reviews.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <MessageSquare className="h-12 w-12 text-gray-200 mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900">No reviews yet</h3>
                                    <p className="text-gray-500 text-sm mt-1 text-center max-w-sm">
                                        Start sharing your experiences by leaving reviews on products, labs, and phlebotomists you've used.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map((review: any) => {
                                    const config = targetTypeConfig[review.targetType as keyof typeof targetTypeConfig];
                                    const TargetIcon = config?.icon || Package;

                                    return (
                                        <Card key={review._id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                                            <TargetIcon className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 flex-wrap mb-1">
                                                                <h3 className="font-semibold text-gray-900 truncate">
                                                                    {getTargetName(review)}
                                                                </h3>
                                                                <Badge variant="secondary" className={`${config?.color || ''} border-0 text-xs`}>
                                                                    {config?.label || review.targetType}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <StarRating value={review.rating} readonly size="sm" />
                                                                <span className="text-xs text-muted-foreground">
                                                                    {formatDate(review.createdAt)}
                                                                </span>
                                                            </div>
                                                            {review.comment && (
                                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                                    {review.comment}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground flex-shrink-0">
                                                        <Lock className="h-3.5 w-3.5" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-6">
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
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Rate Past Service Modal */}
            {showRateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-border bg-card/50 backdrop-blur-sm">
                            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                <Star className="h-6 w-6 text-primary fill-primary/20" />
                                {selectedTarget ? `Rate ${selectedTarget.name}` : 'Rate Past Services'}
                            </h2>
                            <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full" onClick={() => setShowRateModal(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
                            {selectedTarget ? (
                                <div className="space-y-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedTarget(null)}
                                        className="mb-4 text-sm"
                                    >
                                        ← Back to List
                                    </Button>
                                    <FeedbackForm
                                        targetType={selectedTarget.type}
                                        targetId={selectedTarget.id}
                                        targetName={selectedTarget.name}
                                        bookingId={selectedTarget.bookingId}
                                        onSubmitted={() => {
                                            fetchReviews();
                                            setShowRateModal(false);
                                        }}
                                        className="border-none shadow-none bg-transparent p-0"
                                    />
                                </div>
                            ) : loadingTargets ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-muted-foreground">Loading your past services...</p>
                                </div>
                            ) : pastTargets.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-lg text-muted-foreground mb-4">No completed bookings found.</p>
                                    <p className="text-sm text-muted-foreground">You can only review labs and phlebotomists from completed bookings.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pastTargets.map((target) => (
                                        <Card
                                            key={`${target.type}-${target.id}-${target.bookingId}`}
                                            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group overflow-hidden"
                                            onClick={() => setSelectedTarget(target)}
                                        >
                                            <div className={`h-2 w-full ${target.type === 'lab' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className={`p-3 rounded-xl flex-shrink-0 ${target.type === 'lab' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                    {target.type === 'lab' ? <Building2 className="h-6 w-6" /> : <TestTube className="h-6 w-6" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                        {target.name}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground capitalize flex items-center justify-between mt-1">
                                                        <span>{target.type} • {new Date(target.date).toLocaleDateString()}</span>
                                                        <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Rate now →
                                                        </span>
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default MyReviews;
