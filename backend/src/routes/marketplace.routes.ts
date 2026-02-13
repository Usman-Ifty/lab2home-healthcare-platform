import express from 'express';
import {
    getAllProducts,
    getProductById,
    getProductsByCategory,
    getFeaturedProducts,
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    moveWishlistToCart,
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getAllOrders,
    updateOrderStatus,
    processRefund,
    uploadProductImages,
    handlePayFastITN,
} from '../controllers/marketplace.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = express.Router();

// ============================================
// PUBLIC ROUTES - Products
// ============================================
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.get('/products/category/:category', getProductsByCategory);
router.get('/featured', getFeaturedProducts);

// ============================================
// PATIENT ROUTES - Cart
// ============================================
router.get('/cart', protect, restrictTo('patient'), getCart);
router.post('/cart', protect, restrictTo('patient'), addToCart);
router.put('/cart/:productId', protect, restrictTo('patient'), updateCartItem);
router.delete('/cart/:productId', protect, restrictTo('patient'), removeFromCart);
router.delete('/cart', protect, restrictTo('patient'), clearCart);

// ============================================
// PATIENT ROUTES - Wishlist
// ============================================
router.get('/wishlist', protect, restrictTo('patient'), getWishlist);
router.post('/wishlist', protect, restrictTo('patient'), addToWishlist);
router.delete('/wishlist/:productId', protect, restrictTo('patient'), removeFromWishlist);
router.post('/wishlist/move-to-cart', protect, restrictTo('patient'), moveWishlistToCart);

// ============================================
// PATIENT ROUTES - Orders
// ============================================
router.post('/orders', protect, restrictTo('patient'), createOrder);
router.get('/orders', protect, restrictTo('patient'), getMyOrders);
router.get('/orders/:id', protect, restrictTo('patient'), getOrderById);
router.put('/orders/:id/cancel', protect, restrictTo('patient'), cancelOrder);

// ============================================
// ADMIN ROUTES - Product Management
// ============================================
router.post(
    '/admin/products',
    protect,
    restrictTo('admin'),
    uploadProductImages.array('images', 5),
    createProduct
);
// Toggle status route MUST come before the generic :id routes
router.put('/admin/products/:id/status', protect, restrictTo('admin'), toggleProductStatus);
router.put(
    '/admin/products/:id',
    protect,
    restrictTo('admin'),
    uploadProductImages.array('images', 5),
    updateProduct
);
router.delete('/admin/products/:id', protect, restrictTo('admin'), deleteProduct);

// ============================================
// ADMIN ROUTES - Order Management
// ============================================
router.get('/admin/orders', protect, restrictTo('admin'), getAllOrders);
router.put('/admin/orders/:id/status', protect, restrictTo('admin'), updateOrderStatus);
router.post('/admin/orders/:id/refund', protect, restrictTo('admin'), processRefund);

// ============================================
// PAYFAST WEBHOOKS
// ============================================
router.post('/itn', handlePayFastITN);

export default router;
