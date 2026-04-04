import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, validPatientData, validLabData, validLabLicense } from '../helpers';
import Phlebotomist from '../../models/Phlebotomist';
import Booking from '../../models/Booking';
import Patient from '../../models/Patient';
import Lab from '../../models/Lab';
import Test from '../../models/Test';

// Mock Notification Module since updateBookingStatus triggers it
jest.mock('../../controllers/notification.controller', () => ({
    createNotification: jest.fn(),
}));

import { authenticateToken, authorizeUserType } from '../../middleware/auth.middleware';

// Mock authentication router layers
jest.mock('../../middleware/auth.middleware', () => ({
    authenticateToken: jest.fn(),
    authorizeUserType: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

import phlebotomistRoutes from '../../routes/phlebotomist.routes';

const app = createTestApp(phlebotomistRoutes, '/api/phlebotomists');

describe('UC-12: Manage Dashboard (Phlebotomist)', () => {
    let phlebotomistId: string;
    let patientId: string;
    let labId: string;
    let testId: string;
    let bookingPendingId: string;
    let bookingInProgressId: string;
    let today: Date;
    let tomorrow: Date;

    beforeEach(async () => {
        // Date math to match controller logic
        today = new Date();
        today.setHours(0, 0, 0, 0);
        tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Lab
        const lab = new Lab({ ...validLabData, license: validLabLicense });
        await lab.save();
        labId = lab._id.toString();

        // Phlebotomist
        const phleb = new Phlebotomist({
            fullName: 'Jane Phleb',
            email: 'jane.phleb@example.com',
            password: 'Password123!',
            phone: '0987654321',
            qualification: 'BSc Nursing',
            yearsOfExperience: 5,
            isAvailable: true,
            assignedLab: labId,
            trafficLicense: {
                data: Buffer.from('license data'),
                contentType: 'application/pdf',
                filename: 'jane_license.pdf',
                size: 1024
            }
        });
        await phleb.save();
        phlebotomistId = phleb._id.toString();

        // Patient
        const patient = new Patient(validPatientData);
        await patient.save();
        patientId = patient._id.toString();

        // Create a Test to register the model and have a valid ID
        const testObj = new Test({
            name: 'Blood Sugar Fasting',
            description: 'Measures blood glucose after fasting',
            basePrice: 500,
            category: 'Blood Test',
            reportDeliveryTime: '24 hours',
            preparationInstructions: 'Fast for 12 hours'
        });
        await testObj.save();
        testId = testObj._id.toString();

        // Booking 1 - Pending today
        const bp = new Booking({
            patient: patientId, lab: labId, phlebotomist: phlebotomistId,
            tests: [testId],
            bookingDate: today,
            preferredTimeSlot: '09:00 AM',
            status: 'pending',
            totalAmount: 1000, collectionType: 'home', collectionAddress: '123 Fake'
        });
        await bp.save();
        bookingPendingId = bp._id.toString();

        // Booking 2 - In progress today
        const bip = new Booking({
            patient: patientId, lab: labId, phlebotomist: phlebotomistId,
            tests: [testId],
            bookingDate: today,
            preferredTimeSlot: '11:00 AM',
            status: 'in-progress',
            totalAmount: 1000, collectionType: 'home', collectionAddress: '123 Fake'
        });
        await bip.save();
        bookingInProgressId = bip._id.toString();

        // Authenticate
        (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
            req.user = { id: phlebotomistId, userType: 'phlebotomist' };
            next();
        });
    });

    describe('GET /api/phlebotomists/dashboard', () => {
        it('should successfully fetch the phlebotomist dashboard stats and arrays', async () => {
            const response = await request(app).get('/api/phlebotomists/dashboard');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.fullName).toBe('Jane Phleb');
            expect(response.body.data.stats.todaysCollections).toBe(2);
            expect(response.body.data.stats.inProgress).toBe(1);
            expect(response.body.data.stats.remaining).toBe(1); // the pending one
            expect(response.body.data.schedule.length).toBe(2);
        });
    });

    describe('PUT /api/phlebotomists/bookings/:id/status', () => {
        it('should successfully update a pending booking to in-progress', async () => {
            const response = await request(app).put(`/api/phlebotomists/bookings/${bookingPendingId}/status`).send({
                status: 'in-progress'
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('in-progress');
            
            const dbCheck = await Booking.findById(bookingPendingId);
            expect(dbCheck?.status).toBe('in-progress');
        });

        it('should successfully record sample collection metadata when updating to sample_collected', async () => {
            const response = await request(app).put(`/api/phlebotomists/bookings/${bookingInProgressId}/status`).send({
                status: 'sample_collected',
                notes: 'Patient was fasting',
                sampleDetails: {
                    sampleId: 'SMP-1234'
                }
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            const dbCheck = await Booking.findById(bookingInProgressId);
            expect(dbCheck?.status).toBe('sample_collected');
            expect(dbCheck?.sampleCollection?.sampleId).toBe('SMP-1234');
            expect(dbCheck?.sampleCollection?.notes).toBe('Patient was fasting');
        });

        it('should fail with 400 if trying to submit an invalid status role access', async () => {
            const response = await request(app).put(`/api/phlebotomists/bookings/${bookingPendingId}/status`).send({
                status: 'confirmed' // Phlebotomist shouldn't manually set confirmed, logic says in-progress, sample_collected, completed
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Invalid status');
        });
    });

    describe('PUT /api/phlebotomists/availability', () => {
        it('should toggle phlebotomist availability to false', async () => {
            const response = await request(app).put('/api/phlebotomists/availability').send({
                availability: false
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            const dbCheck = await Phlebotomist.findById(phlebotomistId);
            expect(dbCheck?.isAvailable).toBe(false);
        });

        it('should fail with 400 if boolean parameter is not provided', async () => {
            const response = await request(app).put('/api/phlebotomists/availability').send({
                availability: 'yes' // Invalid type
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('must be a boolean');
        });
    });

    describe('GET /api/phlebotomists/metrics', () => {
        it('should retrieve phlebotomist performance stats', async () => {
            const response = await request(app).get('/api/phlebotomists/metrics');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totalCompleted).toBeDefined();
            expect(response.body.data.averageCompletionTime).toContain('hours');
        });
    });

    describe('GET /api/phlebotomists/traffic-license', () => {
        it('should return the traffic license buffer with correct headers', async () => {
            const response = await request(app).get('/api/phlebotomists/traffic-license');

            expect(response.status).toBe(200);
            expect(response.header['content-type']).toBe('application/pdf');
            expect(response.body).toBeInstanceOf(Buffer);
            expect(response.body.toString()).toBe('license data');
        });
    });
});
