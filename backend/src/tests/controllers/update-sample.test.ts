import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, validPatientData, validLabData, validLabLicense } from '../helpers';
import Phlebotomist from '../../models/Phlebotomist';
import Booking from '../../models/Booking';
import Patient from '../../models/Patient';
import Lab from '../../models/Lab';
import Test from '../../models/Test';

jest.mock('../../controllers/notification.controller', () => ({
    createNotification: jest.fn(),
}));

import { authenticateToken, authorizeUserType } from '../../middleware/auth.middleware';
jest.mock('../../middleware/auth.middleware', () => ({
    authenticateToken: jest.fn(),
    authorizeUserType: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

import phlebotomistRoutes from '../../routes/phlebotomist.routes';

const app = createTestApp(phlebotomistRoutes, '/api/phlebotomists');

describe('UC-13: Update Sample Details', () => {
    let phlebotomistId: string;
    let patientId: string;
    let labId: string;
    let testId: string;
    let bookingId: string;

    beforeEach(async () => {
        // Patient
        const patient = new Patient(validPatientData);
        await patient.save();
        patientId = patient._id.toString();

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
                data: Buffer.from('fake-license-data'),
                contentType: 'application/pdf',
                filename: 'license.pdf',
                size: 1024
            }
        });
        await phleb.save();
        phlebotomistId = phleb._id.toString();

        // Test
        const testObj = new Test({
            name: 'Sample Testing Details Check',
            description: 'Checking sample details specifically',
            basePrice: 500,
            category: 'Blood Test',
            reportDeliveryTime: '24 hours',
            preparationInstructions: 'Fast for 12 hours'
        });
        await testObj.save();
        testId = testObj._id.toString();

        // Booking
        const booking = new Booking({
            patient: patientId, lab: labId, phlebotomist: phlebotomistId,
            tests: [testId],
            bookingDate: new Date(),
            preferredTimeSlot: '09:00 AM',
            status: 'in-progress',
            totalAmount: 500, collectionType: 'home', collectionAddress: '123 Fake Street'
        });
        await booking.save();
        bookingId = booking._id.toString();

        (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
            req.user = { id: phlebotomistId, userType: 'phlebotomist' };
            next();
        });
    });

    describe('PUT /api/phlebotomists/bookings/:id/status (Sample Mode)', () => {
        it('should successfully store sample metadata context (collectedAt, sampleId, notes) on the booking record', async () => {
            const specificDate = new Date('2026-05-01T12:00:00Z');
            
            const response = await request(app)
                .put(`/api/phlebotomists/bookings/${bookingId}/status`)
                .send({
                    status: 'sample_collected',
                    notes: 'Patient was well hydrated.',
                    sampleDetails: {
                        sampleId: 'BLOOD-001-XYZ',
                        collectedAt: specificDate
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Fetch natively to ensure it persisted structurally correctly
            const dbCheck = await Booking.findById(bookingId);
            expect(dbCheck?.status).toBe('sample_collected');
            expect(dbCheck?.sampleCollection).toBeDefined();
            expect(dbCheck?.sampleCollection?.sampleId).toBe('BLOOD-001-XYZ');
            expect(dbCheck?.sampleCollection?.notes).toBe('Patient was well hydrated.');
            expect(dbCheck?.sampleCollection?.collectedBy?.toString()).toBe(phlebotomistId);
            expect(dbCheck?.sampleCollection?.collectedAt).toStrictEqual(specificDate);
        });

        it('should gracefully fallback collectedAt dynamically to the current time if omitted from payload', async () => {
            const response = await request(app)
                .put(`/api/phlebotomists/bookings/${bookingId}/status`)
                .send({
                    status: 'sample_collected',
                    sampleDetails: {
                        sampleId: 'DYNAMIC-TIME'
                    }
                });

            expect(response.status).toBe(200);
            const dbCheck = await Booking.findById(bookingId);
            expect(dbCheck?.sampleCollection?.collectedAt).toBeDefined();
            // We just ensure it's a date within the last minute roughly (or just check existence dynamically)
            const diff = new Date().getTime() - new Date(dbCheck?.sampleCollection?.collectedAt as any).getTime();
            expect(diff).toBeLessThan(5000); // executed within last 5 seconds
        });
        
        it('should reject requests that try to bypass phlebotomist assignment security layers', async () => {
            // Mock authentication to impersonate a different phlebotomist altogether
            (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
                req.user = { id: new mongoose.Types.ObjectId().toString(), userType: 'phlebotomist' }; // Random intruder
                next();
            });

            const response = await request(app)
                .put(`/api/phlebotomists/bookings/${bookingId}/status`)
                .send({
                    status: 'sample_collected',
                    sampleDetails: { sampleId: 'INTRUDER-123' }
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('not assigned to this booking');
            
            // Check db to ensure nothing changed
            const dbCheck = await Booking.findById(bookingId);
            expect(dbCheck?.status).toBe('in-progress');
            expect(dbCheck?.sampleCollection?.sampleId).toBeUndefined();
        });
    });
});
