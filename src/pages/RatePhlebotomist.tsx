import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { TestTube, Star, History, CheckCircle2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import FeedbackForm from "@/components/shared/FeedbackForm";
import { API_BASE_URL } from "@/lib/api";

interface PastPhlebotomist {
    id: string;
    name: string;
    bookingId: string;
    bookingDate: string;
    hasReviewed: boolean;
}

const RatePhlebotomist = () => {
    const { token, user } = useAuth();
    const [phlebotomists, setPhlebotomists] = useState<PastPhlebotomist[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);

    const fetchData = async () => {
        if (!token || !user?.id) return;
        try {
            setLoading(true);

            // Fetch both completed bookings and user's past reviews in parallel
            const [bookingsRes, reviewsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/bookings/patient/${user.id}?status=completed`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE_URL}/feedback/my-reviews?targetType=phlebotomist`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            ]);

            const bookingsData = await bookingsRes.json();
            const reviewsData = await reviewsRes.json();

            if (bookingsData.success) {
                // Create a Set of booking+phlebotomist combinations already reviewed
                const reviewedKeys = new Set(
                    (reviewsData.data?.feedbacks || [])
                        .filter((fb: any) => fb.booking)
                        .map((fb: any) => `${fb.targetId}-${fb.booking}`)
                );

                const entries: PastPhlebotomist[] = [];

                bookingsData.data.forEach((booking: any) => {
                    if (booking.phlebotomist?._id && booking.phlebotomist?.fullName) {
                        const phlebId = booking.phlebotomist._id;
                        const key = `${phlebId}-${booking._id}`;

                        entries.push({
                            id: phlebId,
                            name: booking.phlebotomist.fullName,
                            bookingId: booking._id,
                            bookingDate: booking.bookingDate,
                            hasReviewed: reviewedKeys.has(key),
                        });
                    }
                });

                setPhlebotomists(
                    entries.sort(
                        (a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
                    )
                );
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load your past phlebotomists");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token, user?.id]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <DashboardLayout role="patient">
            <div className="relative z-10 space-y-8 max-w-6xl mx-auto pb-12">
                {/* Header Section with Glassmorphism */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-white to-green-50/30 rounded-3xl p-8 shadow-sm border border-green-100 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />

                    <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-green-200 shadow-inner shrink-0">
                            <TestTube className="h-8 w-8 text-green-700" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Rate Your Phlebotomist</h1>
                            <p className="text-gray-600 mt-2 max-w-2xl leading-relaxed">
                                Your feedback directly impacts the quality of our home collection services.
                                Select a booking below to share your experience.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Dynamic Content Area */}
                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-5 space-y-4">
                            <Skeleton className="h-6 w-48 mb-6" />
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-24 w-full rounded-xl" />
                            ))}
                        </div>
                        <div className="lg:col-span-7 hidden lg:block">
                            <Skeleton className="h-[500px] w-full rounded-2xl" />
                        </div>
                    </div>
                ) : phlebotomists.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-green-200 text-center px-4"
                    >
                        <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                            <History className="h-10 w-10 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Home Collections Yet</h3>
                        <p className="text-gray-500 max-w-md text-lg leading-relaxed">
                            Once you complete a home sample collection booking, the assigned phlebotomist will appear here for you to review.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-8 border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => window.location.href = '/patient/book-test'}
                        >
                            Book a Home Test
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* Split View: Master List */}
                        <div className={`lg:col-span-5 space-y-4 ${selectedKey ? "hidden lg:block" : ""}`}>
                            <div className="flex items-center justify-between mb-6 px-1">
                                <h2 className="text-xl font-semibold text-gray-900">Past Bookings</h2>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    {phlebotomists.length} Total
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                {phlebotomists.map((p, idx) => {
                                    const key = `${p.id}-${p.bookingId}`;
                                    return (
                                    <motion.div
                                        key={key}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Card
                                            className={`cursor-pointer group transition-all duration-200 border-2 overflow-hidden
                        ${selectedKey === key
                                                    ? "border-green-500 shadow-md bg-green-50/30 scale-[1.02]"
                                                    : "border-transparent hover:border-green-200 hover:shadow-sm hover:bg-gray-50/50"
                                                }`}
                                            onClick={() => setSelectedKey(key)}
                                        >
                                            <CardContent className="p-4 flex items-center gap-4 relative">
                                                {/* Selector indicator line */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-colors
                          ${selectedKey === key ? "bg-green-500" : "bg-transparent group-hover:bg-green-200"}`}
                                                />

                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 flex-shrink-0 group-hover:bg-green-200 transition-colors">
                                                    <span className="font-semibold text-lg">{p.name.charAt(0).toUpperCase()}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className="font-semibold text-gray-900 truncate">{p.name}</h4>
                                                        {p.hasReviewed && (
                                                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 flex gap-1 shrink-0 px-1.5 py-0 text-[10px]">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Reviewed
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                                                        Booking: {formatDate(p.bookingDate)}
                                                    </p>
                                                </div>

                                                <ChevronRight className={`h-5 w-5 transition-transform shrink-0
                          ${selectedKey === key ? "text-green-500 translate-x-1" : "text-gray-300 group-hover:text-green-400"}
                        `} />
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Split View: Detail / Review Form */}
                        <div className={`lg:col-span-7 ${!selectedKey ? "hidden lg:block" : ""}`}>
                            <AnimatePresence mode="wait">
                                {selectedKey ? (
                                    <motion.div
                                        key={selectedKey}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="sticky top-6 relative"
                                    >
                                        {/* Mobile Back Button */}
                                        <Button
                                            variant="ghost"
                                            className="lg:hidden mb-4 -ml-2 text-muted-foreground hover:text-foreground"
                                            onClick={() => setSelectedKey(null)}
                                        >
                                            ← Back to List
                                        </Button>

                                        {(() => {
                                            const selected = phlebotomists.find(
                                                (p) => `${p.id}-${p.bookingId}` === selectedKey
                                            );
                                            if (!selected) return null;

                                            return (
                                                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                                                    {/* Decorative header for form */}
                                                    <div className="h-24 bg-gradient-to-r from-green-500 to-emerald-400 p-6 flex flex-col justify-end relative overflow-hidden">
                                                        <div className="absolute right-0 top-0 opacity-10 blur-sm pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                                                            <Star className="w-48 h-48" />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-white z-10">Review for {selected.name}</h3>
                                                        <p className="text-white/70 text-sm z-10">
                                                            Booking: {formatDate(selected.bookingDate)}
                                                        </p>
                                                    </div>

                                                    <div className="p-2">
                                                        <FeedbackForm
                                                            targetType="phlebotomist"
                                                            targetId={selected.id}
                                                            targetName={selected.name}
                                                            bookingId={selected.bookingId}
                                                            onSubmitted={() => fetchData()}
                                                            className="border-none shadow-none"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-[600px] flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-center p-8 hidden lg:flex"
                                    >
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-green-100 blur-2xl rounded-full opacity-50" />
                                            <Star className="h-20 w-20 text-gray-300 relative z-10" />
                                        </div>
                                        <h3 className="text-xl font-medium text-gray-700">Select a Professional</h3>
                                        <p className="text-gray-500 mt-2 max-w-sm leading-relaxed">
                                            Choose a phlebotomist from the list to view your existing review or evaluate their service.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default RatePhlebotomist;
