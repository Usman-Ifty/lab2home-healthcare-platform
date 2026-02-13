import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { QrCode, TestTube, Save, Loader2, RefreshCw } from "lucide-react";
import { phlebotomistService } from "@/services/phlebotomist.service";

interface Booking {
    _id: string;
    patient: {
        fullName: string;
        phone: string;
    };
    tests: Array<{ name: string; category: string }>;
    bookingDate: string;
    preferredTimeSlot: string;
    status: string;
}

const PhlebotomistSamples = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialBookingId = searchParams.get('bookingId');

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBookingId, setSelectedBookingId] = useState<string>(initialBookingId || "");
    const [sampleId, setSampleId] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch active bookings
    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await phlebotomistService.getAssignedBookings({ status: 'in-progress' });
            if (response.success) {
                setBookings(response.data || []);
            }
        } catch (error) {
            console.error("Failed to load bookings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        if (initialBookingId) {
            setSelectedBookingId(initialBookingId);
        }
    }, [initialBookingId]);

    const selectedBooking = bookings.find(b => b._id === selectedBookingId);

    const handleScan = () => {
        // Mock Scan
        const newCode = "SMP-" + Math.floor(Math.random() * 100000);
        setSampleId(newCode);
        toast.info("Mock QR Code Scanned: " + newCode);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedBookingId) {
            toast.error("Please select a booking first.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await phlebotomistService.updateBookingStatus(
                selectedBookingId,
                'sample_collected',
                notes,
                {
                    sampleId: sampleId,
                    collectedAt: new Date()
                }
            );

            if (response.success) {
                toast.success("Sample Collection Logged Successfully!");
                setSampleId("");
                setNotes("");
                setSelectedBookingId("");
                // Refresh list
                fetchBookings();
                // Optionally redirect back to list
                navigate('/phlebotomist/appointments');
            } else {
                toast.error(response.message || "Failed to log sample collection");
            }
        } catch (error) {
            console.error("Submission error", error);
            toast.error("An error occurred while logging the sample.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="phlebotomist">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="phlebotomist">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Sample Collection</h1>
                <p className="text-muted-foreground">Log details for collected samples</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Entry Form */}
                <Card className="p-6 shadow-soft order-2 lg:order-1">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Booking Selection */}
                        <div className="space-y-2">
                            <Label>Select Patient / Appointment</Label>
                            <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select active appointment" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bookings.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground">No in-progress appointments</div>
                                    ) : (
                                        bookings.map(b => (
                                            <SelectItem key={b._id} value={b._id}>
                                                {b.patient.fullName} - {b.tests.map(t => t.name).join(', ')}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {bookings.length === 0 && (
                                <p className="text-xs text-amber-600">
                                    Note: You must mark an appointment as "In Progress" from the Appointments page first.
                                </p>
                            )}
                        </div>

                        {selectedBooking && (
                            <div className="bg-primary/5 p-4 rounded-md border border-primary/10 text-sm space-y-1">
                                <p><strong>Patient:</strong> {selectedBooking.patient.fullName}</p>
                                <p><strong>Phone:</strong> {selectedBooking.patient.phone}</p>
                                <p><strong>Tests:</strong> {selectedBooking.tests.map(t => t.name).join(', ')}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Sample ID / Barcode</Label>
                                <Button type="button" size="sm" variant="outline" onClick={handleScan}>
                                    <QrCode className="h-4 w-4 mr-2" />
                                    Scan QR
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <span className="flex items-center justify-center w-10 bg-muted rounded-md text-muted-foreground">
                                    <TestTube className="h-5 w-5" />
                                </span>
                                <Input
                                    placeholder="Scan or enter Sample ID"
                                    value={sampleId}
                                    onChange={(e) => setSampleId(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Input
                                placeholder="Any difficulty or observations..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full gap-2" disabled={!selectedBookingId || isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Log Sample Collection
                        </Button>
                    </form>
                </Card>

                {/* Instructions / Info */}
                <Card className="p-6 shadow-soft bg-primary/5 border-primary/20 order-1 lg:order-2 h-fit">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <TestTube className="h-5 w-5 text-primary" />
                        Collection Guidelines
                    </h3>
                    <ul className="space-y-3 text-sm text-foreground/80">
                        <li className="flex gap-2">
                            <span className="font-bold text-primary">1.</span>
                            Set Appointment to "In Progress" before collecting.
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-primary">2.</span>
                            Verify patient identity using ID card.
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-primary">3.</span>
                            Ensure all tubes are labelled immediately.
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-primary">4.</span>
                            Scan barcode to link tube to digital record.
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-primary">5.</span>
                            Submitting this form completes the collection task.
                        </li>
                    </ul>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default PhlebotomistSamples;
