import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
    product: {
        _id: string;
        name: string;
        description: string;
        category: string;
        price: number;
        stock: number;
        images: string[];
        isFeatured?: boolean;
    };
    onAddToCart?: (productId: string) => void;
    onAddToWishlist?: (productId: string) => void;
    isInWishlist?: boolean;
}

const ProductCard = ({ product, onAddToCart, onAddToWishlist, isInWishlist = false }: ProductCardProps) => {
    const navigate = useNavigate();
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const getImageUrl = (img: string | undefined) => {
        if (!img) return '/placeholder-product.svg';
        if (img.startsWith('data:') || img.startsWith('http')) return img;
        return `${API_URL}${img}`;
    };

    const firstImage = getImageUrl(product.images[0]);
    const secondImage = product.images.length > 1 ? getImageUrl(product.images[1]) : null;

    // Get stock status for display
    const getStockStatus = () => {
        if (product.stock === 0) {
            return {
                label: 'Out of Stock',
                badgeClass: 'bg-gray-500/90 text-white',
                available: false,
            };
        } else if (product.stock <= 5) {
            return {
                label: 'Limited Stock',
                badgeClass: 'bg-orange-500/90 text-white animate-pulse',
                available: true,
            };
        } else {
            return {
                label: 'In Stock',
                badgeClass: 'bg-green-500/90 text-white',
                available: true,
            };
        }
    };

    const stockStatus = getStockStatus();

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (product.stock === 0) return;

        setIsAddingToCart(true);
        try {
            await onAddToCart?.(product._id);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleAddToWishlist = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAddingToWishlist(true);
        try {
            await onAddToWishlist?.(product._id);
        } finally {
            setIsAddingToWishlist(false);
        }
    };

    return (
        <Card
            className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white"
            onClick={() => navigate(`/patient/marketplace/product/${product._id}`)}
        >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Primary Image */}
                <img
                    src={firstImage}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-all duration-700 ${secondImage ? 'group-hover:opacity-0 group-hover:scale-110' : 'group-hover:scale-110'
                        }`}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                    }}
                />

                {/* Secondary Image (on Hover) */}
                {secondImage && (
                    <img
                        src={secondImage}
                        alt={`${product.name} alternate`}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-110"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                )}

                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Featured Badge */}
                {product.isFeatured && (
                    <div className="absolute top-4 left-4 z-10">
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg px-3 py-1.5 flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span className="font-semibold">Featured</span>
                        </Badge>
                    </div>
                )}

                {/* Stock Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                    <Badge className={`${stockStatus.badgeClass} border-0 shadow-lg px-3 py-1.5 font-semibold`}>
                        {stockStatus.label}
                    </Badge>
                </div>

                {/* Wishlist Button */}
                <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <Button
                        size="icon"
                        variant={isInWishlist ? "default" : "secondary"}
                        className="rounded-full shadow-xl hover:scale-110 transition-transform duration-300 w-11 h-11"
                        onClick={handleAddToWishlist}
                        disabled={isAddingToWishlist}
                    >
                        <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <CardContent className="p-6 space-y-4">
                {/* Category */}
                <div>
                    <Badge
                        variant="outline"
                        className="text-xs font-semibold border-primary/40 text-primary bg-primary/5 px-3 py-1"
                    >
                        {product.category}
                    </Badge>
                </div>

                {/* Product Name */}
                <h3 className="font-bold text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300 min-h-[3.5rem]">
                    {product.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {product.description}
                </p>

                {/* Price */}
                <div className="pt-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-blue-600 bg-clip-text text-transparent">
                            Rs. {product.price.toFixed(2)}
                        </span>
                    </div>
                </div>
            </CardContent>

            {/* Footer */}
            <CardFooter className="p-6 pt-0">
                <Button
                    className="w-full h-12 font-semibold text-base shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || isAddingToCart}
                >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {product.stock === 0 ? 'Out of Stock' : isAddingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default ProductCard;
