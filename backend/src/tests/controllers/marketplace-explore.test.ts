import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, sampleProducts, mockStripe, mockStripeService, mockEmailService, validPatientData } from '../helpers';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import Product from '../../models/Product';
import Patient from '../../models/Patient';
import Cart from '../../models/Cart';
import Wishlist from '../../models/Wishlist';
import Order from '../../models/Order';

// Activate mocks — MUST be called before route imports
mockStripe();
mockStripeService();
mockEmailService();

jest.mock('../../middleware/auth.middleware', () => ({
    protect: jest.fn(),
    restrictTo: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

import marketplaceRoutes from '../../routes/marketplace.routes';

const app = createTestApp(marketplaceRoutes, '/api/marketplace');

// ─── UC-6: Explore Market Place (Browse) ───────────────────────────────────
describe('UC-6: Explore Market Place', () => {
    let vitaminCId: string;

    beforeEach(async () => {
        for (const productData of sampleProducts) {
            const product = new Product(productData);
            await product.save();
            if (productData.name === 'Vitamin C Supplement') {
                vitaminCId = product._id.toString();
            }
        }
    });

    // ── Unit: getAllProducts ──

    it('should successfully fetch all active products (default without filters)', async () => {
        const response = await request(app).get('/api/marketplace/products');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBe(3);
        const names = response.body.data.map((p: any) => p.name);
        expect(names).not.toContain('Discontinued Wheelchair');
    });

    it('should successfully paginate the products', async () => {
        const response = await request(app).get('/api/marketplace/products?limit=2&page=1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBe(2);
        expect(response.body.pagination.total).toBe(3);
        expect(response.body.pagination.pages).toBe(2);
    });

    it('should successfully filter products by searching keywords', async () => {
        const response = await request(app).get('/api/marketplace/products?search=monitor');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].name).toBe('Blood Pressure Monitor');
    });

    it('should successfully filter products by category', async () => {
        const response = await request(app).get('/api/marketplace/products?category=First Aid');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].name).toBe('Adhesive Bandages');
    });

    it('should handle sorting by price ascending correctly', async () => {
        const response = await request(app).get('/api/marketplace/products?sortBy=price-asc');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        const prices = response.body.data.map((p: any) => p.price);
        expect(prices[0]).toBe(5);
        expect(prices[1]).toBe(15);
        expect(prices[2]).toBe(50);
    });

    // ── Unit: getProductById ──

    it('should successfully fetch a specific product by its ID', async () => {
        const response = await request(app).get(`/api/marketplace/products/${vitaminCId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Vitamin C Supplement');
    });

    it('should fail with 404 if requesting an unknown product ID', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const response = await request(app).get(`/api/marketplace/products/${fakeId}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Product not found');
    });

    // ── Unit: getFeaturedProducts ──

    it('should successfully fetch only featured products', async () => {
        const response = await request(app).get('/api/marketplace/featured');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBe(2);
        const isFeaturedList = response.body.data.map((p: any) => p.isFeatured);
        expect(isFeaturedList).not.toContain(false);
    });
});

// ─── UC-6: Explore Market Place (Cart, Wishlist & Orders) ─────────────────
describe('UC-6: Explore Marketplace (Cart, Wishlist & Orders)', () => {
    let patientId: string;
    let productId: string;
    let outOfStockProductId: string;

    const shippingAddress = {
        fullName: 'Test Patient',
        phone: '1234567890',
        addressLine1: '123 Test Street',
        city: 'Lahore',
        state: 'Punjab',
        postalCode: '54000'
    };

    beforeEach(async () => {
        // Patient
        const patient = new Patient(validPatientData);
        await patient.save();
        patientId = patient._id.toString();

        // Active product with stock
        const product = await Product.create({
            name: 'Test Glucometer',
            description: 'Tests blood sugar levels',
            category: 'Monitoring Equipment',
            price: 2500,
            stock: 10,
            isActive: true,
        });
        productId = product._id.toString();

        // Out of stock product
        const outOfStockProduct = await Product.create({
            name: 'Sold Out Item',
            description: 'Nothing left',
            category: 'Personal Care',
            price: 100,
            stock: 0,
            isActive: true,
        });
        outOfStockProductId = outOfStockProduct._id.toString();

        // Authenticate as patient
        (protect as jest.Mock).mockImplementation((req, res, next) => {
            req.user = { id: patientId, userType: 'patient' };
            next();
        });
    });

    // ─── CART ────────────────────────────────────────────────────
    describe('Cart Management', () => {
        it('should create an empty cart on first GET if none exists', async () => {
            const response = await request(app).get('/api/marketplace/cart');

            expect(response.status).toBe(200);
            expect(response.body.data.cart.items.length).toBe(0);
            expect(response.body.data.itemCount).toBe(0);
        });

        it('should add a product to the cart successfully', async () => {
            const response = await request(app)
                .post('/api/marketplace/cart')
                .send({ productId, quantity: 2 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('added to cart');

            const cart = await Cart.findOne({ patient: patientId });
            expect(cart?.items.length).toBe(1);
            expect(cart?.items[0].quantity).toBe(2);
        });

        it('should reject adding a product that exceeds available stock', async () => {
            const response = await request(app)
                .post('/api/marketplace/cart')
                .send({ productId, quantity: 99 }); // stock is 10

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Only 10 items available');
        });

        it('should update the quantity of an existing cart item', async () => {
            await request(app).post('/api/marketplace/cart').send({ productId, quantity: 1 });

            const response = await request(app)
                .put(`/api/marketplace/cart/${productId}`)
                .send({ quantity: 3 });

            expect(response.status).toBe(200);
            const cart = await Cart.findOne({ patient: patientId });
            expect(cart?.items[0].quantity).toBe(3);
        });

        it('should remove a specific product from the cart', async () => {
            await request(app).post('/api/marketplace/cart').send({ productId, quantity: 1 });

            const response = await request(app).delete(`/api/marketplace/cart/${productId}`);

            expect(response.status).toBe(200);
            const cart = await Cart.findOne({ patient: patientId });
            expect(cart?.items.length).toBe(0);
        });

        it('should clear all items from the cart', async () => {
            await request(app).post('/api/marketplace/cart').send({ productId, quantity: 2 });

            const response = await request(app).delete('/api/marketplace/cart');

            expect(response.status).toBe(200);
            const cart = await Cart.findOne({ patient: patientId });
            expect(cart?.items.length).toBe(0);
        });
    });

    // ─── WISHLIST ────────────────────────────────────────────────
    describe('Wishlist Management', () => {
        it('should add a product to the wishlist', async () => {
            const response = await request(app)
                .post('/api/marketplace/wishlist')
                .send({ productId });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('added to wishlist');

            const wishlist = await Wishlist.findOne({ patient: patientId });
            expect(wishlist?.products.length).toBe(1);
        });

        it('should prevent adding the same product to wishlist twice', async () => {
            await request(app).post('/api/marketplace/wishlist').send({ productId });
            const response = await request(app).post('/api/marketplace/wishlist').send({ productId });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('already in wishlist');
        });

        it('should remove a product from the wishlist', async () => {
            await request(app).post('/api/marketplace/wishlist').send({ productId });

            const response = await request(app).delete(`/api/marketplace/wishlist/${productId}`);

            expect(response.status).toBe(200);
            const wishlist = await Wishlist.findOne({ patient: patientId });
            expect(wishlist?.products.length).toBe(0);
        });

        it('should move a wishlist product to the cart', async () => {
            await request(app).post('/api/marketplace/wishlist').send({ productId });

            const response = await request(app)
                .post('/api/marketplace/wishlist/move-to-cart')
                .send({ productId });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('moved to cart');

            // Removed from wishlist
            const wishlist = await Wishlist.findOne({ patient: patientId });
            expect(wishlist?.products.length).toBe(0);

            // Added to cart
            const cart = await Cart.findOne({ patient: patientId });
            expect(cart?.items.length).toBe(1);
        });
    });

    // ─── ORDERS ──────────────────────────────────────────────────
    describe('Order Management', () => {
        it('should create a COD order from cart, decrement stock, and clear the cart', async () => {
            await request(app).post('/api/marketplace/cart').send({ productId, quantity: 2 });

            const response = await request(app)
                .post('/api/marketplace/orders')
                .send({ shippingAddress, paymentMethod: 'cash_on_delivery' });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.order.total).toBe(5000); // 2500 x 2

            // Stock decremented
            const updatedProduct = await Product.findById(productId);
            expect(updatedProduct?.stock).toBe(8); // 10 - 2

            // Cart cleared
            const cart = await Cart.findOne({ patient: patientId });
            expect(cart?.items.length).toBe(0);
        });

        it('should fail to create an order from an empty cart', async () => {
            const response = await request(app)
                .post('/api/marketplace/orders')
                .send({ shippingAddress, paymentMethod: 'cash_on_delivery' });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Cart is empty');
        });

        it('should cancel a pending order', async () => {
            await request(app).post('/api/marketplace/cart').send({ productId, quantity: 1 });
            const createRes = await request(app)
                .post('/api/marketplace/orders')
                .send({ shippingAddress, paymentMethod: 'cash_on_delivery' });
            const orderId = createRes.body.data.order._id;

            const response = await request(app).put(`/api/marketplace/orders/${orderId}/cancel`);

            expect(response.status).toBe(200);
            const dbOrder = await Order.findById(orderId);
            expect(dbOrder?.status).toBe('cancelled');
        });
    });
});
