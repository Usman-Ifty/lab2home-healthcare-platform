import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TestTube, Save, CheckCircle2, AlertCircle, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getToken } from '@/utils/storage';

interface Test {
    _id: string;
    name: string;
    description: string;
    category: string;
    basePrice: number;
    preparationInstructions?: string;
    reportDeliveryTime: string;
    sampleType?: string;
    isActive: boolean;
}

const LabTestSelection = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tests, setTests] = useState<Test[]>([]);
    const [selectedTests, setSelectedTests] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all available tests
    useEffect(() => {
        const fetchTests = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/tests');
                const data = await response.json();

                if (data.success) {
                    setTests(data.data);

                    // Extract unique categories
                    const uniqueCategories = [...new Set(data.data.map((t: Test) => t.category))] as string[];
                    setCategories(uniqueCategories);
                }
            } catch (error) {
                console.error('Error fetching tests:', error);
                toast.error('Failed to load tests');
            } finally {
                setLoading(false);
            }
        };

        fetchTests();
    }, []);

    // Fetch lab's current selected tests
    useEffect(() => {
        const fetchLabTests = async () => {
            if (!user?.id) return;

            try {
                const response = await fetch(`http://localhost:5000/api/labs/${user.id}/tests`);
                const data = await response.json();

                if (data.success && data.data.availableTests) {
                    const testIds = data.data.availableTests.map((t: any) => t._id as string);
                    setSelectedTests(testIds);
                }
            } catch (error) {
                console.error('Error fetching lab tests:', error);
            }
        };

        fetchLabTests();
    }, [user?.id]);

    const handleToggleTest = (testId: string) => {
        setSelectedTests(prev =>
            prev.includes(testId)
                ? prev.filter(id => id !== testId)
                : [...prev, testId]
        );
    };

    const handleSelectAll = (category: string) => {
        const categoryTests = tests.filter(t => t.category === category);
        const categoryTestIds = categoryTests.map(t => t._id);
        const allSelected = categoryTestIds.every(id => selectedTests.includes(id));

        if (allSelected) {
            setSelectedTests(prev => prev.filter(id => !categoryTestIds.includes(id)));
        } else {
            setSelectedTests(prev => [...new Set([...prev, ...categoryTestIds])]);
        }
    };

    const handleSave = async () => {
        if (selectedTests.length === 0) {
            toast.error('Please select at least one test');
            return;
        }

        setSaving(true);
        try {
            const token = getToken();
            const response = await fetch(`http://localhost:5000/api/labs/${user?.id}/tests`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ testIds: selectedTests }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Tests updated successfully!');
                setTimeout(() => navigate('/lab'), 1500);
            } else {
                toast.error(data.message || 'Failed to update tests');
            }
        } catch (error) {
            console.error('Error saving tests:', error);
            toast.error('Failed to save tests');
        } finally {
            setSaving(false);
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
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">
                            Configure Available Tests
                        </h1>
                        <p className="text-muted-foreground">
                            Select the diagnostic tests your lab offers to patients
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Selected Tests</p>
                            <p className="text-2xl font-bold text-primary">{selectedTests.length}</p>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={saving || selectedTests.length === 0}
                            size="lg"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Configuration
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {selectedTests.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                >
                    <Card className="border-warning bg-warning/10 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-warning">No Tests Selected</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Your lab will not appear in patient searches until you select at least one test.
                                </p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Search Bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6"
            >
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search tests by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl border-border bg-muted/50"
                    />
                </div>
            </motion.div>

            <div className="space-y-6">
                {categories.map((category, index) => {
                    const categoryTests = tests.filter(t => {
                        const matchesCategory = t.category === category;
                        const matchesSearch = !searchQuery ||
                            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.description.toLowerCase().includes(searchQuery.toLowerCase());
                        return matchesCategory && matchesSearch;
                    });

                    // Skip category if no tests match search
                    if (categoryTests.length === 0) return null;

                    const selectedCount = categoryTests.filter(t => selectedTests.includes(t._id)).length;
                    const allSelected = categoryTests.every(t => selectedTests.includes(t._id));

                    return (
                        <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="p-6 shadow-soft">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <TestTube className="h-5 w-5 text-primary" />
                                        <h2 className="text-xl font-semibold text-foreground">{category}</h2>
                                        <Badge variant="secondary">
                                            {selectedCount}/{categoryTests.length} selected
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSelectAll(category)}
                                    >
                                        {allSelected ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    {categoryTests.map((test) => {
                                        const isSelected = selectedTests.includes(test._id);

                                        return (
                                            <motion.div
                                                key={test._id}
                                                whileHover={{ scale: 1.02 }}
                                                className={`
                          flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                          ${isSelected
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border hover:border-primary/40 bg-background'
                                                    }
                        `}
                                                onClick={() => handleToggleTest(test._id)}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleToggleTest(test._id)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className="font-semibold text-foreground">{test.name}</h3>
                                                        {isSelected && (
                                                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {test.description}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                        <span className="font-medium text-primary">Rs. {test.basePrice}</span>
                                                        <span>•</span>
                                                        <span>{test.reportDeliveryTime}</span>
                                                        {test.sampleType && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{test.sampleType}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {selectedTests.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 flex justify-center"
                >
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="lg"
                        className="min-w-[200px]"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Configuration
                            </>
                        )}
                    </Button>
                </motion.div>
            )}
        </DashboardLayout>
    );
};

export default LabTestSelection;
