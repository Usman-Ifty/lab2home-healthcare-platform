import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import OrderCard from '@/components/marketplace/OrderCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as marketplaceService from '@/services/marketplace.service';

const Orders = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchOrders();
    }, [statusFilter, currentPage]);

    const fetchOrders = async () => {
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            const params: any = {
                page: currentPage,
                limit: 10,
            };

            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            const response = await marketplaceService.getMyOrders(token, params);
            setOrders(response.data);
            setTotalPages(response.pagination.pages);
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!token) return;

        if (!confirm('Are you sure you want to cancel this order?')) return;

        try {
            await marketplaceService.cancelOrder(token, orderId, 'Cancelled by customer');
            toast.success('Order cancelled successfully');
            await fetchOrders();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="patient">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="patient">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                        <p className="text-gray-600 mt-1">Track and manage your orders</p>
                    </div>
                    <Button onClick={() => navigate('/patient/marketplace')}>
                        Continue Shopping
                    </Button>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">Filter by status:</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Orders" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Orders</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="dispatched">Dispatched</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Orders List */}
                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-20">
                            <Package className="h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders found</h3>
                            <p className="text-gray-500 mb-6">Start shopping to see your orders here!</p>
                            <Button onClick={() => navigate('/patient/marketplace')}>
                                Browse Marketplace
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {orders.map((order) => (
                                <OrderCard key={order._id} order={order} onCancel={handleCancelOrder} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-600">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Orders;
