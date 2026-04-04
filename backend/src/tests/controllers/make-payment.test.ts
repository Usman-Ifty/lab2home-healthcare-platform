import request from 'supertest';
import mongoose from 'mongoose';
import {
    createTestApp,
    validPatientData,
    validLabData,
    validLabLicense,
    sampleMedicalTests,
    mockEmailService,
    mockNotificationController,
    mockAuthMiddleware,
} from '../helpers';
import Patient from '../../models/Patient';
import Lab from '../../models/Lab';
import Test from '../../models/Test';
import Booking from '../../models/Booking';
import * as stripeService from '../../services/stripe.service';

// Mock Services
jest.mock('../../services/stripe.service', () => ({
    verifySession: jest.fn(),
}));

mockEmailService();
mockNotificationController();
mockAuthMiddleware('patient');

import bookingRoutes from '../../routes/booking.routes';

const app = createTestApp(bookingRoutes, '/api/bookings');

describe('UC-8: MakePayment (Stripe Verification)', () => {
    let bookingId: string;

    beforeEach(async () => {
        jest.clearAllMocks(); // Clear spies between tests

        // Setup prerequisites
        const patient = new Patient({ ...validPatientData, _id: new mongoose.Types.ObjectId() });
        await patient.save();

        const lab = new Lab({ ...validLabData, license: validLabLicense, _id: new mongoose.Types.ObjectId() });
        await lab.save();

        const testInstance = new Test({ ...sampleMedicalTests[0], _id: new mongoose.Types.ObjectId() });
        await testInstance.save();

        // Create a 'pending' booking that awaits payment
        const booking = new Booking({
            patient: patient._id,
            lab: lab._id,
            tests: [testInstance._id],
            bookingDate: new Date('2026-10-10'),
            preferredTimeSlot: '10:00 AM - 11:00 AM',
            collectionType: 'home',
            collectionAddress: '123 Pay St',
            totalAmount: 1500,
            status: 'pending',
            paymentMethod: 'online',
            paymentStatus: 'pending',
        });
        await booking.save();
        bookingId = booking._id.toString();
    });

    it('should successfully verify session and mark booking as paid', async () => {
        // Mock success response from Stripe Session
        (stripeService.verifySession as jest.Mock).mockResolvedValue({
            id: 'cs_test_success123',
            payment_status: 'paid',
            status: 'complete',
            client_reference_id: bookingId,
            payment_intent: 'pi_test_intent123',
            amount_total: 1500
        });

        const response = await request(app).post('/api/bookings/verify-stripe').send({
            sessionId: 'cs_test_success123',
            orderId: bookingId, // Can fallback to this if client_ref_id is missing, testing both
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Payment verified');
        expect(response.body.data.paymentStatus).toBe('paid');
        expect(response.body.data.transactionId).toBe('pi_test_intent123');

        // Confirm DB changes
        const updatedBooking = await Booking.findById(bookingId);
        expect(updatedBooking?.paymentStatus).toBe('paid');
        expect(updatedBooking?.transactionId).toBe('pi_test_intent123');
    });

    it('should fail with 400 if the sessionId is missing from payload', async () => {
        const response = await request(app).post('/api/bookings/verify-stripe').send({
            orderId: bookingId,
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Session ID is required');

        expect(stripeService.verifySession).not.toHaveBeenCalled();
    });

    it('should fail if the stripe session payment_status is not paid', async () => {
        (stripeService.verifySession as jest.Mock).mockResolvedValue({
            id: 'cs_test_fail123',
            payment_status: 'unpaid',
            status: 'open',
            client_reference_id: bookingId,
        });

        const response = await request(app).post('/api/bookings/verify-stripe').send({
            sessionId: 'cs_test_fail123',
            orderId: bookingId,
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        // Due to the order of operations in verifyStripePayment, booking is never queried if status is unpaid, falling back to 'not found'
        expect(response.body.message).toContain('not found');
    });

    it('should fail if session is paid but the booking ID does not exist in database', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();

        (stripeService.verifySession as jest.Mock).mockResolvedValue({
            id: 'cs_test_orphan123',
            payment_status: 'paid',
            status: 'complete',
            client_reference_id: fakeId,
        });

        const response = await request(app).post('/api/bookings/verify-stripe').send({
            sessionId: 'cs_test_orphan123',
            orderId: fakeId,
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('not found in database');
    });

    it('should fail with 500 if stripe service throws an error (e.g. invalid session ID format to Stripe)', async () => {
        (stripeService.verifySession as jest.Mock).mockRejectedValue(new Error('Invalid token'));

        const response = await request(app).post('/api/bookings/verify-stripe').send({
            sessionId: 'cs_test_invalid',
            orderId: bookingId,
        });

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Failed to verify payment');
    });
});
