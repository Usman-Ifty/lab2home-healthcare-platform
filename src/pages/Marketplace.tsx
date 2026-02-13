import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import ProductCard from '@/components/marketplace/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as marketplaceService from '@/services/marketplace.service';

const CATEGORIES = [
    'All Categories',
    'Diagnostic Devices',
    'Monitoring Equipment',
    'First Aid',
    'Supplements',
    'Medical Supplies',
    'Personal Care',
    'Other',
];

const Marketplace = () => {
    const { token } = useAuth();
    const [products, setProducts] = useState<any[]>([]);
    const [wishlistProducts, setWishlistProducts] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [sortBy, setSortBy] = useState('createdAt');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchProducts();
        if (token) {
            fetchWishlist();
        }
    }, [selectedCategory, sortBy, currentPage, searchQuery]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params: any = {
                page: currentPage,
                limit: 12,
                sortBy,
            };

            if (selectedCategory !== 'All Categories') {
                params.category = selectedCategory;
            }

            if (searchQuery) {
                params.search = searchQuery;
            }

            const response = await marketplaceService.getAllProducts(params);
            setProducts(response.data);
            setTotalPages(response.pagination.pages);
        } catch (error: any) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const fetchWishlist = async () => {
        if (!token) return;
        try {
            const response = await marketplaceService.getWishlist(token);
            setWishlistProducts(response.data.products.map((p: any) => p._id));
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        }
    };

    const handleAddToCart = async (productId: string) => {
        if (!token) {
            toast.error('Please login to add items to cart');
            return;
        }

        try {
            await marketplaceService.addToCart(token, productId, 1);
            toast.success('Product added to cart!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add to cart');
        }
    };

    const handleAddToWishlist = async (productId: string) => {
        if (!token) {
            toast.error('Please login to add items to wishlist');
            return;
        }

        try {
            const isInWishlist = wishlistProducts.includes(productId);
            if (isInWishlist) {
                await marketplaceService.removeFromWishlist(token, productId);
                setWishlistProducts(wishlistProducts.filter((id) => id !== productId));
                toast.success('Removed from wishlist');
            } else {
                await marketplaceService.addToWishlist(token, productId);
                setWishlistProducts([...wishlistProducts, productId]);
                toast.success('Added to wishlist!');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update wishlist');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchProducts();
    };

    return (
        <DashboardLayout role="patient">
            {/* Background Decor */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
            </div>

            <div className="relative z-10 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
                    <p className="text-gray-600 mt-1">Browse and purchase healthcare products</p>
                </div>

                {/* Filters and Search */}
                <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit">
                            <Search className="h-4 w-4 mr-2" />
                            Search
                        </Button>
                    </form>

                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="createdAt">Newest First</SelectItem>
                                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                                <SelectItem value="name">Name: A to Z</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                        <div className="max-w-md mx-auto space-y-4">
                            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                <Search className="h-10 w-10 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-gray-700 text-xl font-semibold">No products found</p>
                                <p className="text-gray-500 text-sm mt-2">
                                    Try adjusting your filters or search query to find what you're looking for
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {products.map((product) => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                    onAddToWishlist={handleAddToWishlist}
                                    isInWishlist={wishlistProducts.includes(product._id)}
                                />
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

export default Marketplace;
