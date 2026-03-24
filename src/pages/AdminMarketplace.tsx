import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, Eye, Package, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import * as marketplaceService from '@/services/marketplace.service';

const AdminMarketplace = () => {
    const { token } = useAuth();
    const [products, setProducts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('products');
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isCourierDialogOpen, setIsCourierDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [courierInfo, setCourierInfo] = useState({
        courierService: 'TCS',
        trackingNumber: '',
    });

    // Product form state
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        category: 'Diagnostic Devices',
        price: '',
        stock: '',
        isFeatured: false,
    });
    const [productImages, setProductImages] = useState<FileList | null>(null);

    useEffect(() => {
        if (activeTab === 'products') {
            fetchProducts();
        } else {
            fetchOrders();
        }
    }, [activeTab]);

    const fetchProducts = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await marketplaceService.getAllProducts({ limit: 100, includeInactive: true });
            setProducts(response.data);
        } catch (error: any) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await marketplaceService.getAllOrders(token, { limit: 100 });
            setOrders(response.data);
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        try {
            const formData = new FormData();
            formData.append('name', productForm.name);
            formData.append('description', productForm.description);
            formData.append('category', productForm.category);
            formData.append('price', productForm.price);
            formData.append('stock', productForm.stock);
            formData.append('isFeatured', productForm.isFeatured.toString());

            // Append images if selected
            if (productImages) {
                Array.from(productImages).forEach((file) => {
                    formData.append('images', file);
                });
            }

            await marketplaceService.createProduct(token, formData);
            toast.success('Product created successfully!');
            setIsProductDialogOpen(false);
            resetProductForm();
            fetchProducts();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create product');
        }
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !editingProduct) return;

        try {
            const formData = new FormData();
            formData.append('name', productForm.name);
            formData.append('description', productForm.description);
            formData.append('category', productForm.category);
            formData.append('price', productForm.price);
            formData.append('stock', productForm.stock);
            formData.append('isFeatured', productForm.isFeatured.toString());

            // Append images if selected
            if (productImages) {
                Array.from(productImages).forEach((file) => {
                    formData.append('images', file);
                });
            }

            await marketplaceService.updateProduct(token, editingProduct._id, formData);
            toast.success('Product updated successfully!');
            setIsProductDialogOpen(false);
            resetProductForm();
            fetchProducts();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update product');
        }
    };

    const handleEditClick = (product: any) => {
        setProductForm({
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price.toString(),
            stock: product.stock.toString(),
            isFeatured: product.isFeatured || false,
        });
        setEditingProduct(product);
        setIsEditing(true);
        setIsProductDialogOpen(true);
    };

    const handleToggleProductStatus = async (productId: string) => {
        if (!token) return;
        try {
            await marketplaceService.toggleProductStatus(token, productId);
            toast.success('Product status updated');
            fetchProducts();
        } catch (error: any) {
            toast.error('Failed to update product status');
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!token || !confirm('Are you sure you want to delete this product?')) return;
        try {
            await marketplaceService.deleteProduct(token, productId);
            toast.success('Product deleted');
            fetchProducts();
        } catch (error: any) {
            toast.error('Failed to delete product');
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, status: string) => {
        if (!token) return;

        // If status is dispatched, show courier dialog
        if (status === 'dispatched') {
            const order = orders.find(o => o._id === orderId);
            setSelectedOrder(order);
            setIsCourierDialogOpen(true);
            return;
        }

        try {
            await marketplaceService.updateOrderStatus(token, orderId, status);
            toast.success('Order status updated');
            fetchOrders();
        } catch (error: any) {
            toast.error('Failed to update order status');
        }
    };

    const handleDispatchWithCourier = async () => {
        if (!token || !selectedOrder) return;

        if (!courierInfo.trackingNumber) {
            toast.error('Please enter tracking number');
            return;
        }

        try {
            await marketplaceService.updateOrderStatus(
                token,
                selectedOrder._id,
                'dispatched',
                courierInfo.courierService,
                courierInfo.trackingNumber
            );
            toast.success(`Order dispatched via ${courierInfo.courierService}`);
            setIsCourierDialogOpen(false);
            setCourierInfo({ courierService: 'TCS', trackingNumber: '' });
            setSelectedOrder(null);
            fetchOrders();
        } catch (error: any) {
            toast.error('Failed to dispatch order');
        }
    };

    const resetProductForm = () => {
        setProductForm({
            name: '',
            description: '',
            category: 'Diagnostic Devices',
            price: '',
            stock: '',
            isFeatured: false,
        });
        setProductImages(null);
        setEditingProduct(null);
        setIsEditing(false);
    };

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-500',
        confirmed: 'bg-blue-500',
        dispatched: 'bg-purple-500',
        delivered: 'bg-green-500',
        cancelled: 'bg-red-500',
    };

    return (
        <DashboardLayout role="admin">
            {/* Background Decor */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
            </div>

            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Marketplace Management</h1>
                        <p className="text-gray-600 mt-2">Manage products and orders efficiently</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
                        <TabsTrigger value="products" className="text-base">
                            <Package className="mr-2 h-5 w-5" />
                            Products
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="text-base">
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Orders
                        </TabsTrigger>
                    </TabsList>

                    {/* Products Tab */}
                    <TabsContent value="products" className="space-y-6 mt-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Total Products</p>
                                <p className="text-2xl font-bold text-primary">{products.length}</p>
                            </div>
                            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={resetProductForm} size="lg" className="shadow-md">
                                        <Plus className="mr-2 h-5 w-5" />
                                        Add Product
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                                        <DialogDescription>{isEditing ? 'Update product details below' : 'Create a new product for the marketplace'}</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={isEditing ? handleUpdateProduct : handleCreateProduct} className="space-y-4">
                                        <div>
                                            <Label htmlFor="name">Product Name *</Label>
                                            <Input
                                                id="name"
                                                value={productForm.name}
                                                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="description">Description *</Label>
                                            <Textarea
                                                id="description"
                                                value={productForm.description}
                                                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                                required
                                                rows={3}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="category">Category *</Label>
                                                <Select
                                                    value={productForm.category}
                                                    onValueChange={(value) => setProductForm({ ...productForm, category: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Diagnostic Devices">Diagnostic Devices</SelectItem>
                                                        <SelectItem value="Monitoring Equipment">Monitoring Equipment</SelectItem>
                                                        <SelectItem value="First Aid">First Aid</SelectItem>
                                                        <SelectItem value="Supplements">Supplements</SelectItem>
                                                        <SelectItem value="Medical Supplies">Medical Supplies</SelectItem>
                                                        <SelectItem value="Personal Care">Personal Care</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="price">Price (Rs.) *</Label>
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    step="0.01"
                                                    value={productForm.price}
                                                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="stock">Stock Quantity *</Label>
                                            <Input
                                                id="stock"
                                                type="number"
                                                value={productForm.stock}
                                                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="images">Product Images</Label>
                                            <Input
                                                id="images"
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) => setProductImages(e.target.files)}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                You can upload multiple images (JPEG, PNG, WebP)
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="isFeatured"
                                                checked={productForm.isFeatured}
                                                onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                                            />
                                            <Label htmlFor="isFeatured">Mark as Featured</Label>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit">{isEditing ? 'Update Product' : 'Create Product'}</Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Card className="shadow-lg border-0">
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Image</TableHead>
                                                <TableHead>Product</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Stock</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {products.map((product) => (
                                                <TableRow key={product._id}>
                                                    <TableCell>
                                                        {product.images && product.images.length > 0 ? (
                                                            <img
                                                                src={product.images[0].startsWith('http') || product.images[0].startsWith('data:')
                                                                    ? product.images[0]
                                                                    : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${product.images[0]}`}
                                                                alt={product.name}
                                                                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                                                                <Package className="h-8 w-8 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{product.name}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.description}</p>
                                                            {product.isFeatured && (
                                                                <Badge variant="secondary" className="mt-1.5 bg-amber-100 text-amber-700 border-amber-200">⭐ Featured</Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-medium">
                                                            {product.category}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-gray-900">Rs. {product.price.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <span className={`font-semibold ${product.stock === 0 ? 'text-red-600' :
                                                            product.stock <= 5 ? 'text-orange-600' :
                                                                'text-green-600'
                                                            }`}>
                                                            {product.stock} units
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={product.isActive ? 'default' : 'secondary'} className={product.isActive ? 'bg-green-500' : ''}>
                                                            {product.isActive ? '✓ Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleToggleProductStatus(product._id)}
                                                                className="hover:bg-gray-100"
                                                            >
                                                                {product.isActive ? 'Deactivate' : 'Activate'}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleEditClick(product)}
                                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleDeleteProduct(product._id)}
                                                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Orders Tab */}
                    <TabsContent value="orders" className="space-y-6 mt-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <p className="text-sm font-medium text-gray-700">Total Orders</p>
                            <p className="text-2xl font-bold text-primary">{orders.length}</p>
                        </div>

                        <Card className="shadow-lg border-0">
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Order #</TableHead>
                                                <TableHead>Patient</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {orders.map((order) => (
                                                <TableRow key={order._id}>
                                                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                                    <TableCell>
                                                        {order.patient?.fullName || 'N/A'}
                                                        <br />
                                                        <span className="text-xs text-gray-500">{order.patient?.email}</span>
                                                    </TableCell>
                                                    <TableCell>{order.items.length} items</TableCell>
                                                    <TableCell className="font-medium">Rs. {order.total.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Badge className={statusColors[order.status]}>
                                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={order.status}
                                                            onValueChange={(value) => handleUpdateOrderStatus(order._id, value)}
                                                            disabled={order.status === 'delivered' || order.status === 'cancelled'}
                                                        >
                                                            <SelectTrigger className="w-[140px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending">Pending</SelectItem>
                                                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                                                <SelectItem value="dispatched">Dispatched</SelectItem>
                                                                <SelectItem value="delivered">Delivered</SelectItem>
                                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Courier Service Dialog */}
                <Dialog open={isCourierDialogOpen} onOpenChange={setIsCourierDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Dispatch Order - Courier Information</DialogTitle>
                            <DialogDescription>
                                Enter courier service details for order {selectedOrder?.orderNumber}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="courierService">Courier Service *</Label>
                                <Select
                                    value={courierInfo.courierService}
                                    onValueChange={(value) => setCourierInfo({ ...courierInfo, courierService: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TCS">TCS</SelectItem>
                                        <SelectItem value="Leopard">Leopard Courier</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="trackingNumber">Tracking Number *</Label>
                                <Input
                                    id="trackingNumber"
                                    placeholder="Enter tracking number"
                                    value={courierInfo.trackingNumber}
                                    onChange={(e) => setCourierInfo({ ...courierInfo, trackingNumber: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsCourierDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleDispatchWithCourier}>
                                    Dispatch Order
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default AdminMarketplace;
