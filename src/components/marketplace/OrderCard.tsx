import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, MapPin, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrderCardProps {
    order: {
        _id: string;
        orderNumber: string;
        items: Array<{
            productName: string;
            quantity: number;
            price: number;
        }>;
        total: number;
        status: 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
        shippingAddress: {
            fullName: string;
            city: string;
            state: string;
        };
        paymentMethod: string;
        createdAt: string;
    };
    onCancel?: (orderId: string) => void;
}

const OrderCard = ({ order, onCancel }: OrderCardProps) => {
    const navigate = useNavigate();

    const statusColors = {
        pending: 'bg-yellow-500',
        confirmed: 'bg-blue-500',
        dispatched: 'bg-purple-500',
        delivered: 'bg-green-500',
        cancelled: 'bg-red-500',
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                        </p>
                    </div>
                    <Badge className={statusColors[order.status]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Order Items Summary */}
                <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2">
                            {order.items.map((item) => `${item.productName} (${item.quantity})`).join(', ')}
                        </p>
                    </div>
                </div>

                {/* Shipping Address */}
                <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">{order.shippingAddress.fullName}</p>
                        <p className="text-xs text-gray-600">
                            {order.shippingAddress.city}, {order.shippingAddress.state}
                        </p>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="flex items-start gap-2">
                    <CreditCard className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">
                            {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}
                        </p>
                    </div>
                </div>

                {/* Total */}
                <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Amount:</span>
                        <span className="text-xl font-bold text-primary">Rs. {order.total.toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex gap-2">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/patient/orders/${order._id}`)}
                >
                    View Details
                </Button>
                {order.status === 'pending' && onCancel && (
                    <Button
                        variant="destructive"
                        onClick={() => onCancel(order._id)}
                    >
                        Cancel Order
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default OrderCard;
