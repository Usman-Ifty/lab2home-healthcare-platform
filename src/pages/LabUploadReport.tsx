import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { getToken } from "@/utils/storage";
import { toast } from "sonner";
import { uploadReport } from "@/lib/api";
import {
  FileText,
  Upload,
  User,
  Calendar,
  Search,
  Loader2,
  CheckCircle2
} from "lucide-react";

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    fullName: string;
    phone: string;
  };
  tests: Array<{
    _id: string;
    name: string;
    basePrice: number;
  }>;
  bookingDate: string;
  status: string;
  reportUrl?: string;
}

const LabUploadReport: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState<string | null>(null); // ID of booking being uploaded
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Appointment | null>(null);

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user?.id) return;

      try {
        const token = getToken();
        // Fetch all bookings, we'll filter client side for now as backend API returns all
        // Ideally backend should support filtering by reportUrl existence
        const response = await fetch(`http://localhost:5000/api/bookings/lab/${user.id}?status=completed`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success) {
          // Filter for completed appointments that DON'T have a report yet
          const pendingReports = data.data.filter((a: Appointment) => !a.reportUrl);
          setAppointments(pendingReports);
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

  const filteredAppointments = appointments.filter((a) => {
    const term = search.toLowerCase().trim();
    const testNames = a.tests.map(t => t.name).join(' ').toLowerCase();
    return (
      !term ||
      a.patient.fullName.toLowerCase().includes(term) ||
      testNames.includes(term) ||
      a.patient.phone.includes(term)
    );
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedBooking || !selectedFile) return;

    setUploading(selectedBooking._id);
    try {
      const response = await uploadReport(selectedBooking._id, selectedFile);

      if (response.success) {
        toast.success('Report uploaded successfully!');
        // Remove from list
        setAppointments(prev => prev.filter(a => a._id !== selectedBooking._id));
        setSelectedBooking(null);
        setSelectedFile(null);
      } else {
        toast.error(response.message || 'Failed to upload report');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload report');
    } finally {
      setUploading(null);
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

  return (
    <DashboardLayout role="lab">
      <div className="w-full px-4 py-6 space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Upload Reports</h1>
          <p className="text-sm text-muted-foreground">
            Upload test reports for completed appointments.
          </p>
        </div>

        {/* SEARCH */}
        <div className="flex items-center gap-2 max-w-md border rounded-full px-3 bg-white shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient or test..."
            className="border-none bg-transparent focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* LIST */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAppointments.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>No pending reports to upload.</p>
            </div>
          ) : (
            filteredAppointments.map((item) => (
              <Card key={item._id} className="p-5 hover:shadow-md transition-shadow border-l-4 border-l-primary">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      {item.patient.fullName}
                    </h3>
                    <p className="text-xs text-muted-foreground">{item.patient.phone}</p>
                  </div>
                  <div className="bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded-full font-medium uppercase tracking-wide">
                    Pending Report
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {item.tests && item.tests.length > 0
                        ? item.tests.map(t => t?.name || 'Unknown Test').join(', ')
                        : 'No tests'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(item.bookingDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={() => setSelectedBooking(item)}
                >
                  <Upload className="h-4 w-4" /> Upload Report
                </Button>
              </Card>
            ))
          )}
        </div>

        {/* UPLOAD MODAL */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6 bg-white animate-in fade-in zoom-in duration-200">
              <h2 className="text-xl font-bold mb-4">Upload Report</h2>

              <div className="space-y-4 mb-6">
                <div className="bg-muted/30 p-3 rounded-lg text-sm">
                  <p><strong>Patient:</strong> {selectedBooking.patient.fullName}</p>
                  <p><strong>Tests:</strong> {selectedBooking.tests && selectedBooking.tests.length > 0
                    ? selectedBooking.tests.map(t => t?.name || 'Unknown Test').join(', ')
                    : 'No tests'}</p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                      <FileText className="h-6 w-6" />
                      {selectedFile.name}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Click to select file</p>
                      <p className="text-xs mt-1">PDF, JPG, PNG (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedBooking(null);
                    setSelectedFile(null);
                  }}
                  disabled={!!uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !!uploading}
                  className="gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Upload
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default LabUploadReport;
