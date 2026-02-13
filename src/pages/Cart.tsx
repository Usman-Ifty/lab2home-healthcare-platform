import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import CartItem from '@/components/marketplace/CartItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import * as marketplaceService from '@/services/marketplace.service';

const Cart = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [cart, setCart] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

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
            setCart(response.data.cart);
        } catch (error: any) {
            console.error('Error fetching cart:', error);
            toast.error('Failed to load cart');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuantity = async (productId: string, quantity: number) => {
        if (!token) return;

        try {
            setUpdating(true);
            await marketplaceService.updateCartItem(token, productId, quantity);
            await fetchCart();
            toast.success('Cart updated');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update cart');
        } finally {
            setUpdating(false);
        }
    };

    const handleRemoveItem = async (productId: string) => {
        if (!token) return;

        try {
            setUpdating(true);
            await marketplaceService.removeFromCart(token, productId);
            await fetchCart();
            toast.success('Item removed from cart');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to remove item');
        } finally {
            setUpdating(false);
        }
    };

    const handleClearCart = async () => {
        if (!token) return;

        try {
            setUpdating(true);
            await marketplaceService.clearCart(token);
            await fetchCart();
            toast.success('Cart cleared');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to clear cart');
        } finally {
            setUpdating(false);
        }
    };

    const calculateTotals = () => {
        if (!cart || !cart.items) return { subtotal: 0, tax: 0, shipping: 0, total: 0 };

        const subtotal = cart.items.reduce(
            (sum: number, item: any) => sum + item.priceSnapshot * item.quantity,
            0
        );
        const tax = subtotal * 0.05; // 5% tax
        const shipping = subtotal > 2000 ? 0 : 150; // Free shipping over Rs. 2000
        const total = subtotal + tax + shipping;

        return { subtotal, tax, shipping, total };
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
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                        <p className="text-gray-600 mt-1">
                            {cart?.items?.length || 0} {cart?.items?.length === 1 ? 'item' : 'items'} in your cart
                        </p>
                    </div>
                    {cart?.items?.length > 0 && (
                        <Button variant="outline" onClick={handleClearCart} disabled={updating}>
                            Clear Cart
                        </Button>
                    )}
                </div>

                {!cart || cart.items.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-20">
                            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h3>
                            <p className="text-gray-500 mb-6">Add some products to get started!</p>
                            <Button onClick={() => navigate('/patient/marketplace')}>
                                Browse Marketplace
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cart.items.map((item: any) => (
                                <CartItem
                                    key={item.product._id}
                                    item={item}
                                    onUpdateQuantity={handleUpdateQuantity}
                                    onRemove={handleRemoveItem}
                                />
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4">
                                <CardContent className="p-6 space-y-4">
                                    <h2 className="text-xl font-bold">Order Summary</h2>

                                    <Separator />

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Tax (5%)</span>
                                            <span className="font-medium">Rs. {tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Shipping</span>
                                            <span className="font-medium">
                                                {shipping === 0 ? 'FREE' : `Rs. ${shipping.toFixed(2)}`}
                                            </span>
                                        </div>
                                        {subtotal > 0 && subtotal < 2000 && (
                                            <p className="text-xs text-gray-500">
                                                Add Rs. {(2000 - subtotal).toFixed(2)} more for free shipping
                                            </p>
                                        )}
                                    </div>

                                    <Separator />

                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold">Total</span>
                                        <span className="text-2xl font-bold text-primary">Rs. {total.toFixed(2)}</span>
                                    </div>

                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={() => navigate('/patient/checkout')}
                                        disabled={updating}
                                    >
                                        Proceed to Checkout
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => navigate('/patient/marketplace')}
                                    >
                                        Continue Shopping
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Cart;
