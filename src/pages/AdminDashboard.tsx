import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Users,
    Shield,
    Clock,
    Calendar,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Building2,
    Bike,
    AlertCircle,
    MessageSquare
} from "lucide-react";
import { adminAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
    users: {
        total: number;
        patients: number;
        labs: number;
        phlebotomists: number;
        admins: number;
    };
    pendingApprovals: {
        labs: number;
        phlebotomists: number;
        total: number;
    };
    bookings: {
        active: number;
        pending: number;
        completed: number;
        cancelled: number;
        total: number;
    };
    recentActivity: {
        newUsersToday: number;
        newBookingsToday: number;
        reportsUploadedToday: number;
    };
    feedback: {
        recentCount: number;
    };
}

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminAPI.getDashboardStats();

            if (response.success && response.data) {
                setStats(response.data);
            } else {
                setError("Failed to load dashboard statistics");
            }
        } catch (err: any) {
            console.error("Error fetching dashboard stats:", err);
            setError(err.message || "Failed to load dashboard statistics");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Shield className="w-8 h-8 text-primary" />
                            Admin Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Welcome back, {user?.email}
                        </p>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Main Statistics Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Total Users */}
                    <AdminStatCard
                        title="Total Users"
                        value={stats?.users.total || 0}
                        icon={Users}
                        description={`${stats?.users.patients || 0} patients, ${stats?.users.labs || 0} labs, ${stats?.users.phlebotomists || 0} phlebotomists`}
                        color="primary"
                        loading={loading}
                    />

                    {/* Pending Approvals */}
                    <AdminStatCard
                        title="Pending Approvals"
                        value={stats?.pendingApprovals.total || 0}
                        icon={Clock}
                        description={`${stats?.pendingApprovals.labs || 0} labs, ${stats?.pendingApprovals.phlebotomists || 0} phlebotomists`}
                        color="warning"
                        loading={loading}
                    />

                    {/* Active Bookings */}
                    <AdminStatCard
                        title="Active Bookings"
                        value={stats?.bookings.active || 0}
                        icon={Calendar}
                        description={`${stats?.bookings.pending || 0} pending, ${stats?.bookings.completed || 0} completed`}
                        color="success"
                        loading={loading}
                    />

                    {/* Today's Activity */}
                    <AdminStatCard
                        title="Today's Activity"
                        value={stats?.recentActivity.newUsersToday || 0}
                        icon={TrendingUp}
                        description={`${stats?.recentActivity.newBookingsToday || 0} new bookings, ${stats?.recentActivity.reportsUploadedToday || 0} reports`}
                        color="info"
                        loading={loading}
                    />
                </div>

                {/* Detailed Statistics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* User Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                User Breakdown
                            </CardTitle>
                            <CardDescription>Total registered users by type</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loading ? (
                                <>
                                    <div className="h-4 bg-muted animate-pulse rounded" />
                                    <div className="h-4 bg-muted animate-pulse rounded" />
                                    <div className="h-4 bg-muted animate-pulse rounded" />
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Patients</span>
                                        <span className="font-semibold">{stats?.users.patients || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Laboratories</span>
                                        <span className="font-semibold">{stats?.users.labs || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Phlebotomists</span>
                                        <span className="font-semibold">{stats?.users.phlebotomists || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Admins</span>
                                        <span className="font-semibold">{stats?.users.admins || 0}</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Booking Statistics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-green-600" />
                                Booking Statistics
                            </CardTitle>
                            <CardDescription>All-time booking status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loading ? (
                                <>
                                    <div className="h-4 bg-muted animate-pulse rounded" />
                                    <div className="h-4 bg-muted animate-pulse rounded" />
                                    <div className="h-4 bg-muted animate-pulse rounded" />
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-yellow-600" />
                                            Pending
                                        </span>
                                        <span className="font-semibold">{stats?.bookings.pending || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-blue-600" />
                                            Active
                                        </span>
                                        <span className="font-semibold">{stats?.bookings.active || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            Completed
                                        </span>
                                        <span className="font-semibold">{stats?.bookings.completed || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                                            <XCircle className="w-4 h-4 text-red-600" />
                                            Cancelled
                                        </span>
                                        <span className="font-semibold">{stats?.bookings.cancelled || 0}</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pending Approvals Detail */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                                Pending Approvals
                            </CardTitle>
                            <CardDescription>Awaiting verification</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loading ? (
                                <>
                                    <div className="h-4 bg-muted animate-pulse rounded" />
                                    <div className="h-4 bg-muted animate-pulse rounded" />
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Building2 className="w-4 h-4" />
                                            Laboratories
                                        </span>
                                        <span className="font-semibold text-yellow-600">
                                            {stats?.pendingApprovals.labs || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Bike className="w-4 h-4" />
                                            Phlebotomists
                                        </span>
                                        <span className="font-semibold text-yellow-600">
                                            {stats?.pendingApprovals.phlebotomists || 0}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Total Pending</span>
                                            <span className="font-bold text-yellow-600">
                                                {stats?.pendingApprovals.total || 0}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Feedback */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            Recent Feedback & Complaints
                        </CardTitle>
                        <CardDescription>Contact form submissions from the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-12 bg-muted animate-pulse rounded" />
                        ) : (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Total submissions</span>
                                <span className="text-2xl font-bold">{stats?.feedback.recentCount || 0}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
