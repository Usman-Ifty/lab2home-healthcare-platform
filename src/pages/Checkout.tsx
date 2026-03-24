import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Banknote, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import * as marketplaceService from '@/services/marketplace.service';

const Checkout = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [cart, setCart] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [shippingAddress, setShippingAddress] = useState({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
    });

    const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            const response = await marketplaceService.getCart(token);
            if (!response.data.cart || response.data.cart.items.length === 0) {
                toast.error('Your cart is empty');
                navigate('/patient/cart');
                return;
            }
            setCart(response.data.cart);
        } catch (error: any) {
            console.error('Error fetching cart:', error);
            toast.error('Failed to load cart');
            navigate('/patient/cart');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = () => {
        if (!cart || !cart.items) return { subtotal: 0, tax: 0, shipping: 0, total: 0 };

        const subtotal = cart.items.reduce(
            (sum: number, item: any) => sum + item.priceSnapshot * item.quantity,
            0
        );
        const tax = 0;
        const shipping = 0;
        const total = subtotal;

        return { subtotal, tax, shipping, total };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) return;

        // Validation
        if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1 ||
            !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode) {
            toast.error('Please fill in all required shipping address fields');
            return;
        }

        try {
            setSubmitting(true);
            const response = await marketplaceService.createOrder(token, {
                shippingAddress,
                paymentMethod,
                notes,
            });

            const { order, paymentData } = response.data;

            if (paymentMethod === 'online' && paymentData) {
                toast.info('Redirecting to secure payment gateway...');

                // Create and submit a dynamic form for PayFast
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = paymentData.action_url;

                // Add all payment data fields as hidden inputs
                Object.keys(paymentData).forEach(key => {
                    if (key !== 'action_url') {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = paymentData[key];
                        form.appendChild(input);
                    }
                });

                document.body.appendChild(form);
                form.submit();
                return; // Redirection happens here
            }

            toast.success('Order placed successfully!');
            navigate('/patient/orders');
        } catch (error: any) {
            console.error('Error creating order:', error);
            toast.error(error.response?.data?.message || 'Failed to place order');
        } finally {
            setSubmitting(false);
        }
    };

    const { subtotal, tax, shipping, total } = calculateTotals();

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
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                    <p className="text-gray-600 mt-1">Complete your order</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Shipping & Payment */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Shipping Address */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Shipping Address</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="fullName">Full Name *</Label>
                                            <Input
                                                id="fullName"
                                                value={shippingAddress.fullName}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="phone">Phone Number *</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={shippingAddress.phone}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="addressLine1">Address Line 1 *</Label>
                                        <Input
                                            id="addressLine1"
                                            value={shippingAddress.addressLine1}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                                        <Input
                                            id="addressLine2"
                                            value={shippingAddress.addressLine2}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="city">City *</Label>
                                            <Input
                                                id="city"
                                                value={shippingAddress.city}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="state">State *</Label>
                                            <Input
                                                id="state"
                                                value={shippingAddress.state}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="postalCode">Postal Code *</Label>
                                            <Input
                                                id="postalCode"
                                                value={shippingAddress.postalCode}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Method */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Payment Method</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                                            <RadioGroupItem value="cash_on_delivery" id="cod" />
                                            <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer flex-1">
                                                <Banknote className="h-5 w-5" />
                                                <div>
                                                    <p className="font-medium">Cash on Delivery</p>
                                                    <p className="text-sm text-gray-500">Pay when you receive your order</p>
                                                </div>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                                            <RadioGroupItem value="online" id="online" />
                                            <Label htmlFor="online" className="flex items-center gap-2 cursor-pointer flex-1">
                                                <CreditCard className="h-5 w-5" />
                                                <div>
                                                    <p className="font-medium">Online Payment</p>
                                                    <p className="text-sm text-gray-500">Pay securely via PayFast</p>
                                                </div>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </CardContent>
                            </Card>

                            {/* Order Notes */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Notes (Optional)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder="Any special instructions for your order..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={4}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4">
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Cart Items */}
                                    <div className="space-y-3">
                                        {cart?.items.map((item: any) => (
                                            <div key={item.product._id} className="flex gap-3">
                                                <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                                                    <img
                                                        src={(() => {
                                                            const img = item.product.images[0];
                                                            if (!img) return '/placeholder-product.svg';
                                                            if (img.startsWith('data:') || img.startsWith('http')) return img;
                                                            return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${img}`;
                                                        })()}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-cover rounded"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                    <p className="text-sm font-medium text-primary">
                                                        Rs. {(item.priceSnapshot * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator />

                                    {/* Price Breakdown */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
                                        </div>

                                    </div>

                                    <Separator />

                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold">Total</span>
                                        <span className="text-2xl font-bold text-primary">Rs. {total.toFixed(2)}</span>
                                    </div>

                                    <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Placing Order...
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingBag className="mr-2 h-4 w-4" />
                                                Place Order
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => navigate('/patient/cart')}
                                    >
                                        Back to Cart
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default Checkout;
