import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { phlebotomistService } from "@/services/phlebotomist.service";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  TestTube,
  User,
  Loader2,
  RefreshCw
} from "lucide-react";

interface Booking {
  _id: string;
  patient: {
    _id: string;
    fullName: string;
    phone: string;
    address: string;
  };
  lab: {
    labName: string;
    phone: string;
    labAddress: string;
  };
  tests: Array<{
    name: string;
    category: string;
  }>;
  bookingDate: string;
  preferredTimeSlot: string;
  collectionType: 'home' | 'lab';
  collectionAddress?: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
}

interface DashboardData {
  user: {
    fullName: string;
    email: string;
    phone: string;
    qualification: string;
    availability: boolean;
    assignedLab: any;
  };
  stats: {
    todaysCollections: number;
    completed: number;
    inProgress: number;
    remaining: number;
    pendingRequests?: number;
  };
  schedule: Booking[];
  completedToday: Booking[];
}

const PhlebotomistDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await phlebotomistService.getDashboard();

      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load dashboard data",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStartCollection = async (bookingId: string) => {
    try {
      const response = await phlebotomistService.updateBookingStatus(bookingId, 'in-progress');

      if (response.success) {
        toast({
          title: "Success",
          description: "Sample collection started",
        });
        // Refresh dashboard
        fetchDashboardData(true);
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

  const handleAvailabilityToggle = async (checked: boolean) => {
    try {
      // Optimistic update
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          user: {
            ...dashboardData.user,
            availability: checked
          }
        });
      }

      const response = await phlebotomistService.updateAvailability(checked);

      if (response.success) {
        toast({
          title: checked ? "You are now Online 🟢" : "You are now Offline 🔴",
          description: checked
            ? "You can now receive assignment requests."
            : "You will not receive new assignments.",
        });
      } else {
        // Revert on failure
        if (dashboardData) {
          setDashboardData({
            ...dashboardData,
            user: {
              ...dashboardData.user,
              availability: !checked
            }
          });
        }
        toast({
          title: "Error",
          description: response.message || "Failed to update availability",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert on failure
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          user: {
            ...dashboardData.user,
            availability: !checked
          }
        });
      }
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive",
      });
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

  if (!dashboardData) {
    return (
      <DashboardLayout role="phlebotomist">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="phlebotomist">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Good Morning, {user?.fullName?.split(' ')[0] || 'Phlebotomist'}!
            </h1>
            <p className="text-muted-foreground">Ready for today's sample collections</p>
          </div>
        </div>

        {/* Pending Requests Alert */}
        {dashboardData?.stats.pendingRequests && dashboardData.stats.pendingRequests > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="bg-accent p-2 rounded-full text-white">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">New Assignment Requests</h3>
                <p className="text-sm text-muted-foreground">You have {dashboardData.stats.pendingRequests} new booking request(s) waiting for acceptance.</p>
              </div>
            </div>
            <Button onClick={() => window.location.href = '/phlebotomist/appointments'}>
              View Requests
            </Button>
          </motion.div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border shadow-sm">
            <Switch
              id="availability-mode"
              checked={dashboardData?.user.availability || false}
              onCheckedChange={handleAvailabilityToggle}
            />
            <Label htmlFor="availability-mode" className="cursor-pointer font-medium">
              {dashboardData?.user.availability ? "Online" : "Offline"}
            </Label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Today's Collections"
          value={dashboardData.stats.todaysCollections.toString()}
          icon={Calendar}
          color="accent"
          delay={0}
        />
        <StatCard
          title="Completed"
          value={dashboardData.stats.completed.toString()}
          icon={CheckCircle2}
          color="success"
          delay={0.1}
        />
        <StatCard
          title="In Progress"
          value={dashboardData.stats.inProgress.toString()}
          icon={Clock}
          color="warning"
          delay={0.2}
        />
        <StatCard
          title="Remaining"
          value={dashboardData.stats.remaining.toString()}
          icon={TestTube}
          color="primary"
          delay={0.3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-border bg-card p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Today's Schedule</h2>
                <p className="text-sm text-muted-foreground">Sample collection schedule</p>
              </div>
            </div>
            <div className="space-y-4">
              {dashboardData.schedule.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No bookings scheduled for today
                </p>
              ) : (
                dashboardData.schedule.map((booking, index) => {
                  const isNext = index === 0 && booking.status === 'confirmed';
                  const testNames = booking.tests.map(t => t.name).join(', ');
                  const address = booking.collectionType === 'home'
                    ? booking.collectionAddress || booking.patient.address
                    : booking.lab.labAddress;

                  return (
                    <motion.div
                      key={booking._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="group relative overflow-hidden rounded-lg border border-border bg-muted/30 p-4 transition-all hover:bg-muted/50 hover:shadow-soft"
                    >
                      {isNext && (
                        <div className="absolute right-0 top-0 h-full w-1 bg-accent" />
                      )}

                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                            <User className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-foreground">{booking.patient.fullName}</p>
                              {isNext && (
                                <Badge variant="default" className="bg-accent text-accent-foreground">
                                  Next
                                </Badge>
                              )}
                              {booking.status === 'in-progress' && (
                                <Badge variant="default" className="bg-warning text-warning-foreground">
                                  In Progress
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {address}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {booking.preferredTimeSlot}
                                </div>
                                <div className="flex items-center gap-1">
                                  <TestTube className="h-3 w-3" />
                                  {testNames}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {booking.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => handleStartCollection(booking._id)}
                            >
                              Start
                            </Button>
                          )}
                          {booking.status === 'in-progress' && (
                            <Button size="sm" variant="outline">
                              In Progress
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>

        {/* Side Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Completion Progress */}
          <Card className="border-border bg-card p-6 shadow-soft">
            <h3 className="mb-4 font-semibold text-foreground">Today's Progress</h3>
            <div className="mb-4">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-foreground">
                  {dashboardData.stats.completed}
                </span>
                <span className="mb-1 text-sm text-muted-foreground">
                  / {dashboardData.stats.todaysCollections} completed
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: dashboardData.stats.todaysCollections > 0
                      ? `${(dashboardData.stats.completed / dashboardData.stats.todaysCollections) * 100}%`
                      : '0%'
                  }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-accent to-primary"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {dashboardData.stats.completed > 0
                ? "Great work! Keep it up."
                : "Ready to start your day!"}
            </p>
          </Card>

          {/* Completed Collections */}
          <Card className="border-border bg-card p-6 shadow-soft">
            <h3 className="mb-4 font-semibold text-foreground">Completed Today</h3>
            <div className="space-y-3">
              {dashboardData.completedToday.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No completed collections yet
                </p>
              ) : (
                dashboardData.completedToday.map((booking, index) => {
                  const testNames = booking.tests.map(t => t.name).join(', ');
                  const time = new Date(booking.bookingDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <motion.div
                      key={booking._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-center gap-3 rounded-lg bg-success/10 p-3"
                    >
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {booking.patient.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">{testNames}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{time}</span>
                    </motion.div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border bg-card p-6 shadow-soft">
            <h3 className="mb-4 font-semibold text-foreground">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={() => window.location.href = '/phlebotomist/samples'}
              >
                <TestTube className="mr-2 h-4 w-4" />
                Manage Samples
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={() => window.location.href = '/phlebotomist/appointments'}
              >
                <Calendar className="mr-2 h-4 w-4" />
                View All Appointments
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout >
  );
};

export default PhlebotomistDashboard;
