import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp } from '../helpers';
import { mockStripeService } from '../helpers/mocks';
import Product from '../../models/Product';

// Mock Stripe + emails
mockStripeService();
jest.mock('../../services/email.service', () => ({
    sendOrderConfirmationEmail: jest.fn(),
    sendOrderStatusUpdateEmail: jest.fn(),
    sendAdminNewOrderEmail: jest.fn(),
}));

import { protect, restrictTo } from '../../middleware/auth.middleware';
jest.mock('../../middleware/auth.middleware', () => ({
    protect: jest.fn(),
    restrictTo: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

import marketplaceRoutes from '../../routes/marketplace.routes';

const app = createTestApp(marketplaceRoutes, '/api/marketplace');

// ─── UC-16: Manage Marketplace (Admin Product CRUD) ─────────────────────────
describe('UC-16: Manage Marketplace (Admin Product Management)', () => {
    let adminProductId: string;

    beforeEach(async () => {
        // Authenticate as admin
        (protect as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
            req.user = { id: new mongoose.Types.ObjectId().toString(), userType: 'admin' };
            next();
        });

        // Seed one product to use in update/delete/toggle tests
        const product = await Product.create({
            name: 'Admin Test Thermometer',
            description: 'Clinical grade thermometer',
            category: 'Monitoring Equipment',
            price: 1200,
            stock: 50,
            isActive: true,
        });
        adminProductId = product._id.toString();
    });

    it('should create a new product as admin with required fields', async () => {
        const response = await request(app)
            .post('/api/marketplace/admin/products')
            .field('name', 'Pulse Oximeter Pro')
            .field('description', 'Medical grade pulse oximeter')
            .field('category', 'Monitoring Equipment')
            .field('price', '3500')
            .field('stock', '20');

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Pulse Oximeter Pro');
        expect(response.body.data.price).toBe(3500);

        const dbCheck = await Product.findById(response.body.data._id);
        expect(dbCheck).not.toBeNull();
    });

    it('should return 400 when required fields are missing on product creation', async () => {
        const response = await request(app)
            .post('/api/marketplace/admin/products')
            .field('name', 'Incomplete Product');
        // Missing description, category, price

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('required');
    });

    it('should update an existing product price and stock', async () => {
        const response = await request(app)
            .put(`/api/marketplace/admin/products/${adminProductId}`)
            .field('price', '999')
            .field('stock', '100');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const dbCheck = await Product.findById(adminProductId);
        expect(dbCheck?.price).toBe(999);
        expect(dbCheck?.stock).toBe(100);
    });

    it('should toggle a product from active to inactive', async () => {
        const response = await request(app)
            .put(`/api/marketplace/admin/products/${adminProductId}/status`);

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('deactivated');

        const dbCheck = await Product.findById(adminProductId);
        expect(dbCheck?.isActive).toBe(false);
    });

    it('should permanently delete a product', async () => {
        const response = await request(app)
            .delete(`/api/marketplace/admin/products/${adminProductId}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('deleted successfully');

        const dbCheck = await Product.findById(adminProductId);
        expect(dbCheck).toBeNull();
    });

    it('should return 404 when updating or deleting a non-existent product', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const response = await request(app)
            .delete(`/api/marketplace/admin/products/${fakeId}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toContain('Product not found');
    });
});
