import request from 'supertest';
import mongoose from 'mongoose';
import {
    createTestApp,
    validPatientData,
    validLabData,
    validLabLicense,
    sampleMedicalTests,
    mockStripeService,
} from '../helpers';
import Patient from '../../models/Patient';
import Lab from '../../models/Lab';
import Test from '../../models/Test';
import Booking from '../../models/Booking';

// We need to test authorization logic for this route
import { protect } from '../../middleware/auth.middleware';

// We'll use a functional mockup of the middleware to inject specific user states instead of 
// the global mockAuthMiddleware helper, because we need to test unauthorized access.
jest.mock('../../middleware/auth.middleware', () => ({
    protect: jest.fn(),
}));

mockStripeService();

import bookingRoutes from '../../routes/booking.routes';

const app = createTestApp(bookingRoutes, '/api/bookings');

describe('UC-9: View Dashboard (getPatientBookings)', () => {
    let patientAId: string;
    let patientBId: string;

    beforeEach(async () => {
        // Create Patient A
        const patientA = new Patient({
            ...validPatientData,
            email: 'patientA@example.com',
        });
        await patientA.save();
        patientAId = patientA._id.toString();

        // Create Patient B (Unauthorized user for Patient A's dashboard)
        const patientB = new Patient({
            ...validPatientData,
            email: 'patientB@example.com',
        });
        await patientB.save();
        patientBId = patientB._id.toString();

        // Create Base Data
        const lab = new Lab({ ...validLabData, license: validLabLicense });
        await lab.save();

        const testInstance = new Test(sampleMedicalTests[0]);
        await testInstance.save();

        // Seed Bookings for Patient A
        await Booking.create([
            {
                patient: patientA._id,
                lab: lab._id,
                tests: [testInstance._id],
                bookingDate: new Date('2026-10-15'),
                preferredTimeSlot: '10:00 AM',
                collectionType: 'home',
                collectionAddress: '123 Fake Street',
                totalAmount: 1500,
                status: 'pending'
            },
            {
                patient: patientA._id,
                lab: lab._id,
                tests: [testInstance._id],
                bookingDate: new Date('2026-10-16'),
                preferredTimeSlot: '11:00 AM',
                collectionType: 'lab',
                totalAmount: 1500,
                status: 'completed'
            }
        ]);
        
        // Seed Booking for Patient B
        await Booking.create({
            patient: patientB._id,
            lab: lab._id,
            tests: [testInstance._id],
            bookingDate: new Date('2026-11-20'),
            preferredTimeSlot: '01:00 PM',
            collectionType: 'home',
            collectionAddress: '456 Another Street',
            totalAmount: 1500,
            status: 'pending'
        });
    });

    it('should successfully fetch all bookings for the authenticated patient', async () => {
        // Authenticate as Patient A
        (protect as jest.Mock).mockImplementation((req, res, next) => {
            req.user = { id: patientAId, userType: 'patient' };
            next();
        });

        const response = await request(app).get(`/api/bookings/patient/${patientAId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.count).toBe(2);
        
        // Ensure only Patient A's bookings are returned
        const patientIds = response.body.data.map((b: any) => b.patient.toString() || b.patient._id?.toString() || b.patient);
        expect(patientIds.every((id: string) => id === patientAId)).toBe(true);

        // Ensure population worked
        expect(response.body.data[0].lab.labName).toBeDefined();
        expect(response.body.data[0].tests[0].name).toBeDefined();
    });

    it('should successfully filter bookings by status query parameter', async () => {
        // Authenticate as Patient A
        (protect as jest.Mock).mockImplementation((req, res, next) => {
            req.user = { id: patientAId, userType: 'patient' };
            next();
        });

        const response = await request(app).get(`/api/bookings/patient/${patientAId}?status=completed`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.count).toBe(1);
        expect(response.body.data[0].status).toBe('completed');
    });

    it('should fail with 403 if user tries to access another patient dashboard', async () => {
        // Authenticate as Patient B
        (protect as jest.Mock).mockImplementation((req, res, next) => {
            req.user = { id: patientBId, userType: 'patient' };
            next();
        });

        // Patient B tries to view Patient A's dashboard
        const response = await request(app).get(`/api/bookings/patient/${patientAId}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('You are not authorized to access these bookings');
    });

    it('should fail with 403 if access token belongs to a different role (e.g. phlebotomist)', async () => {
        // Authenticate as Phlebotomist
        (protect as jest.Mock).mockImplementation((req, res, next) => {
            req.user = { id: new mongoose.Types.ObjectId().toString(), userType: 'phlebotomist' };
            next();
        });

        const response = await request(app).get(`/api/bookings/patient/${patientAId}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('not authorized');
    });
});
