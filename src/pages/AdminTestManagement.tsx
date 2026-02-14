
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2, Search, TestTube } from 'lucide-react';
import { toast } from 'sonner';

const AdminTestManagement = () => {
    const { token } = useAuth();
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTestId, setCurrentTestId] = useState<string | null>(null);

    const [testForm, setTestForm] = useState({
        name: '',
        description: '',
        category: 'Blood Test',
        basePrice: '',
        preparationInstructions: '',
        reportDeliveryTime: '24 hours',
        sampleType: '',
        isActive: true
    });

    const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/tests?includeInactive=true`);
            const data = await response.json();
            if (data.success) {
                setTests(data.data);
            }
        } catch (error) {
            console.error('Error fetching tests:', error);
            toast.error('Failed to load tests');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/tests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...testForm,
                    basePrice: parseFloat(testForm.basePrice),
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Test created successfully');
                setIsDialogOpen(false);
                resetForm();
                fetchTests();
            } else {
                toast.error(data.message || 'Failed to create test');
            }
        } catch (error) {
            console.error('Error creating test:', error);
            toast.error('Failed to create test');
        }
    };

    const handleUpdateTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !currentTestId) return;

        try {
            const response = await fetch(`${API_URL}/api/tests/${currentTestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...testForm,
                    basePrice: parseFloat(testForm.basePrice),
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Test updated successfully');
                setIsDialogOpen(false);
                resetForm();
                fetchTests();
            } else {
                toast.error(data.message || 'Failed to update test');
            }
        } catch (error) {
            console.error('Error updating test:', error);
            toast.error('Failed to update test');
        }
    };

    const handleEditClick = (test: any) => {
        setTestForm({
            name: test.name,
            description: test.description,
            category: test.category,
            basePrice: test.basePrice.toString(),
            preparationInstructions: test.preparationInstructions || '',
            reportDeliveryTime: test.reportDeliveryTime,
            sampleType: test.sampleType || '',
            isActive: test.isActive
        });
        setCurrentTestId(test._id);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleDeleteTest = async (testId: string) => {
        if (!token || !confirm('Are you sure you want to deactivate this test?')) return;

        try {
            const response = await fetch(`${API_URL}/api/tests/${testId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Test deactivated successfully');
                fetchTests();
            } else {
                toast.error(data.message || 'Failed to deactivate test');
            }
        } catch (error) {
            console.error('Error deleting test:', error);
            toast.error('Failed to deactivate test');
        }
    };

    const handleToggleStatus = async (testId: string, currentStatus: boolean) => {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/tests/${testId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Test ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
                fetchTests();
            } else {
                toast.error(data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const resetForm = () => {
        setTestForm({
            name: '',
            description: '',
            category: 'Blood Test',
            basePrice: '',
            preparationInstructions: '',
            reportDeliveryTime: '24 hours',
            sampleType: '',
            isActive: true
        });
        setIsEditing(false);
        setCurrentTestId(null);
    };

    const filteredTests = tests.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Diagnostic Tests</h1>
                        <p className="text-gray-600 mt-1">Manage available laboratory tests</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Test
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{isEditing ? 'Edit Test' : 'Add New Test'}</DialogTitle>
                                <DialogDescription>
                                    {isEditing ? 'Update the test details below' : 'Create a new diagnostic test available for labs'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={isEditing ? handleUpdateTest : handleCreateTest} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Test Name *</Label>
                                        <Input
                                            id="name"
                                            value={testForm.name}
                                            onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category *</Label>
                                        <Select
                                            value={testForm.category}
                                            onValueChange={(value) => setTestForm({ ...testForm, category: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Blood Test">Blood Test</SelectItem>
                                                <SelectItem value="Urine Test">Urine Test</SelectItem>
                                                <SelectItem value="Imaging">Imaging</SelectItem>
                                                <SelectItem value="Radiology">Radiology</SelectItem>
                                                <SelectItem value="Pathology">Pathology</SelectItem>
                                                <SelectItem value="Cardiology">Cardiology</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        value={testForm.description}
                                        onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                                        required
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="basePrice">Base Price (Rs.) *</Label>
                                        <Input
                                            id="basePrice"
                                            type="number"
                                            min="0"
                                            value={testForm.basePrice}
                                            onChange={(e) => setTestForm({ ...testForm, basePrice: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reportDeliveryTime">Report Delivery Time *</Label>
                                        <Input
                                            id="reportDeliveryTime"
                                            value={testForm.reportDeliveryTime}
                                            onChange={(e) => setTestForm({ ...testForm, reportDeliveryTime: e.target.value })}
                                            required
                                            placeholder="e.g. 24 hours"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sampleType">Sample Type</Label>
                                        <Input
                                            id="sampleType"
                                            value={testForm.sampleType}
                                            onChange={(e) => setTestForm({ ...testForm, sampleType: e.target.value })}
                                            placeholder="e.g. Blood, Urine"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="preparationInstructions">Preparation Instructions</Label>
                                        <Input
                                            id="preparationInstructions"
                                            value={testForm.preparationInstructions}
                                            onChange={(e) => setTestForm({ ...testForm, preparationInstructions: e.target.value })}
                                            placeholder="e.g. Fasting required"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {isEditing ? 'Update Test' : 'Create Test'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                        placeholder="Search tests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Test Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Delivery Range</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                                                No tests found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTests.map((test) => (
                                            <TableRow key={test._id}>
                                                <TableCell className="font-medium">
                                                    <div>
                                                        {test.name}
                                                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{test.description}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{test.category}</Badge>
                                                </TableCell>
                                                <TableCell>Rs. {test.basePrice}</TableCell>
                                                <TableCell>{test.reportDeliveryTime}</TableCell>
                                                <TableCell>
                                                    <Badge variant={test.isActive ? 'default' : 'secondary'}>
                                                        {test.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEditClick(test)}
                                                            title="Edit Test"
                                                        >
                                                            <Edit className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleToggleStatus(test._id, test.isActive)}
                                                            title={test.isActive ? "Deactivate" : "Activate"}
                                                        >
                                                            {test.isActive ? (
                                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                            ) : (
                                                                <TestTube className="h-4 w-4 text-green-600" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminTestManagement;
