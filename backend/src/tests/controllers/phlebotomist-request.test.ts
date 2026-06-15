import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, validPatientData, validLabData, validLabLicense } from '../helpers';
import Booking from '../../models/Booking';
import Patient from '../../models/Patient';
import Lab from '../../models/Lab';
import Phlebotomist from '../../models/Phlebotomist';
import Test from '../../models/Test';

// Mock Email and Notification services
jest.mock('../../services/email.service', () => ({
    sendPhlebotomistRequestEmail: jest.fn(),
}));
jest.mock('../../controllers/notification.controller', () => ({
    createNotification: jest.fn(),
}));

// Mock authenticateToken middleware
import { authenticateToken } from '../../middleware/auth.middleware';
jest.mock('../../middleware/auth.middleware', () => ({
    authenticateToken: jest.fn(),
    authorizeUserType: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

import phlebotomistRequestRoutes from '../../routes/phlebotomistRequest.routes';

const app = createTestApp(phlebotomistRequestRoutes, '/api/phlebotomist-requests');

describe('Phlebotomist Request Restrictions', () => {
    let labId: string;
    let patientId: string;
    let phlebId: string;
    let testId: string;
    let homeBookingId: string;
    let labBookingId: string;

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
            fullName: 'Request Phleb',
            email: 'req.phleb@example.com',
            password: 'Password123!',
            phone: '1122334455',
            qualification: 'BSc Nursing',
            yearsOfExperience: 2,
            isAvailable: true,
            isActive: true,
            assignedLab: labId,
        });
        await phleb.save();
        phlebId = phleb._id.toString();

        // Test
        const testObj = new Test({
            name: 'Request Test',
            description: 'A test for requests',
            basePrice: 600,
            category: 'Blood Test',
            reportDeliveryTime: '12 hours',
        });
        await testObj.save();
        testId = testObj._id.toString();

        // Home Booking
        const homeBooking = await Booking.create({
            patient: patientId,
            lab: labId,
            tests: [testId],
            bookingDate: new Date(),
            preferredTimeSlot: '10:00 AM',
            status: 'pending',
            totalAmount: 600,
            collectionType: 'home',
            collectionAddress: 'Patient Home Address'
        });
        homeBookingId = homeBooking._id.toString();

        // Lab Booking
        const labBooking = await Booking.create({
            patient: patientId,
            lab: labId,
            tests: [testId],
            bookingDate: new Date(),
            preferredTimeSlot: '11:00 AM',
            status: 'pending',
            totalAmount: 600,
            collectionType: 'lab'
        });
        labBookingId = labBooking._id.toString();

        // Authenticate as the Lab
        (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
            req.user = { id: labId, userType: 'lab' };
            next();
        });
    });

    describe('GET /api/phlebotomist-requests/available-phlebotomists/:bookingId', () => {
        it('should return 200 for a home collection booking', async () => {
            const response = await request(app)
                .get(`/api/phlebotomist-requests/available-phlebotomists/${homeBookingId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(1);
            expect(response.body.data[0]._id).toBe(phlebId);
        });

        it('should return 400 for a lab collection booking', async () => {
            const response = await request(app)
                .get(`/api/phlebotomist-requests/available-phlebotomists/${labBookingId}`);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Phlebotomists can only be assigned to home collection bookings');
        });
    });

    describe('POST /api/phlebotomist-requests/send', () => {
        it('should allow sending request for a home collection booking', async () => {
            const response = await request(app)
                .post('/api/phlebotomist-requests/send')
                .send({ bookingId: homeBookingId, phlebotomistId: phlebId });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('should return 400 when sending request for a lab collection booking', async () => {
            const response = await request(app)
                .post('/api/phlebotomist-requests/send')
                .send({ bookingId: labBookingId, phlebotomistId: phlebId });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Phlebotomists can only be assigned to home collection bookings');
        });
    });
});
