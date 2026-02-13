import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getToken } from "@/utils/storage";
import {
  TestTube,
  FileCheck,
  Clock,
  Calendar,
  TrendingUp,
  Pill,
  Heart,
  Loader2,
  Sparkles,
  Lightbulb
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Booking {
  _id: string;
  tests: Array<{
    _id: string;
    name: string;
    category: string;
    basePrice: number;
  }>;
  lab: {
    labName: string;
  };
  bookingDate: string;
  preferredTimeSlot: string;
  status: string;
  totalAmount: number;
  reportUrl?: string;
  reportUploadedAt?: string;
}

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    upcoming: 0
  });

  // Daily Health Tips
  const healthTips = [
    "Drink at least 8 glasses of water daily to stay hydrated.",
    "Walking 30 minutes a day can improve heart health significantly.",
    "Get 7-8 hours of sleep to boost your immune system.",
    "Eat more leafy greens to improve your iron levels naturally.",
    "Limit sugar intake to reduce the risk of chronic diseases.",
    "Regular health checkups can catch potential issues early.",
    "Practice deep breathing exercises to reduce stress levels."
  ];

  const [dailyTip, setDailyTip] = useState("");

  useEffect(() => {
    // Select a tip based on the current date so it stays the same for the whole day
    const dateString = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash = dateString.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % healthTips.length;
    setDailyTip(healthTips[index]);
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id) return;

      try {
        const token = getToken();
        const response = await fetch(`http://localhost:5000/api/bookings/patient/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success) {
          const fetchedBookings = data.data;
          setBookings(fetchedBookings);

          // Calculate stats
          const total = fetchedBookings.length;
          const completed = fetchedBookings.filter((b: Booking) => b.status === 'completed').length;
          const pending = fetchedBookings.filter((b: Booking) => b.status === 'pending').length;
          const upcoming = fetchedBookings.filter((b: Booking) =>
            ['pending', 'confirmed'].includes(b.status) && new Date(b.bookingDate) >= new Date()
          ).length;

          setStats({ total, completed, pending, upcoming });
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user?.id]);

  if (loading) {
    return (
      <DashboardLayout role="patient">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="patient">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-foreground mb-2">Welcome back, {user?.fullName?.split(' ')[0] || 'Patient'}!</h1>
        <p className="text-muted-foreground">Your health dashboard at a glance</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Tests"
          value={stats.total.toString()}
          icon={TestTube}
          color="primary"
          delay={0}
        />
        <StatCard
          title="Completed"
          value={stats.completed.toString()}
          change={stats.completed > 0 ? "Tests done" : "No tests yet"}
          trend="up"
          icon={FileCheck}
          color="success"
          delay={0.1}
        />
        <StatCard
          title="Pending"
          value={stats.pending.toString()}
          icon={Clock}
          color="warning"
          delay={0.2}
        />
        <StatCard
          title="Upcoming"
          value={stats.upcoming.toString()}
          icon={Calendar}
          color="accent"
          delay={0.3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Tests */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-border bg-card p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Recent Bookings</h2>
                <p className="text-sm text-muted-foreground">Your latest test appointments</p>
              </div>
              <Button onClick={() => navigate('/patient/book-test')}>
                <TestTube className="mr-2 h-4 w-4" />
                Book New Test
              </Button>
            </div>

            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No bookings found. Book your first test today!
                </div>
              ) : (
                bookings.slice(0, 3).map((booking, index) => (
                  <motion.div
                    key={booking._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4 transition-all hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <TestTube className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {booking.tests && booking.tests.length > 0
                            ? booking.tests.map(t => t?.name || 'Unknown Test').join(', ')
                            : 'Unknown Test'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(booking.bookingDate).toLocaleDateString()} at {booking.preferredTimeSlot}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{booking.lab?.labName}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize
                      ${booking.status === 'completed' ? 'bg-success/10 text-success' :
                        booking.status === 'pending' ? 'bg-warning/10 text-warning' :
                          booking.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                            'bg-primary/10 text-primary'}`}
                    >
                      {booking.status}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Health Insights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Daily Health Tip */}
          <Card className="border-border bg-gradient-to-br from-primary/5 to-secondary/5 p-6 shadow-soft border-l-4 border-l-primary">
            <div className="mb-3 flex items-center gap-2">
              <div className="p-2 bg-background rounded-full shadow-sm">
                <Lightbulb className="h-5 w-5 text-warning" />
              </div>
              <h3 className="font-semibold text-foreground">Health Tip of the Day</h3>
            </div>
            <p className="text-sm font-medium text-foreground italic">
              "{dailyTip}"
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-secondary" />
              <span>Small changes make a big difference!</span>
            </div>
          </Card>

          <Card className="border-border bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-secondary" />
              <h3 className="font-semibold text-foreground">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Pill className="mr-2 h-4 w-4" />
                Order Medical Supplies
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileCheck className="mr-2 h-4 w-4" />
                View AI Insights
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <Card className="border-border bg-card p-6 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Recent Reports</h2>
              <p className="text-sm text-muted-foreground">View and download your test results</p>
            </div>
            {bookings.filter(b => b.reportUrl && b.status === 'completed').length > 0 && (
              <Button variant="outline" onClick={() => navigate('/patient/reports')}>
                View All Reports
              </Button>
            )}
          </div>
          {bookings.filter(b => b.reportUrl && b.status === 'completed').length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No reports available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {bookings
                .filter(b => b.reportUrl && b.status === 'completed')
                .slice(0, 3)
                .map((booking) => (
                  <div
                    key={booking._id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success flex-shrink-0">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {booking.tests.map(t => t.name).join(', ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.lab.labName}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/patient/reports')}
                      className="flex-shrink-0"
                    >
                      View
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
