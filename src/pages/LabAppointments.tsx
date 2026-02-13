// src/pages/LabAppointments.tsx
import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getToken } from "@/utils/storage";
import { toast } from "sonner";

import {
  Calendar,
  User,
  Phone,
  MapPin,
  FileText,
  Clock,
  Hash,
  Eye,
  Pencil,
  Trash2,
  Filter,
  CheckCircle2,
  Loader2,
  UserPlus,
} from "lucide-react";
import { phlebotomistRequestService } from "@/services/phlebotomistRequestService";

type AppointmentStatus = "pending" | "confirmed" | "in-progress" | "sample_collected" | "completed" | "cancelled";

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    fullName: string;
    phone: string;
    address: string;
  };
  tests: Array<{
    _id: string;
    name: string;
    basePrice: number;
  }>;
  bookingDate: string;
  preferredTimeSlot: string;
  collectionType: string;
  collectionAddress?: string;
  status: AppointmentStatus;
  totalAmount: number;
  notes?: string;
  sampleCollection?: {
    collectedAt: string;
    sampleId?: string;
    notes?: string;
  };
}

type Props = {
  insidePreview?: boolean;
};

const LabAppointments: React.FC<Props> = ({ insidePreview }) => {
  const Wrapper = (insidePreview ? React.Fragment : DashboardLayout) as React.ElementType;
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "All">("All");

  const [viewing, setViewing] = useState<Appointment | null>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState<Appointment | null>(null);
  const [assigning, setAssigning] = useState<Appointment | null>(null);
  const [availablePhlebotomists, setAvailablePhlebotomists] = useState<any[]>([]);
  const [loadingPhlebotomists, setLoadingPhlebotomists] = useState(false);

  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user?.id) return;

      try {
        const token = getToken();
        const response = await fetch(`http://localhost:5000/api/bookings/lab/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success) {
          setAppointments(data.data);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user?.id]);

  const totalAppointments = appointments.length;
  const completedToday = appointments.filter((a) => a.status === "completed").length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  const filteredAppointments = appointments.filter((a) => {
    const term = search.toLowerCase().trim();
    const testNames = a.tests.map(t => t.name).join(' ').toLowerCase();
    const searchMatch =
      !term ||
      a.patient.fullName.toLowerCase().includes(term) ||
      testNames.includes(term) ||
      a.patient.phone.includes(term);

    const statusMatch = statusFilter === "All"
      ? a.status !== "completed"
      : a.status === statusFilter;

    return searchMatch && statusMatch;
  });

  const updateAppointment = async (updated: Appointment) => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/bookings/${updated._id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: updated.status })
      });

      const data = await response.json();

      if (data.success) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === updated._id ? { ...a, status: updated.status } : a))
        );
        toast.success('Appointment status updated successfully');
      } else {
        toast.error(data.message || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/bookings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setAppointments((prev) => prev.filter((a) => a._id !== id));
        toast.success('Appointment cancelled successfully');
      } else {
        toast.error(data.message || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const fetchAvailablePhlebotomists = async (bookingId: string) => {
    setLoadingPhlebotomists(true);
    try {
      const response = await phlebotomistRequestService.getAvailablePhlebotomists(bookingId);
      if (response.success) {
        setAvailablePhlebotomists(response.data || []);
      } else {
        toast.error('Failed to load available phlebotomists');
      }
    } catch (error) {
      console.error('Error fetching phlebotomists:', error);
      toast.error('Error loading phlebotomists');
    } finally {
      setLoadingPhlebotomists(false);
    }
  };

  useEffect(() => {
    if (assigning) {
      fetchAvailablePhlebotomists(assigning._id);
    }
  }, [assigning]);

  const handleSendAssignmentRequest = async (phlebotomistId: string) => {
    if (!assigning) return;
    try {
      const response = await phlebotomistRequestService.sendRequest(assigning._id, phlebotomistId);
      if (response.success) {
        toast.success('Assignment request sent successfully');
        setAssigning(null);
      } else {
        toast.error(response.message || 'Failed to send request');
      }
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Error sending assignment request');
    }
  };

  if (loading) {
    return (
      <Wrapper role="lab">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper role="lab">
      <div className="w-full px-4 py-6 space-y-6">

        {/* HEADER */}
        <h1 className="text-3xl font-bold">Appointments</h1>
        <p className="text-sm text-muted-foreground">
          Manage and track appointments.
        </p>

        {/* STATS */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Total Appointments"
            value={totalAppointments.toString()}
            icon={Calendar}
            color="primary"
          />
          <StatCard
            title="Completed Today"
            value={completedToday.toString()}
            icon={CheckCircle2}
            color="success"
          />
          <StatCard
            title="Pending"
            value={pendingCount.toString()}
            icon={Clock}
            color="warning"
          />
        </div>

        {/* MAIN GRID */}
        <div className="grid gap-6 lg:grid-cols-[2.3fr,1.2fr]">

          {/* APPOINTMENT CARD */}
          <Card className="p-5 shadow-sm border">

            {/* FILTER BAR */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 w-full md:w-1/2 border rounded-full px-3 bg-muted/40">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name, test, or phone..."
                  className="border-none bg-transparent"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as AppointmentStatus | "All")
                }
                className="text-xs px-3 py-1 border bg-background rounded-full"
              >
                <option value="All">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="sample_collected">Sample Collected</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* APPOINTMENTS LIST */}
            <div className="space-y-4">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No appointments found.
                </div>
              ) : (
                filteredAppointments.map((item) => (
                  <Card
                    key={item._id}
                    className="p-4 border shadow-sm hover:shadow-md transition"
                  >

                    {/* TOP ROW */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            {item.patient.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {item.tests && item.tests.length > 0
                              ? item.tests.map(t => t?.name || 'Unknown Test').join(', ')
                              : 'No tests'}
                          </p>
                        </div>
                      </div>

                      <Badge
                        className={
                          item.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : item.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : item.status === "sample_collected"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                        }
                      >
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* DETAILS */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs mt-3">
                      <div className="flex gap-2 items-center">
                        <Phone className="h-3 w-3 text-primary" /> {item.patient.phone}
                      </div>
                      <div className="flex gap-2 items-center truncate">
                        <MapPin className="h-3 w-3 text-primary" /> {item.collectionType === 'home' ? item.collectionAddress : item.patient.address}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Calendar className="h-3 w-3 text-primary" /> {new Date(item.bookingDate).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Clock className="h-3 w-3 text-primary" /> {item.preferredTimeSlot}
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => setViewing(item)}>
                        <Eye className="h-3 w-3" /> View
                      </Button>
                      <Button size="sm" onClick={() => setEditing(item)}>
                        <Pencil className="h-3 w-3" /> Edit Status
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleting(item)}
                      >
                        <Trash2 className="h-3 w-3" /> Cancel
                      </Button>
                      {(item.status === 'confirmed' || item.status === 'pending') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setAssigning(item)}
                        >
                          <UserPlus className="h-3 w-3" /> Assign
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>

          </Card>

          {/* SIDE CARDS */}
          <div className="space-y-4">
            <Card className="p-4 shadow-sm">
              <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Today's Summary
              </h3>
              <p className="text-xs">{completedToday} completed today.</p>
              <p className="text-xs">{pendingCount} pending.</p>
            </Card>

            <Card className="p-4 shadow-sm">
              <h3 className="font-semibold mb-2 text-sm">Notes</h3>
              <p className="text-xs text-muted-foreground">
                Keep appointments updated for accurate dashboards.
              </p>
            </Card>
          </div>
        </div>

        {/* VIEW MODAL */}
        {viewing && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <Card className="w-[460px] bg-white p-6 rounded-xl shadow-xl">

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  Appointment Details
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setViewing(null)}>
                  ✕
                </Button>
              </div>

              <div className="space-y-3 text-sm">
                <p><strong>Patient:</strong> {viewing.patient.fullName}</p>
                <p><strong>Tests:</strong> {viewing.tests && viewing.tests.length > 0
                  ? viewing.tests.map(t => t?.name || 'Unknown Test').join(', ')
                  : 'No tests'}</p>
                <p><strong>Date:</strong> {new Date(viewing.bookingDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {viewing.preferredTimeSlot}</p>
                <p><strong>Phone:</strong> {viewing.patient.phone}</p>
                <p><strong>Collection Type:</strong> {viewing.collectionType}</p>
                <p><strong>Address:</strong> {viewing.collectionType === 'home' ? viewing.collectionAddress : viewing.patient.address}</p>
                <p><strong>Total Amount:</strong> Rs. {viewing.totalAmount}</p>
                {viewing.notes && (
                  <p><strong>Notes:</strong> {viewing.notes}</p>
                )}

                {viewing.sampleCollection && (
                  <div className="mt-4 p-3 bg-muted rounded-md space-y-2 border border-border">
                    <p className="font-semibold text-primary flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Sample Collection Details
                    </p>
                    <p><strong>Sample ID:</strong> {viewing.sampleCollection.sampleId || 'N/A'}</p>
                    <p><strong>Collected At:</strong> {new Date(viewing.sampleCollection.collectedAt).toLocaleString()}</p>
                    {viewing.sampleCollection.notes && (
                      <p><strong>Collection Notes:</strong> {viewing.sampleCollection.notes}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setViewing(null)}>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* EDIT MODAL */}
        {editing && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <Card className="w-[420px] bg-white p-6 rounded-xl shadow-xl">

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-primary" />
                  Update Status
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setEditing(null)}>
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm mb-2"><strong>Patient:</strong> {editing.patient.fullName}</p>
                  <p className="text-sm mb-2"><strong>Tests:</strong> {editing.tests && editing.tests.length > 0
                    ? editing.tests.map(t => t?.name || 'Unknown Test').join(', ')
                    : 'No tests'}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Status</p>
                  <select
                    value={editing.status}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        status: e.target.value as AppointmentStatus,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    updateAppointment(editing);
                    setEditing(null);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* DELETE MODAL */}
        {deleting && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <Card className="w-[380px] bg-white p-6 rounded-xl shadow-xl">

              <h2 className="text-lg font-semibold mb-2">Cancel Appointment?</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to cancel appointment for{" "}
                <strong>{deleting.patient.fullName}</strong>? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDeleting(null)}>
                  No, Keep It
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    deleteAppointment(deleting._id);
                    setDeleting(null);
                  }}
                >
                  Yes, Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ASSIGN MODAL */}
        {assigning && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <Card className="w-[600px] bg-white p-6 rounded-xl shadow-xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Assign Phlebotomist
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setAssigning(null)}>
                  ✕
                </Button>
              </div>

              <div className="mb-4 text-sm bg-gray-50 p-3 rounded-md">
                <p><strong>Booking for:</strong> {assigning.patient.fullName}</p>
                <p><strong>Tests:</strong> {assigning.tests.map(t => t.name).join(', ')}</p>
                <p><strong>Time:</strong> {assigning.preferredTimeSlot}, {new Date(assigning.bookingDate).toLocaleDateString()}</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Available Phlebotomists</h3>

                {loadingPhlebotomists ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : availablePhlebotomists.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground bg-gray-50 rounded-lg">
                    No available phlebotomists found for this slot.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availablePhlebotomists.map((phlebotomist) => (
                      <div key={phlebotomist._id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition">
                        <div>
                          <p className="font-medium text-sm">{phlebotomist.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {phlebotomist.distance ? `${phlebotomist.distance.toFixed(1)} km away` : 'Unknown distance'}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] h-5">
                              {phlebotomist.pendingRequests || 0} Pending
                            </Badge>
                            <Badge variant="outline" className="text-[10px] h-5 bg-blue-50">
                              {phlebotomist.currentLoad || 0} Active
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSendAssignmentRequest(phlebotomist._id)}
                          className="bg-primary text-white hover:bg-primary/90"
                        >
                          Send Request
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setAssigning(null)}>
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

      </div>
    </Wrapper>
  );
};

export default LabAppointments;
