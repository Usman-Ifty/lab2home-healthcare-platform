import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Package, MapPin, CreditCard, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as marketplaceService from '@/services/marketplace.service';

const OrderDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        if (!token || !id) {
            navigate('/patient/orders');
            return;
        }

        try {
            setLoading(true);
            const response = await marketplaceService.getOrderById(token, id);
            setOrder(response.data);
        } catch (error: any) {
            console.error('Error fetching order:', error);
            toast.error('Failed to load order details');
            navigate('/patient/orders');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!token || !id || !confirm('Are you sure you want to cancel this order?')) return;

        try {
            await marketplaceService.cancelOrder(token, id, 'Cancelled by customer');
            toast.success('Order cancelled successfully');
            fetchOrder();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        }
    };

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-500',
        confirmed: 'bg-blue-500',
        dispatched: 'bg-purple-500',
        delivered: 'bg-green-500',
        cancelled: 'bg-red-500',
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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

    if (!order) {
        return (
            <DashboardLayout role="patient">
                <div className="text-center py-20">
                    <p className="text-gray-500">Order not found</p>
                    <Button onClick={() => navigate('/patient/orders')} className="mt-4">
                        Back to Orders
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="patient">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate('/patient/orders')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Button>
                    </div>
                    {order.status === 'pending' && (
                        <Button variant="destructive" onClick={handleCancelOrder}>
                            Cancel Order
                        </Button>
                    )}
                </div>

                {/* Order Header */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl">{order.orderNumber}</CardTitle>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Placed on {formatDate(order.createdAt)}
                                </p>
                            </div>
                            <Badge className={statusColors[order.status]}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Order Items
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {order.items.map((item: any, index: number) => {
                                    const itemImg = item.product?.images?.[0];
                                    const imageUrl = itemImg
                                        ? (itemImg.startsWith('data:') || itemImg.startsWith('http') ? itemImg : `${API_URL}${itemImg}`)
                                        : '/placeholder-product.svg';

                                    return (
                                        <div key={index}>
                                            <div className="flex gap-4">
                                                <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0">
                                                    <img
                                                        src={imageUrl}
                                                        alt={item.productName}
                                                        className="w-full h-full object-cover rounded"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold">{item.productName}</h4>
                                                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Price: Rs. {item.price.toFixed(2)} each
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-primary">
                                                        Rs. {(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            {index < order.items.length - 1 && <Separator className="mt-4" />}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* Shipping Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Shipping Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    <p className="font-semibold">{order.shippingAddress.fullName}</p>
                                    <p className="text-sm text-gray-600">{order.shippingAddress.phone}</p>
                                    <p className="text-sm text-gray-600">{order.shippingAddress.addressLine1}</p>
                                    {order.shippingAddress.addressLine2 && (
                                        <p className="text-sm text-gray-600">{order.shippingAddress.addressLine2}</p>
                                    )}
                                    <p className="text-sm text-gray-600">
                                        {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                                        {order.shippingAddress.postalCode}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Payment Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Payment Method:</span>
                                        <span className="font-medium">
                                            {order.paymentMethod === 'cash_on_delivery'
                                                ? 'Cash on Delivery'
                                                : 'Online Payment'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Payment Status:</span>
                                        <Badge
                                            variant={
                                                order.paymentStatus === 'completed'
                                                    ? 'default'
                                                    : order.paymentStatus === 'pending'
                                                        ? 'secondary'
                                                        : 'destructive'
                                            }
                                        >
                                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                        </Badge>
                                    </div>
                                    {order.transactionId && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Transaction ID:</span>
                                            <span className="font-mono text-sm">{order.transactionId}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Courier Tracking Information */}
                        {(order.status === 'dispatched' || order.status === 'delivered') && order.courierService && (
                            <Card className="border-purple-200 bg-purple-50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-purple-700">
                                        <Package className="h-5 w-5" />
                                        Courier Tracking
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Courier Service:</span>
                                            <span className="font-semibold text-purple-700">
                                                {order.courierService}
                                            </span>
                                        </div>
                                        {order.trackingNumber && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Tracking Number:</span>
                                                <span className="font-mono text-sm font-semibold text-purple-700">
                                                    {order.trackingNumber}
                                                </span>
                                            </div>
                                        )}
                                        {order.courierBookingDate && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Dispatched On:</span>
                                                <span className="text-sm">
                                                    {formatDate(order.courierBookingDate)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="mt-4 p-3 bg-white rounded border border-purple-200">
                                            <p className="text-xs text-gray-600">
                                                📦 Track your parcel using the tracking number above on the {order.courierService} website or app.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Order Notes */}
                        {order.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600">{order.notes}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Cancellation Info */}
                        {order.status === 'cancelled' && order.cancelReason && (
                            <Card className="border-red-200 bg-red-50">
                                <CardHeader>
                                    <CardTitle className="text-red-700">Cancellation Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-red-600">
                                        <strong>Reason:</strong> {order.cancelReason}
                                    </p>
                                    {order.cancelledAt && (
                                        <p className="text-sm text-red-600 mt-1">
                                            <strong>Cancelled on:</strong> {formatDate(order.cancelledAt)}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">Rs. {order.subtotal.toFixed(2)}</span>
                                    </div>

                                </div>

                                <Separator />

                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold">Total</span>
                                    <span className="text-2xl font-bold text-primary">
                                        Rs. {order.total.toFixed(2)}
                                    </span>
                                </div>

                                <Separator />

                                {/* Order Timeline */}
                                <div>
                                    <h4 className="font-semibold mb-3">Order Status</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`w-3 h-3 rounded-full mt-1 ${order.status !== 'cancelled' ? 'bg-green-500' : 'bg-gray-300'
                                                    }`}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Order Placed</p>
                                                <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`w-3 h-3 rounded-full mt-1 ${['confirmed', 'dispatched', 'delivered'].includes(order.status)
                                                    ? 'bg-green-500'
                                                    : 'bg-gray-300'
                                                    }`}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Confirmed</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`w-3 h-3 rounded-full mt-1 ${['dispatched', 'delivered'].includes(order.status)
                                                    ? 'bg-green-500'
                                                    : 'bg-gray-300'
                                                    }`}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Dispatched</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`w-3 h-3 rounded-full mt-1 ${order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                                                    }`}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Delivered</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default OrderDetails;
