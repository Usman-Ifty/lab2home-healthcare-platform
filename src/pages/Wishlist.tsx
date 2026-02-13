import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Loader2, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as marketplaceService from '@/services/marketplace.service';

const Wishlist = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            const response = await marketplaceService.getWishlist(token);
            setWishlist(response.data);
        } catch (error: any) {
            console.error('Error fetching wishlist:', error);
            toast.error('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromWishlist = async (productId: string) => {
        if (!token) return;

        try {
            await marketplaceService.removeFromWishlist(token, productId);
            await fetchWishlist();
            toast.success('Removed from wishlist');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to remove from wishlist');
        }
    };

    const handleMoveToCart = async (productId: string) => {
        if (!token) return;

        try {
            await marketplaceService.moveWishlistToCart(token, productId);
            await fetchWishlist();
            toast.success('Moved to cart!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to move to cart');
        }
    };

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                    <p className="text-gray-600 mt-1">
                        {wishlist?.products?.length || 0} {wishlist?.products?.length === 1 ? 'item' : 'items'} saved
                    </p>
                </div>

                {!wishlist || wishlist.products.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-20">
                            <Heart className="h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Your wishlist is empty</h3>
                            <p className="text-gray-500 mb-6">Save products you love for later!</p>
                            <Button onClick={() => navigate('/patient/marketplace')}>
                                Browse Marketplace
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {wishlist.products.map((product: any) => {
                            const productImg = product.images[0];
                            const imageUrl = productImg
                                ? (productImg.startsWith('data:') || productImg.startsWith('http') ? productImg : `${API_URL}${productImg}`)
                                : '/placeholder-product.svg';

                            return (
                                <Card key={product._id} className="group hover:shadow-lg transition-shadow">
                                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                                        <img
                                            src={imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                            onClick={() => navigate(`/patient/marketplace/product/${product._id}`)}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                                            }}
                                        />
                                        {product.stock === 0 && (
                                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                <span className="text-white font-semibold">Out of Stock</span>
                                            </div>
                                        )}
                                    </div>

                                    <CardContent className="p-4 space-y-3">
                                        <div
                                            className="cursor-pointer"
                                            onClick={() => navigate(`/patient/marketplace/product/${product._id}`)}
                                        >
                                            <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                                            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                                            <p className="text-xl font-bold text-primary mt-2">Rs. {product.price.toFixed(2)}</p>
                                            <p className="text-xs text-gray-500">{product.stock} in stock</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                className="flex-1"
                                                onClick={() => handleMoveToCart(product._id)}
                                                disabled={product.stock === 0}
                                            >
                                                <ShoppingCart className="mr-2 h-4 w-4" />
                                                Add to Cart
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleRemoveFromWishlist(product._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Wishlist;
