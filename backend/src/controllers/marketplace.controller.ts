import { Request, Response } from 'express';
import Product from '../models/Product';
import Cart from '../models/Cart';
import Wishlist from '../models/Wishlist';
import Order from '../models/Order';
import Notification from '../models/Notification';
import Admin from '../models/Admin';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, sendAdminNewOrderEmail } from '../services/email.service';
import Patient from '../models/Patient';
import * as payfastService from '../services/payfast.service';

// ============================================
// MULTER CONFIGURATION FOR PRODUCT IMAGES
// ============================================
// ============================================
// MULTER CONFIGURATION FOR PRODUCT IMAGES
// ============================================
// Use memory storage to access file buffer for Base64 conversion
const storage = multer.memoryStorage();

export const uploadProductImages = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
        }
    },
});

// ============================================
// PUBLIC PRODUCT ENDPOINTS
// ============================================

// GET ALL PRODUCTS
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { category, search, page = '1', limit = '12', featured, sortBy = 'createdAt', includeInactive } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const query: any = {};

        // Only filter by isActive if includeInactive is not set to 'true'
        if (includeInactive !== 'true') {
            query.isActive = true;
        }

        // Category filter
        if (category && category !== 'all') {
            query.category = category;
        }

        // Featured filter
        if (featured === 'true') {
            query.isFeatured = true;
        }

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search as string, 'i')] } },
            ];
        }

        // Sorting
        let sortOption: any = { createdAt: -1 };
        if (sortBy === 'price-asc') {
            sortOption = { price: 1 };
        } else if (sortBy === 'price-desc') {
            sortOption = { price: -1 };
        } else if (sortBy === 'name') {
            sortOption = { name: 1 };
        }

        const [products, total] = await Promise.all([
            Product.find(query).sort(sortOption).limit(limitNum).skip(skip),
            Product.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error: any) {
        console.error('Get all products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message,
        });
    }
};

// GET PRODUCT BY ID
export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: product,
        });
    } catch (error: any) {
        console.error('Get product by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product',
            error: error.message,
        });
    }
};

// GET PRODUCTS BY CATEGORY
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { category } = req.params;
        const { page = '1', limit = '12' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const [products, total] = await Promise.all([
            Product.find({ category, isActive: true })
                .sort({ createdAt: -1 })
                .limit(limitNum)
                .skip(skip),
            Product.countDocuments({ category, isActive: true }),
        ]);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error: any) {
        console.error('Get products by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message,
        });
    }
};

// GET FEATURED PRODUCTS
export const getFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit = '8' } = req.query;
        const limitNum = parseInt(limit as string);

        const products = await Product.find({ isFeatured: true, isActive: true })
            .sort({ createdAt: -1 })
            .limit(limitNum);

        res.status(200).json({
            success: true,
            data: products,
            count: products.length,
        });
    } catch (error: any) {
        console.error('Get featured products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch featured products',
            error: error.message,
        });
    }
};

// ============================================
// PATIENT CART OPERATIONS
// ============================================

// GET CART
export const getCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user!.id;

        let cart = await Cart.findOne({ patient: patientId }).populate('items.product');

        if (!cart) {
            // Create empty cart if doesn't exist
            cart = await Cart.create({ patient: patientId, items: [] });
        }

        // Calculate cart totals
        const subtotal = cart.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
        const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        res.status(200).json({
            success: true,
            data: {
                cart,
                subtotal,
                itemCount,
            },
        });
    } catch (error: any) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cart',
            error: error.message,
        });
    }
};

// ADD TO CART
export const addToCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user!.id;
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            res.status(400).json({
                success: false,
                message: 'Product ID is required',
            });
            return;
        }

        // Check if product exists and is active
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            res.status(404).json({
                success: false,
                message: 'Product not found or unavailable',
            });
            return;
        }

        // Check stock availability
        if (product.stock < quantity) {
            res.status(400).json({
                success: false,
                message: `Only ${product.stock} items available in stock`,
            });
            return;
        }

        // Find or create cart
        let cart = await Cart.findOne({ patient: patientId });
        if (!cart) {
            cart = await Cart.create({ patient: patientId, items: [] });
        }

        // Check if product already in cart
        const existingItemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            if (newQuantity > product.stock) {
                res.status(400).json({
                    success: false,
                    message: `Cannot add more than ${product.stock} items`,
                });
                return;
            }
            cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            // Add new item
            cart.items.push({
                product: productId,
                quantity,
                priceSnapshot: product.price,
            });
        }

        await cart.save();
        await cart.populate('items.product');

        res.status(200).json({
            success: true,
            message: 'Product added to cart',
            data: cart,
        });
    } catch (error: any) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add product to cart',
            error: error.message,
        });
    }
};

// UPDATE CART ITEM
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user!.id;
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1',
            });
            return;
        }

        const cart = await Cart.findOne({ patient: patientId });
        if (!cart) {
            res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
            return;
        }

        const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
        if (itemIndex === -1) {
            res.status(404).json({
                success: false,
                message: 'Product not found in cart',
            });
            return;
        }

        // Check stock availability
        const product = await Product.findById(productId);
        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found',
            });
            return;
        }

        if (quantity > product.stock) {
            res.status(400).json({
                success: false,
                message: `Only ${product.stock} items available in stock`,
            });
            return;
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        await cart.populate('items.product');

        res.status(200).json({
            success: true,
            message: 'Cart updated',
            data: cart,
        });
    } catch (error: any) {
        console.error('Update cart item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update cart',
            error: error.message,
        });
    }
};

// REMOVE FROM CART
export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user!.id;
        const { productId } = req.params;

        const cart = await Cart.findOne({ patient: patientId });
        if (!cart) {
            res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
            return;
        }

        cart.items = cart.items.filter((item) => item.product.toString() !== productId);
        await cart.save();
        await cart.populate('items.product');

        res.status(200).json({
            success: true,
            message: 'Product removed from cart',
            data: cart,
        });
    } catch (error: any) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove product from cart',
            error: error.message,
        });
    }
};

// CLEAR CART
export const clearCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user!.id;

        const cart = await Cart.findOne({ patient: patientId });
        if (!cart) {
            res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
            return;
        }

        cart.items = [];
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cart cleared',
            data: cart,
        });
    } catch (error: any) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cart',
            error: error.message,
        });
    }
};

// ============================================
// PATIENT WISHLIST OPERATIONS
// ============================================

// GET WISHLIST
export const getWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user!.id;

        let wishlist = await Wishlist.findOne({ patient: patientId }).populate('products');

        if (!wishlist) {
            wishlist = await Wishlist.create({ patient: patientId, products: [] });
        }

        res.status(200).json({
            success: true,
            data: wishlist,
            count: wishlist.products.length,
        });
    } catch (error: any) {
        console.error('Get wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wishlist',
            error: error.message,
        });
    }
};

// ADD TO WISHLIST
export const addToWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user!.id;
        const { productId } = req.body;

        if (!productId) {
            res.status(400).json({
                success: false,
                message: 'Product ID is required',
            });
            return;
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found',
            });
            return;
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ patient: patientId });
        if (!wishlist) {
            wishlist = await Wishlist.create({ patient: patientId, products: [] });
        }

        // Check if product already in wishlist
        if (wishlist.products.includes(productId)) {
            res.status(400).json({
                success: false,
                message: 'Product already in wishlist',
            });
            return;
        }

        wishlist.products.push(productId);
        await wishlist.save();
        await wishlist.populate('products');

        res.status(200).json({
            success: true,
            message: 'Product added to wishlist',
            data: wishlist,
        });
    } catch (error: any) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add product to wishlist',
            error: error.message,
        });
    }
};

// REMOVE FROM WISHLIST
export const removeFromWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user!.id;
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ patient: patientId });
        if (!wishlist) {
            res.status(404).json({
                success: false,
                message: 'Wishlist not found',
            });
            return;
        }

        wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
        await wishlist.save();
        await wishlist.populate('products');

        res.status(200).json({
            success: true,
            message: 'Product removed from wishlist',
            data: wishlist,
        });
    } catch (error: any) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove product from wishlist',
            error: error.message,
        });
    }
};

// MOVE WISHLIST ITEM TO CART
export const moveWishlistToCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user!.id;
        const { productId } = req.body;

        if (!productId) {
            res.status(400).json({
                success: false,
                message: 'Product ID is required',
            });
            return;
        }

        // Get product
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            res.status(404).json({
                success: false,
                message: 'Product not found or unavailable',
            });
            return;
        }

        // Check stock
        if (product.stock < 1) {
            res.status(400).json({
                success: false,
                message: 'Product out of stock',
            });
            return;
        }

        // Add to cart
        let cart = await Cart.findOne({ patient: patientId });
        if (!cart) {
            cart = await Cart.create({ patient: patientId, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += 1;
        } else {
            cart.items.push({
                product: productId,
                quantity: 1,
                priceSnapshot: product.price,
            });
        }

        await cart.save();

        // Remove from wishlist
        const wishlist = await Wishlist.findOne({ patient: patientId });
        if (wishlist) {
            wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
            await wishlist.save();
        }

        res.status(200).json({
            success: true,
            message: 'Product moved to cart',
        });
    } catch (error: any) {
        console.error('Move wishlist to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to move product to cart',
            error: error.message,
        });
    }
};

// ============================================
// PATIENT ORDER OPERATIONS
// ============================================

// CREATE ORDER
export const createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user!.id;
        const { shippingAddress, paymentMethod, notes } = req.body;

        if (!shippingAddress || !paymentMethod) {
            res.status(400).json({
                success: false,
                message: 'Shipping address and payment method are required',
            });
            return;
        }

        // Get cart
        const cart = await Cart.findOne({ patient: patientId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Cart is empty',
            });
            return;
        }

        // Validate stock and prepare order items
        const orderItems = [];
        for (const item of cart.items) {
            const product = item.product as any;
            if (!product.isActive) {
                res.status(400).json({
                    success: false,
                    message: `Product ${product.name} is no longer available`,
                });
                return;
            }
            if (product.stock < item.quantity) {
                res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Only ${product.stock} available`,
                });
                return;
            }

            orderItems.push({
                product: product._id,
                productName: product.name,
                quantity: item.quantity,
                price: item.priceSnapshot,
            });
        }

        // Calculate totals
        const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = 0; // No tax
        const shipping = 0; // Free shipping
        const total = subtotal;

        // Create order
        const order = await Order.create({
            patient: patientId,
            items: orderItems,
            subtotal,
            tax,
            shipping,
            total,
            shippingAddress,
            paymentMethod,
            paymentStatus: 'pending',
            notes,
        });

        // Update product stock (always decrement stock for both COD and Online)
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity },
            });
        }

        // Prepare PayFast data if online payment
        let paymentData = null;
        if (paymentMethod === 'online') {
            try {
                const patient = await Patient.findById(patientId);
                paymentData = payfastService.generatePaymentData({
                    orderId: order.orderNumber,
                    amount: total,
                    itemName: `Order ${order.orderNumber}`,
                    patientEmail: patient?.email || '',
                    patientName: patient?.fullName || 'Customer',
                });
            } catch (payError) {
                console.error('Error generating PayFast data:', payError);
                // We'll still return the order, but notify about payment data failure
            }
        }

        // Clear cart
        cart.items = [];
        await cart.save();

        // Send success response
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                order,
                paymentData // This will be null for COD
            },
        });

        // Send Success Email (non-blocking)
        // Send Success Email (non-blocking)
        let patientDetails = null;
        try {
            patientDetails = await Patient.findById(patientId);
            if (patientDetails) {
                await sendOrderConfirmationEmail(
                    patientDetails.email,
                    patientDetails.fullName,
                    order.orderNumber,
                    orderItems,
                    total,
                    shippingAddress
                );
            }
        } catch (emailError) {
            console.error('Error sending order confirmation email:', emailError);
        }

        // Create notifications after response (non-blocking)
        try {
            await Notification.create({
                user: patientId,
                userType: 'patient',
                type: 'order_created',
                title: 'Order Placed Successfully! 🎉',
                message: `Your order ${order.orderNumber} has been placed. Total: Rs. ${total.toFixed(2)}`,
                metadata: { orderId: order._id },
            });
        } catch (notifError) {
            console.error('Error sending patient notification:', notifError);
        }

        // Notify all admins about new order (non-blocking)
        try {
            const admins = await Admin.find();
            for (const admin of admins) {
                // In-App Notification
                await Notification.create({
                    user: admin._id,
                    userType: 'admin',
                    type: 'new_order',
                    title: '🛒 New Order Received',
                    message: `Order ${order.orderNumber} placed by patient. Total: Rs. ${total.toFixed(2)}`,
                    metadata: { orderId: order._id, patientId },
                });

                // Email Notification
                await sendAdminNewOrderEmail(
                    admin.email,
                    'Admin', // Admin model has no fullName
                    order.orderNumber,
                    patientDetails ? patientDetails.fullName : 'Guest',
                    total,
                    orderItems.length
                );
            }
        } catch (notifError) {
            console.error('Error sending admin notifications:', notifError);
        }
    } catch (error: any) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message,
        });
    }
};

// GET MY ORDERS
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user!.id;
        const { page = '1', limit = '10', status } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const query: any = { patient: patientId };
        if (status) {
            query.status = status;
        }

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('items.product')
                .sort({ createdAt: -1 })
                .limit(limitNum)
                .skip(skip),
            Order.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error: any) {
        console.error('Get my orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message,
        });
    }
};

// GET ORDER BY ID
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const patientId = req.user!.id;

        const order = await Order.findOne({ _id: id, patient: patientId }).populate('items.product');

        if (!order) {
            res.status(404).json({
                success: false,
                message: 'Order not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error: any) {
        console.error('Get order by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order',
            error: error.message,
        });
    }
};

// CANCEL ORDER
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const patientId = req.user!.id;
        const { reason } = req.body;

        const order = await Order.findOne({ _id: id, patient: patientId });

        if (!order) {
            res.status(404).json({
                success: false,
                message: 'Order not found',
            });
            return;
        }

        if (order.status !== 'pending') {
            res.status(400).json({
                success: false,
                message: 'Only pending orders can be cancelled',
            });
            return;
        }

        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelReason = reason || 'Cancelled by customer';
        await order.save();

        // Restore product stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity },
            });
        }

        // Send success response first
        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: order,
        });

        // Create notification for patient (non-blocking)
        try {
            await Notification.create({
                user: patientId,
                userType: 'patient',
                type: 'order_cancelled',
                title: 'Order Cancelled',
                message: `Your order ${order.orderNumber} has been cancelled.`,
                metadata: { orderId: order._id },
            });
        } catch (notifError) {
            console.error('Error sending patient notification:', notifError);
        }

        // Notify all admins about order cancellation (non-blocking)
        try {
            const admins = await Admin.find();
            for (const admin of admins) {
                await Notification.create({
                    user: admin._id,
                    userType: 'admin',
                    type: 'order_cancelled',
                    title: '❌ Order Cancelled',
                    message: `Order ${order.orderNumber} was cancelled by patient. Reason: ${order.cancelReason}`,
                    metadata: { orderId: order._id, patientId },
                });
            }
        } catch (notifError) {
            console.error('Error sending admin notifications:', notifError);
        }
    } catch (error: any) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order',
            error: error.message,
        });
    }
};

// ============================================
// ADMIN PRODUCT MANAGEMENT
// ============================================

// CREATE PRODUCT
export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description, category, price, stock, specifications, tags, isFeatured } = req.body;

        if (!name || !description || !category || !price) {
            res.status(400).json({
                success: false,
                message: 'Name, description, category, and price are required',
            });
            return;
        }

        // Handle uploaded images
        const images: string[] = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
                images.push(base64Image);
            }
        }

        const product = await Product.create({
            name,
            description,
            category,
            price: parseFloat(price),
            stock: stock ? parseInt(stock) : 0,
            images,
            specifications: specifications ? JSON.parse(specifications) : {},
            tags: tags ? JSON.parse(tags) : [],
            isFeatured: isFeatured === 'true',
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product,
        });
    } catch (error: any) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product',
            error: error.message,
        });
    }
};

// UPDATE PRODUCT
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, description, category, price, stock, specifications, tags, isFeatured } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found',
            });
            return;
        }

        // Update fields
        if (name) product.name = name;
        if (description) product.description = description;
        if (category) product.category = category;
        if (price) product.price = parseFloat(price);
        if (stock !== undefined) product.stock = parseInt(stock);
        if (specifications) product.specifications = JSON.parse(specifications);
        if (tags) product.tags = JSON.parse(tags);
        if (isFeatured !== undefined) product.isFeatured = isFeatured === 'true';

        // Handle new uploaded images
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
                product.images.push(base64Image);
            }
        }

        await product.save();

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: product,
        });
    } catch (error: any) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product',
            error: error.message,
        });
    }
};

// DELETE PRODUCT
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found',
            });
            return;
        }

        // Actually delete the product from database
        await Product.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product',
            error: error.message,
        });
    }
};

// TOGGLE PRODUCT STATUS
export const toggleProductStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found',
            });
            return;
        }

        product.isActive = !product.isActive;
        await product.save();

        res.status(200).json({
            success: true,
            message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
            data: product,
        });
    } catch (error: any) {
        console.error('Toggle product status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle product status',
            error: error.message,
        });
    }
};

// ============================================
// ADMIN ORDER MANAGEMENT
// ============================================

// GET ALL ORDERS
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, page = '1', limit = '20', search } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const query: any = {};
        if (status) {
            query.status = status;
        }
        if (search) {
            query.orderNumber = { $regex: search, $options: 'i' };
        }

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('patient', 'fullName email phone')
                .populate('items.product')
                .sort({ createdAt: -1 })
                .limit(limitNum)
                .skip(skip),
            Order.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error: any) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message,
        });
    }
};

// UPDATE ORDER STATUS
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, courierService, trackingNumber } = req.body;

        if (!status) {
            res.status(400).json({
                success: false,
                message: 'Status is required',
            });
            return;
        }

        const validStatuses = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                message: 'Invalid status',
            });
            return;
        }

        const order = await Order.findById(id).populate('patient');
        if (!order) {
            res.status(404).json({
                success: false,
                message: 'Order not found',
            });
            return;
        }

        order.status = status;

        // If status is dispatched, save courier information
        if (status === 'dispatched' && courierService) {
            order.courierService = courierService;
            order.trackingNumber = trackingNumber;
            order.courierBookingDate = new Date();
        }

        await order.save();

        // Create notification for patient
        let notificationMessage = '';
        if (status === 'confirmed') {
            notificationMessage = `Your order ${order.orderNumber} has been confirmed and is being prepared.`;
        } else if (status === 'dispatched') {
            if (order.courierService && order.trackingNumber) {
                notificationMessage = `Your order ${order.orderNumber} has been dispatched via ${order.courierService}! Tracking Number: ${order.trackingNumber}`;
            } else {
                notificationMessage = `Your order ${order.orderNumber} has been dispatched and is on the way!`;
            }
        } else if (status === 'delivered') {
            notificationMessage = `Your order ${order.orderNumber} has been delivered. Thank you for shopping with us!`;
        }

        if (notificationMessage) {
            await Notification.create({
                user: order.patient._id,
                userType: 'patient',
                type: 'order_status_updated',
                title: 'Order Status Updated',
                message: notificationMessage,
                metadata: { orderId: order._id, status },
            });

            // Send Email Notification
            const patient = order.patient as any;
            if (patient && patient.email) {
                await sendOrderStatusUpdateEmail(
                    patient.email,
                    patient.fullName,
                    order.orderNumber,
                    status,
                    order.courierService,
                    order.trackingNumber
                );
            }
        }

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: order,
        });
    } catch (error: any) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status',
            error: error.message,
        });
    }
};

// PROCESS REFUND
export const processRefund = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            res.status(404).json({
                success: false,
                message: 'Order not found',
            });
            return;
        }

        if (order.paymentStatus === 'refunded') {
            res.status(400).json({
                success: false,
                message: 'Order already refunded',
            });
            return;
        }

        order.paymentStatus = 'refunded';
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelReason = reason || 'Refund processed by admin';
        await order.save();

        // Restore product stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity },
            });
        }

        // Create notification
        await Notification.create({
            user: order.patient,
            userType: 'patient',
            type: 'order_refunded',
            title: 'Refund Processed',
            message: `Your order ${order.orderNumber} has been refunded. Amount: Rs. ${order.total.toFixed(2)}`,
            metadata: { orderId: order._id },
        });

        res.status(200).json({
            success: true,
            message: 'Refund processed successfully',
            data: order,
        });
    } catch (error: any) {
        console.error('Process refund error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process refund',
            error: error.message,
        });
    }
};

// HANDLE PAYFAST ITN (Instant Transaction Notification)
export const handlePayFastITN = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Received PayFast ITN:', req.body);

        const {
            m_payment_id, // This is our orderNumber
            pf_payment_id, // PayFast transaction ID
            payment_status,
            item_name,
            amount_gross,
            signature,
        } = req.body;

        // 1. Validate Signature
        const receivedSignature = signature;
        const dataToVerify = { ...req.body };
        delete dataToVerify.signature;

        const calculatedSignature = payfastService.generateSignature(dataToVerify, process.env.PAYFAST_PASSPHRASE);

        if (receivedSignature !== calculatedSignature) {
            console.error('PayFast Signature Validation Failed');
            res.status(400).send('Invalid signature');
            return;
        }

        // 2. Find Order
        const order = await Order.findOne({ orderNumber: m_payment_id });
        if (!order) {
            console.error(`Order not found for ITN: ${m_payment_id}`);
            res.status(404).send('Order not found');
            return;
        }

        // 3. Update Order Status
        if (payment_status === 'COMPLETE') {
            order.paymentStatus = 'completed';
            order.transactionId = pf_payment_id;
            // You might want to update order status to 'confirmed' automatically
            order.status = 'confirmed';
            await order.save();

            // Notify patient
            await Notification.create({
                user: order.patient,
                userType: 'patient',
                type: 'payment_completed',
                title: 'Payment Received! 💳',
                message: `Payment for order ${order.orderNumber} was successful. Your order is now confirmed.`,
                metadata: { orderId: order._id },
            });
        } else if (payment_status === 'FAILED') {
            order.paymentStatus = 'failed';
            await order.save();

            await Notification.create({
                user: order.patient,
                userType: 'patient',
                type: 'payment_failed',
                title: 'Payment Failed ❌',
                message: `Payment for order ${order.orderNumber} failed. Please try again or contact support.`,
                metadata: { orderId: order._id },
            });
        }

        // PayFast expects a 200 OK response
        res.status(200).send('OK');
    } catch (error: any) {
        console.error('PayFast ITN Error:', error);
        res.status(500).send('Internal Server Error');
    }
};
