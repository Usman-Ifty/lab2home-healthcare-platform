import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MapPin, Clock, Calendar as CalendarIcon, Phone, User, CheckCircle2, Loader2, RefreshCw, Inbox } from "lucide-react";
import { phlebotomistService } from "@/services/phlebotomist.service";
import { phlebotomistRequestService } from "@/services/phlebotomistRequestService";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Booking {
    _id: string;
    patient: {
        _id: string;
        fullName: string;
        email: string;
        phone: string;
        address: string;
        dateOfBirth: string;
    };
    lab: {
        labName: string;
        email: string;
        phone: string;
        labAddress: string;
    };
    tests: Array<{
        name: string;
        description: string;
        category: string;
        basePrice: number;
        reportDeliveryTime: string;
        preparationInstructions: string;
    }>;
    bookingDate: string;
    preferredTimeSlot: string;
    collectionType: 'home' | 'lab';
    collectionAddress?: string;
    status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
    notes?: string;
}

interface Request {
    _id: string;
    booking: Booking;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    createdAt: string;
}

const PhlebotomistAppointments = () => {
    const [filter, setFilter] = useState("all");
    const [activeTab, setActiveTab] = useState<'appointments' | 'requests'>('appointments');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const { toast } = useToast();
    const navigate = useNavigate();

    const fetchBookings = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const [bookingsResponse, requestsResponse] = await Promise.all([
                phlebotomistService.getAssignedBookings(),
                phlebotomistRequestService.getMyRequests()
            ]);

            if (bookingsResponse.success) {
                setBookings(bookingsResponse.data || []);
            }

            if (requestsResponse.success) {
                setRequests(requestsResponse.data || []);
            }
        } catch (error) {
            console.error('Fetch data error:', error);
            toast({
                title: "Error",
                description: "Failed to load data. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleStartCollection = async (bookingId: string) => {
        try {
            const response = await phlebotomistService.updateBookingStatus(bookingId, 'in-progress');

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Sample collection started",
                });
                fetchBookings(true);
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to update status",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to start collection. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleNavigateToCollection = (bookingId: string) => {
        navigate(`/phlebotomist/samples?bookingId=${bookingId}`);
    };

    const handleAcceptRequest = async (requestId: string) => {
        try {
            const response = await phlebotomistRequestService.acceptRequest(requestId);
            if (response.success) {
                toast({ title: "Success", description: "Request accepted successfully" });
                fetchBookings(true);
            } else {
                toast({ title: "Error", description: response.message || "Failed to accept request", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to accept request", variant: "destructive" });
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            const response = await phlebotomistRequestService.rejectRequest(requestId);
            if (response.success) {
                toast({ title: "Success", description: "Request rejected" });
                fetchBookings(true);
            } else {
                toast({ title: "Error", description: response.message || "Failed to reject request", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to reject request", variant: "destructive" });
        }
    };

    const filteredAppointments = bookings.filter(booking => {
        if (filter === "all") return true;
        if (filter === "scheduled") return booking.status === 'confirmed';
        return booking.status === filter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'default';
            case 'in-progress': return 'warning';
            case 'completed': return 'success';
            default: return 'secondary';
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="phlebotomist">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="phlebotomist">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">My Appointments</h1>
                    <p className="text-muted-foreground">Manage your home collection schedule</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchBookings(true)}
                    disabled={refreshing}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Main Tabs */}
            <div className="flex gap-4 border-b mb-6">
                <button
                    className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'appointments' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    onClick={() => setActiveTab('appointments')}
                >
                    My Schedule
                    {activeTab === 'appointments' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
                <button
                    className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'requests' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    onClick={() => setActiveTab('requests')}
                >
                    New Requests
                    {requests.length > 0 && (
                        <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                            {requests.length}
                        </Badge>
                    )}
                    {activeTab === 'requests' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
            </div>

            {/* Content Switch */}
            {activeTab === 'appointments' ? (
                <>
                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6">
                        {['all', 'scheduled', 'in-progress', 'completed'].map((f) => (
                            <Button
                                key={f}
                                variant={filter === f ? 'default' : 'outline'}
                                onClick={() => setFilter(f)}
                                className="capitalize"
                            >
                                {f.replace('-', ' ')}
                            </Button>
                        ))}
                    </div>

                    <div className="grid gap-6">
                        {filteredAppointments.map((booking, index) => {
                            const testNames = booking.tests.map(t => t.name).join(', ');
                            const address = booking.collectionType === 'home'
                                ? booking.collectionAddress || booking.patient.address
                                : booking.lab.labAddress;
                            const date = new Date(booking.bookingDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            });

                            return (
                                <motion.div
                                    key={booking._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="p-6 shadow-soft border-border">
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            {/* Left Info */}
                                            <div className="space-y-4 flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-primary/10 p-2 rounded-full">
                                                            <User className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold">{booking.patient.fullName}</h3>
                                                            <p className="text-sm text-muted-foreground">ID: {booking._id.slice(-8)}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant={getStatusColor(booking.status) as any} className="capitalize">
                                                        {booking.status === 'confirmed' ? 'scheduled' : booking.status.replace('-', ' ')}
                                                    </Badge>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <CalendarIcon className="h-4 w-4" />
                                                        {date} at {booking.preferredTimeSlot}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Phone className="h-4 w-4" />
                                                        {booking.patient.phone}
                                                    </div>
                                                    <div className="flex items-start gap-2 text-muted-foreground col-span-2">
                                                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                                        {address}
                                                    </div>
                                                </div>

                                                <div className="bg-muted p-3 rounded-lg">
                                                    <span className="font-semibold text-sm">Test to Collect: </span>
                                                    <span className="text-sm">{testNames}</span>
                                                </div>
                                            </div>

                                            {/* Right Actions */}
                                            <div className="flex flex-col gap-3 justify-center min-w-[150px]">
                                                {booking.status === 'confirmed' && (
                                                    <Button
                                                        className="w-full gap-2"
                                                        onClick={() => handleStartCollection(booking._id)}
                                                    >
                                                        Start Collection
                                                    </Button>
                                                )}
                                                {booking.status === 'in-progress' && (
                                                    <Button
                                                        variant="secondary"
                                                        className="w-full gap-2 bg-success text-success-foreground hover:bg-success/90"
                                                        onClick={() => handleNavigateToCollection(booking._id)}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Collect Sample
                                                    </Button>
                                                )}
                                                {booking.status === 'completed' && (
                                                    <Badge variant="secondary" className="w-full justify-center py-2 bg-success/10 text-success border-success/20">
                                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                                        Collected
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}

                        {filteredAppointments.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No appointments found in this category.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="grid gap-6">
                    {requests.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                            <div className="bg-gray-100 p-4 rounded-full mb-4">
                                <Inbox className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium">No Pending Requests</h3>
                            <p>You don't have any new assignment requests at the moment.</p>
                        </div>
                    ) : (
                        requests.map((request, index) => {
                            const booking = request.booking;
                            const testNames = booking.tests.map(t => t.name).join(', ');
                            const address = booking.collectionType === 'home'
                                ? booking.collectionAddress || booking.patient.address
                                : booking.lab.labAddress;
                            const date = new Date(booking.bookingDate).toLocaleDateString();

                            return (
                                <motion.div
                                    key={request._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="p-6 border-l-4 border-l-primary shadow-sm hover:shadow-md transition">
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            <div className="space-y-4 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                                        <Inbox className="h-5 w-5 text-primary" />
                                                        New Assignment Request
                                                    </h3>
                                                    <Badge>Pending</Badge>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-y-2 gap-x-8 text-sm bg-gray-50 p-4 rounded-lg">
                                                    <div className="space-y-1">
                                                        <p className="text-muted-foreground text-xs">Patient</p>
                                                        <p className="font-medium">{booking.patient.fullName}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-muted-foreground text-xs">Date & Time</p>
                                                        <p className="font-medium">{date} at {booking.preferredTimeSlot}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-muted-foreground text-xs">Location</p>
                                                        <p className="font-medium flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" /> {address}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-muted-foreground text-xs">Tests</p>
                                                        <p className="font-medium">{testNames}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 justify-center min-w-[150px]">
                                                <Button
                                                    className="w-full"
                                                    onClick={() => handleAcceptRequest(request._id)}
                                                >
                                                    Accept
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full text-destructive hover:text-destructive"
                                                    onClick={() => handleRejectRequest(request._id)}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}
        </DashboardLayout>
    );
};

export default PhlebotomistAppointments;
