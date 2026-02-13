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
import {
    Building2,
    Search,
    CheckCircle,
    XCircle,
    FileText,
    Edit,
    Trash2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Eye,
    Download,
} from "lucide-react";

interface Lab {
    _id: string;
    labName: string;
    email: string;
    phone?: string;
    labAddress?: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    license?: {
        filename: string;
        contentType: string;
    };
}

const LabManagement = () => {
    const { toast } = useToast();
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState("pending");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Dialog states
    const [approveDialog, setApproveDialog] = useState<{ open: boolean; lab: Lab | null }>({
        open: false,
        lab: null,
    });
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; lab: Lab | null }>({
        open: false,
        lab: null,
    });
    const [rejectReason, setRejectReason] = useState("");
    const [removeDialog, setRemoveDialog] = useState<{ open: boolean; lab: Lab | null }>({
        open: false,
        lab: null,
    });
    const [licenseDialog, setLicenseDialog] = useState<{ open: boolean; lab: Lab | null; url: string | null }>({
        open: false,
        lab: null,
        url: null,
    });

    useEffect(() => {
        fetchLabs();
    }, [currentTab, statusFilter, searchQuery, page]);

    const fetchLabs = async () => {
        try {
            setLoading(true);

            if (currentTab === "pending") {
                const response = await adminAPI.getPendingLabs();
                if (response.success) {
                    setLabs(response.data);
                    setTotalPages(1);
                }
            } else {
                const response = await adminAPI.getAllLabs({
                    status: statusFilter === "all" ? undefined : statusFilter,
                    search: searchQuery || undefined,
                    page,
                    limit: 20,
                });
                if (response.success) {
                    setLabs(response.data);
                    setTotalPages((response as any).pagination?.pages || 1);
                }
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to fetch labs",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleViewLicense = async (lab: Lab) => {
        try {
            const blob = await adminAPI.getLabLicense(lab._id);
            const url = URL.createObjectURL(blob);
            setLicenseDialog({ open: true, lab, url });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load license",
                variant: "destructive",
            });
        }
    };

    const handleDownloadLicense = () => {
        if (licenseDialog.url && licenseDialog.lab) {
            const a = document.createElement('a');
            a.href = licenseDialog.url;
            a.download = licenseDialog.lab.license?.filename || 'license.pdf';
            a.click();
        }
    };

    const handleApprove = async () => {
        if (!approveDialog.lab) return;

        try {
            const response = await adminAPI.approveLab(approveDialog.lab._id);
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Lab approved successfully",
                });
                fetchLabs();
                setApproveDialog({ open: false, lab: null });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to approve lab",
                variant: "destructive",
            });
        }
    };

    const handleReject = async () => {
        if (!rejectDialog.lab || !rejectReason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a reason for rejection",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await adminAPI.rejectLab(rejectDialog.lab._id, rejectReason);
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Lab rejected successfully",
                });
                fetchLabs();
                setRejectDialog({ open: false, lab: null });
                setRejectReason("");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to reject lab",
                variant: "destructive",
            });
        }
    };

    const handleRemove = async () => {
        if (!removeDialog.lab) return;

        try {
            const response = await adminAPI.removeLab(removeDialog.lab._id);
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Lab removed successfully",
                });
                fetchLabs();
                setRemoveDialog({ open: false, lab: null });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to remove lab",
                variant: "destructive",
            });
        }
    };

    const handleActivate = async (lab: Lab) => {
        try {
            const response = await adminAPI.activateLab(lab._id);
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Lab activated successfully. It is now visible to patients.",
                });
                fetchLabs();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to activate lab",
                variant: "destructive",
            });
        }
    };

    const handleDeactivate = async (lab: Lab) => {
        try {
            const response = await adminAPI.deactivateLab(lab._id);
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Lab deactivated successfully. It will no longer be visible to patients.",
                });
                fetchLabs();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to deactivate lab",
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (lab: Lab) => {
        if (!lab.isActive) {
            return <Badge variant="destructive">Inactive</Badge>;
        }
        if (!lab.isVerified) {
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
                            <Building2 className="w-8 h-8 text-primary" />
                            Lab Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Review registrations, verify documents, and manage labs
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Laboratory Management</CardTitle>
                        <CardDescription>Approve pending labs and manage existing ones</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Tabs */}
                        <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="pending">Pending Labs</TabsTrigger>
                                <TabsTrigger value="all">All Labs</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Filters */}
                        {currentTab === "all" && (
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Search by lab name or email..."
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
                                <p className="text-muted-foreground">Loading labs...</p>
                            </div>
                        ) : labs.length === 0 ? (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>No labs found</AlertDescription>
                            </Alert>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Lab Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Address</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Registered</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {labs.map((lab) => (
                                                <TableRow key={lab._id}>
                                                    <TableCell className="font-medium">{lab.labName}</TableCell>
                                                    <TableCell>{lab.email}</TableCell>
                                                    <TableCell>{lab.phone || "N/A"}</TableCell>
                                                    <TableCell>{lab.labAddress || "N/A"}</TableCell>
                                                    <TableCell>{getStatusBadge(lab)}</TableCell>
                                                    <TableCell>
                                                        {new Date(lab.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {lab.license && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleViewLicense(lab)}
                                                                >
                                                                    <FileText className="w-4 h-4 mr-1" />
                                                                    License
                                                                </Button>
                                                            )}
                                                            {!lab.isVerified && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="default"
                                                                        onClick={() => setApproveDialog({ open: true, lab })}
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => setRejectDialog({ open: true, lab })}
                                                                    >
                                                                        <XCircle className="w-4 h-4 mr-1" />
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {lab.isVerified && (
                                                                <>
                                                                    {lab.isActive ? (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleDeactivate(lab)}
                                                                        >
                                                                            <XCircle className="w-4 h-4 mr-1" />
                                                                            Deactivate
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="default"
                                                                            onClick={() => handleActivate(lab)}
                                                                        >
                                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                                            Activate
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => setRemoveDialog({ open: true, lab })}
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
                setLicenseDialog({ open, lab: null, url: null });
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Lab License - {licenseDialog.lab?.labName}</DialogTitle>
                        <DialogDescription>
                            {licenseDialog.lab?.license?.filename}
                        </DialogDescription>
                    </DialogHeader>
                    {licenseDialog.url && (
                        <div className="flex flex-col gap-4">
                            <iframe
                                src={licenseDialog.url}
                                className="w-full h-[600px] border rounded"
                                title="Lab License"
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
            <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ open, lab: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Lab</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve {approveDialog.lab?.labName}?
                            <br />
                            <span className="text-sm text-muted-foreground mt-2 block">
                                This lab will be visible to patients and can start accepting bookings.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveDialog({ open: false, lab: null })}>
                            Cancel
                        </Button>
                        <Button onClick={handleApprove}>Approve</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialog.open} onOpenChange={(open) => {
                setRejectDialog({ open, lab: null });
                if (!open) setRejectReason("");
            }}>                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Lab</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting {rejectDialog.lab?.labName}
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Enter rejection reason (e.g., Invalid license, Incomplete information)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog({ open, lab: null })}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject}>
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Dialog */}
            <Dialog open={removeDialog.open} onOpenChange={(open) => setRemoveDialog({ open, lab: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Lab</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove {removeDialog.lab?.labName}?
                            <br />
                            <span className="text-sm text-destructive mt-2 block">
                                This action cannot be undone. The lab will be permanently deleted.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRemoveDialog({ open: false, lab: null })}>
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

export default LabManagement;
