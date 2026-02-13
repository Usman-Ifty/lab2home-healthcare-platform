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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { adminAPI } from "@/lib/api";
import { Users, Search, CheckCircle, XCircle, FileText, Edit, Trash2, AlertCircle, ChevronLeft, ChevronRight, Eye, Download } from "lucide-react";

interface Phlebotomist {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
    qualification?: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    trafficLicense?: {
        filename: string;
        contentType: string;
    };
}

const PhlebotomistManagement = () => {
    const { toast } = useToast();
    const [phlebotomists, setPhlebotomists] = useState<Phlebotomist[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState("pending");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Dialog states
    const [approveDialog, setApproveDialog] = useState<{ open: boolean; phlebotomist: Phlebotomist | null }>({
        open: false,
        phlebotomist: null,
    });
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; phlebotomist: Phlebotomist | null }>({
        open: false,
        phlebotomist: null,
    });
    const [rejectReason, setRejectReason] = useState("");
    const [removeDialog, setRemoveDialog] = useState<{ open: boolean; phlebotomist: Phlebotomist | null }>({
        open: false,
        phlebotomist: null,
    });
    const [licenseDialog, setLicenseDialog] = useState<{ open: boolean; phlebotomist: Phlebotomist | null; url: string | null }>({
        open: false,
        phlebotomist: null,
        url: null,
    });

    useEffect(() => {
        fetchPhlebotomists();
    }, [currentTab, statusFilter, searchQuery, page]);

    const fetchPhlebotomists = async () => {
        try {
            setLoading(true);

            if (currentTab === "pending") {
                const response = await adminAPI.getPendingPhlebotomists();
                if (response.success) {
                    setPhlebotomists(response.data);
                    setTotalPages(1);
                }
            } else {
                const response = await adminAPI.getAllPhlebotomists({
                    status: statusFilter === "all" ? undefined : statusFilter,
                    search: searchQuery || undefined,
                    page,
                    limit: 20,
                });
                if (response.success) {
                    setPhlebotomists(response.data);
                    setTotalPages((response as any).pagination?.pages || 1);
                }
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to fetch phlebotomists",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleViewLicense = async (phlebotomist: Phlebotomist) => {
        try {
            const blob = await adminAPI.getPhlebotomistLicense(phlebotomist._id);
            const url = URL.createObjectURL(blob);
            setLicenseDialog({ open: true, phlebotomist, url });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load traffic license",
                variant: "destructive",
            });
        }
    };

    const handleDownloadLicense = () => {
        if (licenseDialog.url && licenseDialog.phlebotomist) {
            const a = document.createElement('a');
            a.href = licenseDialog.url;
            a.download = licenseDialog.phlebotomist.trafficLicense?.filename || 'license.pdf';
            a.click();
        }
    };

    const handleApprove = async () => {
        if (!approveDialog.phlebotomist) return;

        try {
            const response = await adminAPI.approvePhlebotomist(approveDialog.phlebotomist._id);
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Phlebotomist approved successfully",
                });
                fetchPhlebotomists();
                setApproveDialog({ open: false, phlebotomist: null });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to approve phlebotomist",
                variant: "destructive",
            });
        }
    };

    const handleReject = async () => {
        if (!rejectDialog.phlebotomist || !rejectReason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a reason for rejection",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await adminAPI.rejectPhlebotomist(rejectDialog.phlebotomist._id, rejectReason);
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Phlebotomist rejected successfully",
                });
                fetchPhlebotomists();
                setRejectDialog({ open: false, phlebotomist: null });
                setRejectReason("");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to reject phlebotomist",
                variant: "destructive",
            });
        }
    };

    const handleRemove = async () => {
        if (!removeDialog.phlebotomist) return;

        try {
            const response = await adminAPI.removePhlebotomist(removeDialog.phlebotomist._id);
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Phlebotomist removed successfully",
                });
                fetchPhlebotomists();
                setRemoveDialog({ open: false, phlebotomist: null });
            } else {
                // Handle error response from backend
                toast({
                    title: "Error",
                    description: response.message || "Failed to remove phlebotomist",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            // Extract error message from API response
            const errorMessage = error.response?.data?.message || error.message || "Failed to remove phlebotomist";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    const handleActivate = async (phlebotomist: Phlebotomist) => {
        try {
            const response = await adminAPI.activatePhlebotomist(phlebotomist._id);
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Phlebotomist activated successfully. They can now accept assignments.",
                });
                fetchPhlebotomists();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to activate phlebotomist",
                variant: "destructive",
            });
        }
    };

    const handleDeactivate = async (phlebotomist: Phlebotomist) => {
        try {
            const response = await adminAPI.deactivatePhlebotomist(phlebotomist._id);
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Phlebotomist deactivated successfully. They cannot accept new assignments.",
                });
                fetchPhlebotomists();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to deactivate phlebotomist",
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (phlebotomist: Phlebotomist) => {
        if (!phlebotomist.isActive) {
            return <Badge variant="destructive">Inactive</Badge>;
        }
        if (!phlebotomist.isVerified) {
            return <Badge variant="secondary">Pending</Badge>;
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
                            Phlebotomist Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Review registrations, verify documents, and manage phlebotomists
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Phlebotomist Management</CardTitle>
                        <CardDescription>Approve Pending Phlebotomists and manage existing ones</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Tabs */}
                        <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="pending">Pending Phlebotomists</TabsTrigger>
                                <TabsTrigger value="all">All Phlebotomists</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Filters */}
                        {currentTab === "all" && (
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Search by phlebotomist name or email..."
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
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Table */}
                        {loading ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">Loading phlebotomists...</p>
                            </div>
                        ) : phlebotomists.length === 0 ? (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>No phlebotomists found</AlertDescription>
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
                                                <TableHead>Qualification</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Registered</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {phlebotomists.map((phlebotomist) => (
                                                <TableRow key={phlebotomist._id}>
                                                    <TableCell className="font-medium">{phlebotomist.fullName}</TableCell>
                                                    <TableCell>{phlebotomist.email}</TableCell>
                                                    <TableCell>{phlebotomist.phone || "N/A"}</TableCell>
                                                    <TableCell>{phlebotomist.qualification || "N/A"}</TableCell>
                                                    <TableCell>{getStatusBadge(phlebotomist)}</TableCell>
                                                    <TableCell>
                                                        {new Date(phlebotomist.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {phlebotomist.trafficLicense && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleViewLicense(phlebotomist)}
                                                                >
                                                                    <FileText className="w-4 h-4 mr-1" />
                                                                    License
                                                                </Button>
                                                            )}
                                                            {!phlebotomist.isVerified && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="default"
                                                                        onClick={() => setApproveDialog({ open: true, phlebotomist })}
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => setRejectDialog({ open: true, phlebotomist })}
                                                                    >
                                                                        <XCircle className="w-4 h-4 mr-1" />
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {phlebotomist.isVerified && (
                                                                <>
                                                                    {phlebotomist.isActive ? (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleDeactivate(phlebotomist)}
                                                                        >
                                                                            <XCircle className="w-4 h-4 mr-1" />
                                                                            Deactivate
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="default"
                                                                            onClick={() => handleActivate(phlebotomist)}
                                                                        >
                                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                                            Activate
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => setRemoveDialog({ open: true, phlebotomist })}
                                                                    >
                                                                        <Trash2 className="w-4 h-4 mr-1" />
                                                                        Remove
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {currentTab === "all" && (
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
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* License Viewer Dialog */}
            <Dialog open={licenseDialog.open} onOpenChange={(open) => {
                if (!open && licenseDialog.url) {
                    URL.revokeObjectURL(licenseDialog.url);
                }
                setLicenseDialog({ open, phlebotomist: null, url: null });
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Phlebotomist License - {licenseDialog.phlebotomist?.fullName}</DialogTitle>
                        <DialogDescription>
                            {licenseDialog.phlebotomist?.trafficLicense?.filename}
                        </DialogDescription>
                    </DialogHeader>
                    {licenseDialog.url && (
                        <div className="flex flex-col gap-4">
                            <iframe
                                src={licenseDialog.url}
                                className="w-full h-[600px] border rounded"
                                title="phlebotomist License"
                            />
                            <Button onClick={handleDownloadLicense} variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Download License
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ open, phlebotomist: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve phlebotomist</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve {approveDialog.phlebotomist?.fullName}?
                            <br />
                            <span className="text-sm text-muted-foreground mt-2 block">
                                This phlebotomist will be visible to patients and can start accepting bookings.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveDialog({ open: false, phlebotomist: null })}>
                            Cancel
                        </Button>
                        <Button onClick={handleApprove}>Approve</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialog.open} onOpenChange={(open) => {
                setRejectDialog({ open, phlebotomist: null });
                if (!open) setRejectReason("");
            }}>                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject phlebotomist</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting {rejectDialog.phlebotomist?.fullName}
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Enter rejection reason (e.g., Invalid license, Incomplete information)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog({ open: false, phlebotomist: null })}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject}>
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Dialog */}
            <Dialog open={removeDialog.open} onOpenChange={(open) => setRemoveDialog({ open, phlebotomist: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove phlebotomist</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove {removeDialog.phlebotomist?.fullName}?
                            <br />
                            <span className="text-sm text-destructive mt-2 block">
                                This action cannot be undone. The phlebotomist will be permanently deleted.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRemoveDialog({ open: false, phlebotomist: null })}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRemove}>
                            Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default PhlebotomistManagement;







