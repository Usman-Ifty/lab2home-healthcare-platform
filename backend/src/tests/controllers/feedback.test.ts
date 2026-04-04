import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, validPatientData, validLabData, validLabLicense } from '../helpers';
import Feedback from '../../models/Feedback';
import Patient from '../../models/Patient';
import Lab from '../../models/Lab';
import Phlebotomist from '../../models/Phlebotomist';
import Product from '../../models/Product';
import Booking from '../../models/Booking';
import Order from '../../models/Order';

import { protect, restrictTo } from '../../middleware/auth.middleware';

// Mock authentication
jest.mock('../../middleware/auth.middleware', () => ({
    protect: jest.fn(),
    restrictTo: jest.fn(() => (req: any, res: any, next: any) => next()), // just pass through
}));

import feedbackRoutes from '../../routes/feedback.routes';

const app = createTestApp(feedbackRoutes, '/api/feedbacks');

describe('UC-11: Provide Rating and Feedback', () => {
    let patientId: string;
    let labId: string;
    let phlebId: string;
    let productId: string;
    
    let completedBookingId: string;
    let pendingBookingId: string;
    let deliveredOrderId: string;

    beforeEach(async () => {
        // Create Patient
        const patient = new Patient({
            ...validPatientData,
            email: 'feedback.tester@example.com'
        });
        await patient.save();
        patientId = patient._id.toString();

        // Create Lab
        const lab = new Lab({
            ...validLabData,
            email: 'lab.feedback@example.com',
            license: validLabLicense
        });
        await lab.save();
        labId = lab._id.toString();

        // Create Phlebotomist
        const phleb = new Phlebotomist({
            fullName: 'John Phleb',
            email: 'john.phleb@example.com',
            password: 'Password123!',
            phone: '1234567890',
            qualification: 'BSc Nursing',
            yearsOfExperience: 5,
            trafficLicense: {
                data: Buffer.from('fake-license-data'),
                contentType: 'application/pdf',
                filename: 'license.pdf',
                size: 1024
            }
        });
        await phleb.save();
        phlebId = phleb._id.toString();

        // Create Product
        const product = new Product({
            name: 'Thermometer',
            description: 'Digital Thermometer',
            price: 500,
            stock: 10,
            category: 'Monitoring Equipment',
            lab: lab._id
        });
        await product.save();
        productId = product._id.toString();

        // Create Completed Booking
        const completedBooking = await Booking.create({
            patient: patient._id,
            lab: lab._id,
            phlebotomist: phleb._id,
            tests: [new mongoose.Types.ObjectId()],
            bookingDate: new Date('2026-10-15'),
            preferredTimeSlot: '10:00 AM',
            collectionType: 'home',
            collectionAddress: '123 Test St',
            totalAmount: 1500,
            status: 'completed'
        });
        completedBookingId = completedBooking._id.toString();

        // Create Pending Booking
        const pendingBooking = await Booking.create({
            patient: patient._id,
            lab: lab._id,
            tests: [new mongoose.Types.ObjectId()],
            bookingDate: new Date('2026-10-16'),
            preferredTimeSlot: '11:00 AM',
            collectionType: 'lab',
            totalAmount: 1500,
            status: 'pending'
        });
        pendingBookingId = pendingBooking._id.toString();

        // Create Delivered Order
        const deliveredOrder = await Order.create({
            patient: patient._id,
            items: [{ product: product._id, productName: 'Thermometer', quantity: 1, price: 500 }],
            subtotal: 500,
            total: 500,
            shippingAddress: {
                fullName: 'John Doe',
                phone: '1234567890',
                addressLine1: '123 Test St',
                city: 'Test City',
                state: 'Test State',
                postalCode: '12345'
            },
            status: 'delivered',
            paymentMethod: 'cash_on_delivery',
            paymentStatus: 'pending'
        });
        deliveredOrderId = deliveredOrder._id.toString();

        // Always authenticate as our Patient
        (protect as jest.Mock).mockImplementation((req, res, next) => {
            req.user = { id: patientId, userType: 'patient' };
            next();
        });
    });

    describe('POST /api/feedbacks', () => {
        it('should successfully submit feedback for a lab on a completed booking', async () => {
            const response = await request(app)
                .post('/api/feedbacks')
                .send({
                    targetType: 'lab',
                    targetId: labId,
                    rating: 5,
                    comment: 'Great service!',
                    booking: completedBookingId
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.rating).toBe(5);

            // Verify lab's averageRating was updated natively
            const updatedLab = await Lab.findById(labId);
            expect(updatedLab?.averageRating).toBe(5);
            expect(updatedLab?.totalReviews).toBe(1);
        });

        it('should fail to submit a second feedback for the same lab on the same completed booking', async () => {
            // First feedback
            await request(app).post('/api/feedbacks').send({
                targetType: 'lab', targetId: labId, rating: 5, comment: 'Great service!', booking: completedBookingId
            });

            // Second feedback
            const response = await request(app)
                .post('/api/feedbacks')
                .send({
                    targetType: 'lab', targetId: labId, rating: 4, comment: 'Changed my mind', booking: completedBookingId
                });

            expect(response.status).toBe(409); // Conflict
            expect(response.body.message).toContain('already reviewed');
        });

        it('should fail with 400 if trying to review a lab but not providing a booking ID', async () => {
            const response = await request(app)
                .post('/api/feedbacks')
                .send({
                    targetType: 'lab',
                    targetId: labId,
                    rating: 3,
                    comment: 'Missed booking ID'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Booking ID is required');
        });

        it('should fail with 403 if trying to review a lab on a booking that is not completed', async () => {
            const response = await request(app)
                .post('/api/feedbacks')
                .send({
                    targetType: 'lab',
                    targetId: labId,
                    rating: 3,
                    comment: 'Not completed yet',
                    booking: pendingBookingId
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('completed booking that involved them');
        });

        it('should successfully submit feedback for a product on a delivered order', async () => {
            const response = await request(app)
                .post('/api/feedbacks')
                .send({
                    targetType: 'product',
                    targetId: productId,
                    rating: 4,
                    comment: 'Good thermometer',
                    order: deliveredOrderId
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/feedbacks/:targetType/:targetId', () => {
        it('should fetch public feedbacks for a specific target with pagination data', async () => {
            // Seed a feedback
            await Feedback.create({
                patient: patientId, targetType: 'lab', targetId: labId, rating: 4, booking: completedBookingId
            });

            const response = await request(app).get(`/api/feedbacks/lab/${labId}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.feedbacks.length).toBe(1);
            expect(response.body.data.pagination.total).toBe(1);
        });
    });

    describe('GET /api/feedbacks/my-reviews', () => {
        it('should fetch reviews made by the authenticated patient', async () => {
             // Seed a feedback
             await Feedback.create({
                patient: patientId, targetType: 'lab', targetId: labId, rating: 4, booking: completedBookingId
            });

            const response = await request(app).get('/api/feedbacks/my-reviews');
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.feedbacks.length).toBe(1);
            // It manually populates target from model lookup
            expect(response.body.data.feedbacks[0].target.labName).toBeDefined();
        });
    });
});
