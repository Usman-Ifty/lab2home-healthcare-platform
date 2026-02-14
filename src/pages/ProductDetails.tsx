
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ShoppingCart, Heart, Loader2, Package, Star, Minus, Plus, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import * as marketplaceService from '@/services/marketplace.service';

const ProductDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState<string>('');

    const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        if (id) {
            fetchProduct();
            if (token) {
                checkWishlist();
            }
        }
    }, [id, token]);

    useEffect(() => {
        if (product && product.images && product.images.length > 0) {
            setSelectedImage(product.images[0]);
        }
    }, [product]);

    const fetchProduct = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const response = await marketplaceService.getProductById(id);
            setProduct(response.data);
        } catch (error: any) {
            console.error('Error fetching product:', error);
            toast.error('Failed to load product');
            navigate('/patient/marketplace');
        } finally {
            setLoading(false);
        }
    };

    const checkWishlist = async () => {
        if (!token || !id) return;
        try {
            const response = await marketplaceService.getWishlist(token);
            const wishlistIds = response.data.products.map((p: any) => p._id);
            setIsInWishlist(wishlistIds.includes(id));
        } catch (error) {
            console.error('Error checking wishlist:', error);
        }
    };

    const handleAddToCart = async () => {
        if (!token) {
            toast.error('Please login to add items to cart');
            navigate('/login');
            return;
        }

        try {
            await marketplaceService.addToCart(token, id!, quantity);
            toast.success('Product added to cart!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add to cart');
        }
    };

    const handleToggleWishlist = async () => {
        if (!token) {
            toast.error('Please login to add items to wishlist');
            navigate('/login');
            return;
        }

        try {
            if (isInWishlist) {
                await marketplaceService.removeFromWishlist(token, id!);
                setIsInWishlist(false);
                toast.success('Removed from wishlist');
            } else {
                await marketplaceService.addToWishlist(token, id!);
                setIsInWishlist(true);
                toast.success('Added to wishlist!');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update wishlist');
        }
    };

    const getImageSrc = (img: string) => {
        if (!img) return '/placeholder-product.svg';
        if (img.startsWith('data:') || img.startsWith('http')) return img;
        return `${API_URL}${img}`;
    };

    if (loading) {
        return (
            <DashboardLayout role="patient">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!product) {
        return (
            <DashboardLayout role="patient">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <Package className="h-16 w-16 text-gray-300 mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-900">Product not found</h2>
                    <p className="text-gray-500 mt-2 mb-6">The product you are looking for does not exist or has been removed.</p>
                    <Button onClick={() => navigate('/patient/marketplace')} variant="outline">
                        Back to Marketplace
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="patient">
            {/* Background Decor */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumbs */}
                <div className="mb-8">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/patient/marketplace">Marketplace</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink className="cursor-default">{product.category}</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{product.name}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                    {/* Left Column: Image Gallery */}
                    <div className="space-y-6">
                        <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative group">
                            <img
                                src={getImageSrc(selectedImage || product.images[0])}
                                alt={product.name}
                                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                                }}
                            />
                            {product.isFeatured && (
                                <Badge className="absolute top-4 left-4 bg-primary text-white text-sm px-3 py-1 shadow-md z-10">
                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                    Featured Pick
                                </Badge>
                            )}
                        </div>

                        {product.images.length > 1 && (
                            <div className="grid grid-cols-5 gap-4">
                                {product.images.map((img: string, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`aspect-square bg-white rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${selectedImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-200'}`}
                                        onClick={() => setSelectedImage(img)}
                                    >
                                        <img
                                            src={getImageSrc(img)}
                                            alt={`${product.name} ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Product Info */}
                    <div className="flex flex-col">
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="secondary" className="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">
                                    {product.category}
                                </Badge>
                                {product.stock > 0 ? (
                                    <span className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-600 mr-2" />
                                        In Stock
                                    </span>
                                ) : (
                                    <span className="flex items-center text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 mr-2" />
                                        Out of Stock
                                    </span>
                                )}
                            </div>

                            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">{product.name}</h1>
                            <div className="flex items-baseline gap-4 mt-4">
                                <span className="text-3xl font-bold text-primary">Rs. {product.price.toFixed(2)}</span>
                                {product.compareAtPrice && (
                                    <span className="text-lg text-gray-400 line-through">Rs. {product.compareAtPrice}</span>
                                )}
                            </div>
                        </div>

                        <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed text-lg mb-8">
                            {product.description}
                        </div>

                        <Card className="border-gray-100 shadow-sm mb-8 bg-gray-50/50">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-500 mb-1">Availability</span>
                                        <span className="font-semibold text-gray-900">
                                            {product.stock > 0 ? `${product.stock} items left` : 'Out of Stock'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-500 mb-1">Delivery</span>
                                        <span className="font-semibold text-gray-900">2-4 Business Days</span>
                                    </div>
                                    {product.sampleType && (
                                        <div className="flex flex-col col-span-2">
                                            <span className="text-sm font-medium text-gray-500 mb-1">Sample Required</span>
                                            <span className="font-semibold text-gray-900">{product.sampleType}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Specs */}
                        {product.specifications && Object.keys(product.specifications).length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Specifications</h3>
                                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                                    {Object.entries(product.specifications).map(([key, value]) => (
                                        <div key={key} className="flex justify-between p-4 hover:bg-gray-50 transition-colors">
                                            <span className="text-gray-600 font-medium">{key}</span>
                                            <span className="text-gray-900">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-auto pt-6 border-t border-gray-100">
                            <div className="flex items-center gap-6 mb-6">
                                <div className="flex items-center border border-gray-200 rounded-full p-1 bg-white shadow-sm">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full h-10 w-10 hover:bg-gray-100"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1 || product.stock === 0}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full h-10 w-10 hover:bg-gray-100"
                                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                        disabled={quantity >= product.stock || product.stock === 0}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Total: <span className="font-bold text-gray-900">Rs. {(product.price * quantity).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    className="flex-1 h-14 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                                    size="lg"
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                >
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className={`h-14 w-14 rounded-full border-2 ${isInWishlist ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-300' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                    onClick={handleToggleWishlist}
                                >
                                    <Heart className={`h-6 w-6 ${isInWishlist ? 'fill-current' : ''}`} />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-14 w-14 rounded-full border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600"
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast.success("Link copied to clipboard!");
                                    }}
                                >
                                    <Share2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ProductDetails;
