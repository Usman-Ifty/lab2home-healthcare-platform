import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { adminAPI } from "@/lib/api";
import { Users, Search, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface Patient {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    isActive: boolean;
    createdAt: string;
}

const PatientManagement = () => {
    const { toast } = useToast();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Dialog states
    const [activateDialog, setActivateDialog] = useState<{ open: boolean; patient: Patient | null }>({
        open: false,
        patient: null,
    });
    const [deactivateDialog, setDeactivateDialog] = useState<{ open: boolean; patient: Patient | null }>({
        open: false,
        patient: null,
    });

    useEffect(() => {
        fetchPatients();
    }, [statusFilter, searchQuery, page]);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAllPatients({
                status: statusFilter === "all" ? undefined : statusFilter,
                search: searchQuery || undefined,
                page,
                limit: 20,
            });
            if (response.success) {
                setPatients(response.data);
                setTotalPages((response as any).pagination?.pages || 1);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to fetch patients",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        if (!activateDialog.patient) return;

        try {
            const response = await adminAPI.activatePatient(activateDialog.patient._id);
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Patient activated successfully",
                });
                fetchPatients();
                setActivateDialog({ open: false, patient: null });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to activate patient",
                variant: "destructive",
            });
        }
    };

    const handleDeactivate = async () => {
        if (!deactivateDialog.patient) return;

        try {
            const response = await adminAPI.deactivatePatient(deactivateDialog.patient._id);
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Patient deactivated successfully",
                });
                fetchPatients();
                setDeactivateDialog({ open: false, patient: null });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to deactivate patient",
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (patient: Patient) => {
        if (!patient.isActive) {
            return <Badge variant="destructive">Suspended</Badge>;
        }
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Users className="w-8 h-8 text-primary" />
                            Patient Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            View patient data and manage account status
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Patients</CardTitle>
                        <CardDescription>View and manage patient accounts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Table */}
                        {loading ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">Loading patients...</p>
                            </div>
                        ) : patients.length === 0 ? (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>No patients found</AlertDescription>
                            </Alert>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Address</TableHead>
                                                <TableHead>Date of Birth</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Registered</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {patients.map((patient) => (
                                                <TableRow key={patient._id}>
                                                    <TableCell className="font-medium">{patient.fullName}</TableCell>
                                                    <TableCell>{patient.email}</TableCell>
                                                    <TableCell>{patient.phone || "N/A"}</TableCell>
                                                    <TableCell>{patient.address || "N/A"}</TableCell>
                                                    <TableCell>
                                                        {patient.dateOfBirth
                                                            ? new Date(patient.dateOfBirth).toLocaleDateString()
                                                            : "N/A"}
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(patient)}</TableCell>
                                                    <TableCell>
                                                        {new Date(patient.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {patient.isActive ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setDeactivateDialog({ open: true, patient })}
                                                                >
                                                                    <XCircle className="w-4 h-4 mr-1" />
                                                                    Deactivate
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    onClick={() => setActivateDialog({ open: true, patient })}
                                                                >
                                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                                    Activate
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Page {page} of {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page - 1)}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page + 1)}
                                            disabled={page === totalPages}
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Activate Dialog */}
            <Dialog open={activateDialog.open} onOpenChange={(open) => setActivateDialog({ open, patient: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Activate Patient</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to activate {activateDialog.patient?.fullName}?
                            <br />
                            <span className="text-sm text-muted-foreground mt-2 block">
                                This patient will be able to book tests and access all services.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActivateDialog({ open: false, patient: null })}>
                            Cancel
                        </Button>
                        <Button onClick={handleActivate}>Activate</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deactivate Dialog */}
            <Dialog open={deactivateDialog.open} onOpenChange={(open) => setDeactivateDialog({ open, patient: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deactivate Patient</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate {deactivateDialog.patient?.fullName}?
                            <br />
                            <span className="text-sm text-destructive mt-2 block">
                                This patient will not be able to book tests or access services.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeactivateDialog({ open: false, patient: null })}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeactivate}>Deactivate</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default PatientManagement;
