import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { getToken } from "@/utils/storage";
import {
  Calendar,
  FileUp,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  Loader2,
  Settings,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

interface Booking {
  _id: string;
  patient: {
    _id: string;
    fullName: string;
  };
  test: {
    name: string;
  };
  bookingDate: string;
  preferredTimeSlot: string;
  status: string;
}

const LabDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<Array<{ time: string; isActive: boolean }>>([]);
  const [savingSlots, setSavingSlots] = useState(false);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingReports: 0,
    activePatients: 0,
    completionRate: 0,
    completedToday: 0,
    inProgressToday: 0,
    scheduledToday: 0,
    cancelledToday: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;

      try {
        const token = getToken();

        // Fetch bookings
        const apiUrl = API_BASE_URL;
        const bookingsResponse = await fetch(`${apiUrl}/bookings/lab/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const bookingsData = await bookingsResponse.json();

        // Fetch lab details including time slots
        const labResponse = await fetch(`${apiUrl}/labs/${user.id}/tests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const labData = await labResponse.json();

        if (bookingsData.success) {
          const allBookings = bookingsData.data;
          setBookings(allBookings);

          // Calculate stats
          const today = new Date().toISOString().split('T')[0];

          const todayBookings = allBookings.filter((b: Booking) =>
            new Date(b.bookingDate).toISOString().split('T')[0] === today
          );

          const uniquePatients = new Set(allBookings.map((b: Booking) => b.patient?._id)).size;
          const completedCount = allBookings.filter((b: Booking) => b.status === 'completed').length;
          const totalActionable = allBookings.filter((b: Booking) => b.status !== 'cancelled').length;
          const rate = totalActionable > 0 ? Math.round((completedCount / totalActionable) * 100) : 0;

          setStats({
            todayAppointments: todayBookings.length,
            pendingReports: allBookings.filter((b: Booking) => b.status === 'in-progress').length,
            activePatients: uniquePatients,
            completionRate: rate,
            completedToday: todayBookings.filter((b: Booking) => b.status === 'completed').length,
            inProgressToday: todayBookings.filter((b: Booking) => b.status === 'in-progress').length,
            scheduledToday: todayBookings.filter((b: Booking) => ['pending', 'confirmed'].includes(b.status)).length,
            cancelledToday: todayBookings.filter((b: Booking) => b.status === 'cancelled').length,
          });
        }

        if (labData.success && labData.data.timeSlots) {
          setTimeSlots(labData.data.timeSlots);
        }
      } catch (error) {
        console.error('Error fetching lab dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const handleToggleSlot = (index: number) => {
    setTimeSlots(prev => prev.map((slot, i) =>
      i === index ? { ...slot, isActive: !slot.isActive } : slot
    ));
  };

  const handleSaveTimeSlots = async () => {
    if (!user?.id) return;

    setSavingSlots(true);
    try {
      const token = getToken();
      const apiUrl = API_BASE_URL;
      const response = await fetch(`${apiUrl}/labs/${user.id}/time-slots`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeSlots })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Time slots updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update time slots');
      }
    } catch (error) {
      console.error('Error saving time slots:', error);
      toast.error('Failed to save time slots');
    } finally {
      setSavingSlots(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="lab">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Filter for today's appointments list
  const today = new Date().toISOString().split('T')[0];
  const todaysList = bookings.filter((b: Booking) =>
    new Date(b.bookingDate).toISOString().split('T')[0] === today
  );

  return (
    <DashboardLayout role="lab">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {user?.labName || "Laboratory"} Dashboard
        </h1>
        <p className="text-muted-foreground">Manage tests, reports, and appointments</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments.toString()}
          icon={Calendar}
          color="secondary"
          delay={0}
        />
        <StatCard
          title="Pending Reports"
          value={stats.pendingReports.toString()}
          change="Needs Action"
          trend="down"
          icon={FileUp}
          color="warning"
          delay={0.1}
        />
        <StatCard
          title="Total Patients"
          value={stats.activePatients.toString()}
          icon={Users}
          color="primary"
          delay={0.2}
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          icon={TrendingUp}
          color="success"
          delay={0.3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Reports Upload (Mocked for now as we don't have report upload yet) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-border bg-card p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Pending Actions</h2>
                <p className="text-sm text-muted-foreground">Bookings requiring attention</p>
              </div>
            </div>

            <div className="space-y-4">
              {bookings.filter(b => b.status === 'pending').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending bookings requiring attention.
                </div>
              ) : (
                bookings
                  .filter(b => b.status === 'pending')
                  .slice(0, 5)
                  .map((booking, index) => (
                    <motion.div
                      key={booking._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                          <Clock className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{booking.patient?.fullName || 'Unknown Patient'}</p>
                          <p className="text-sm text-muted-foreground">{booking.test?.name}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(booking.bookingDate).toLocaleDateString()} at {booking.preferredTimeSlot}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Pending</Badge>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate('/lab/appointments')}
                        >
                          Process
                        </Button>
                      </div>
                    </motion.div>
                  ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <Card className="border-border bg-card p-6 shadow-soft">
            <h3 className="mb-4 font-semibold text-foreground">Today's Overview</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm text-muted-foreground">Completed</span>
                </div>
                <span className="font-semibold text-foreground">{stats.completedToday}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-sm text-muted-foreground">In Progress</span>
                </div>
                <span className="font-semibold text-foreground">{stats.inProgressToday}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Scheduled</span>
                </div>
                <span className="font-semibold text-foreground">{stats.scheduledToday}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">Cancelled</span>
                </div>
                <span className="font-semibold text-foreground">{stats.cancelledToday}</span>
              </div>
            </div>
          </Card>

          <Card className="border-border bg-card p-6 shadow-soft">
            <h3 className="mb-4 font-semibold text-foreground">Performance</h3>

            <div className="space-y-3">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-medium text-foreground">{stats.completionRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.completionRate}%` }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="h-full bg-secondary"
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Today's Appointments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <Card className="border-border bg-card p-6 shadow-soft">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Today's Appointments</h2>
            <p className="text-sm text-muted-foreground">Scheduled sample collections and tests for today</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {todaysList.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                No appointments scheduled for today.
              </div>
            ) : (
              todaysList.map((apt, index) => (
                <motion.div
                  key={apt._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-4 hover:shadow-soft"
                >
                  <div>
                    <p className="font-medium text-foreground">{apt.patient?.fullName || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{apt.test?.name}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {apt.preferredTimeSlot}
                    </div>
                  </div>
                  <Badge
                    variant={
                      apt.status === "completed" ? "default" :
                        apt.status === "in-progress" ? "secondary" :
                          "outline"
                    }
                    className="capitalize"
                  >
                    {apt.status}
                  </Badge>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </motion.div>

      {/* Time Slot Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-6"
      >
        <Card className="border-border bg-card p-6 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Time Slot Configuration</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Manage your available appointment slots</p>
            </div>
            <Button
              onClick={handleSaveTimeSlots}
              disabled={savingSlots || timeSlots.length === 0}
              size="sm"
            >
              {savingSlots ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {timeSlots.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No time slots configured
              </div>
            ) : (
              timeSlots.map((slot, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-all ${slot.isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-muted/30'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className={`h-4 w-4 ${slot.isActive ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    <Label
                      htmlFor={`slot-${index}`}
                      className={`text-sm font-medium cursor-pointer ${slot.isActive ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                    >
                      {slot.time}
                    </Label>
                  </div>
                  <Switch
                    id={`slot-${index}`}
                    checked={slot.isActive}
                    onCheckedChange={() => handleToggleSlot(index)}
                  />
                </motion.div>
              ))
            )}
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Disabled slots will not be available for patients to book. Changes take effect immediately after saving.
            </p>
          </div>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default LabDashboard;
