import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, validPatientData, validLabData, validLabLicense } from '../helpers';
import { mockStripeService } from '../helpers/mocks';
import Booking from '../../models/Booking';
import Patient from '../../models/Patient';
import Lab from '../../models/Lab';
import Phlebotomist from '../../models/Phlebotomist';
import Test from '../../models/Test';

// Mock Stripe (imported by booking controller)
mockStripeService();

// Mock notification + email services used by updateBookingStatus
jest.mock('../../services/email.service', () => ({
    sendBookingStatusUpdateEmail: jest.fn(),
    sendNewBookingEmail: jest.fn(),
    sendReportUploadedEmail: jest.fn(),
}));
jest.mock('../../../src/controllers/notification.controller', () => ({
    createNotification: jest.fn(),
}));

import { protect } from '../../middleware/auth.middleware';
jest.mock('../../middleware/auth.middleware', () => ({
    protect: jest.fn(),
    restrictTo: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

import bookingRoutes from '../../routes/booking.routes';

const app = createTestApp(bookingRoutes, '/api/bookings');

describe('UC-14: Manage Appointments (Lab Side)', () => {
    let labId: string;
    let patientId: string;
    let phlebId: string;
    let testId: string;
    let pendingBookingId: string;
    let confirmedBookingId: string;
    let completedBookingId: string;

    beforeEach(async () => {
        // Lab
        const lab = new Lab({ ...validLabData, license: validLabLicense });
        await lab.save();
        labId = lab._id.toString();

        // Patient
        const patient = new Patient(validPatientData);
        await patient.save();
        patientId = patient._id.toString();

        // Phlebotomist
        const phleb = new Phlebotomist({
            fullName: 'Field Phleb',
            email: 'field.phleb@example.com',
            password: 'Password123!',
            phone: '1234567890',
            qualification: 'BSc Nursing',
            yearsOfExperience: 3,
            assignedLab: labId,
            trafficLicense: {
                data: Buffer.from('fake'),
                contentType: 'application/pdf',
                filename: 'lic.pdf',
                size: 512
            }
        });
        await phleb.save();
        phlebId = phleb._id.toString();

        // Test
        const testObj = new Test({
            name: 'Manage Appointments Test',
            description: 'A test for manage appointments',
            basePrice: 800,
            category: 'Blood Test',
            reportDeliveryTime: '24 hours',
        });
        await testObj.save();
        testId = testObj._id.toString();

        // Pending Booking
        const pending = await Booking.create({
            patient: patientId, lab: labId,
            tests: [testId],
            bookingDate: new Date(),
            preferredTimeSlot: '09:00 AM',
            status: 'pending',
            totalAmount: 800, collectionType: 'home', collectionAddress: '123 Lab St'
        });
        pendingBookingId = pending._id.toString();

        // Confirmed Booking
        const confirmed = await Booking.create({
            patient: patientId, lab: labId, phlebotomist: phlebId,
            tests: [testId],
            bookingDate: new Date(),
            preferredTimeSlot: '11:00 AM',
            status: 'confirmed',
            totalAmount: 800, collectionType: 'lab'
        });
        confirmedBookingId = confirmed._id.toString();

        // Completed Booking
        const completed = await Booking.create({
            patient: patientId, lab: labId,
            tests: [testId],
            bookingDate: new Date(),
            preferredTimeSlot: '02:00 PM',
            status: 'completed',
            totalAmount: 800, collectionType: 'lab'
        });
        completedBookingId = completed._id.toString();

        // Authenticate as lab
        (protect as jest.Mock).mockImplementation((req, res, next) => {
            req.user = { id: labId, userType: 'lab' };
            next();
        });
    });

    // ─── GET LAB BOOKINGS ────────────────────────────────────────
    describe('GET /api/bookings/lab/:labId', () => {
        it('should fetch all bookings belonging to the authenticated lab', async () => {
            const response = await request(app).get(`/api/bookings/lab/${labId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(3);
            expect(response.body.data.length).toBe(3);
        });

        it('should filter bookings by status query parameter', async () => {
            const response = await request(app).get(`/api/bookings/lab/${labId}?status=pending`);

            expect(response.status).toBe(200);
            expect(response.body.count).toBe(1);
            expect(response.body.data[0].status).toBe('pending');
        });

        it('should return 403 if a different lab tries to view these bookings', async () => {
            const otherLabId = new mongoose.Types.ObjectId().toString();
            const response = await request(app).get(`/api/bookings/lab/${otherLabId}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('not authorized');
        });
    });

    // ─── UPDATE BOOKING STATUS (Lab-side confirm + assign) ──────
    describe('PUT /api/bookings/:id/status', () => {
        it('should confirm a pending booking and assign a phlebotomist', async () => {
            const response = await request(app)
                .put(`/api/bookings/${pendingBookingId}/status`)
                .send({ status: 'confirmed', phlebotomist: phlebId });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('confirmed');

            const dbCheck = await Booking.findById(pendingBookingId);
            expect(dbCheck?.status).toBe('confirmed');
            expect(dbCheck?.phlebotomist?.toString()).toBe(phlebId);
        });

        it('should return 400 if status field is missing from the request body', async () => {
            const response = await request(app)
                .put(`/api/bookings/${pendingBookingId}/status`)
                .send({}); // no status

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Status is required');
        });

        it('should return 404 for a non-existent booking ID', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const response = await request(app)
                .put(`/api/bookings/${fakeId}/status`)
                .send({ status: 'confirmed' });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Booking not found');
        });
    });

    // ─── CANCEL BOOKING ─────────────────────────────────────────
    describe('DELETE /api/bookings/:id', () => {
        it('should cancel a pending booking with a reason', async () => {
            const response = await request(app)
                .delete(`/api/bookings/${pendingBookingId}`)
                .send({ cancelReason: 'Patient requested cancellation' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('cancelled');

            const dbCheck = await Booking.findById(pendingBookingId);
            expect(dbCheck?.status).toBe('cancelled');
            expect(dbCheck?.cancelReason).toBe('Patient requested cancellation');
        });

        it('should return 400 if trying to cancel an already completed booking', async () => {
            const response = await request(app)
                .delete(`/api/bookings/${completedBookingId}`)
                .send({ cancelReason: 'Too late' });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Cannot cancel a completed booking');
        });

        it('should return 400 if trying to cancel an already cancelled booking', async () => {
            // Cancel once
            await request(app).delete(`/api/bookings/${pendingBookingId}`).send({ cancelReason: 'First cancel' });

            // Try again
            const response = await request(app)
                .delete(`/api/bookings/${pendingBookingId}`)
                .send({ cancelReason: 'Second cancel' });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('already cancelled');
        });
    });
});
