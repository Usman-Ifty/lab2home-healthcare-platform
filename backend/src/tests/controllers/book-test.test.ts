import request from 'supertest';
import mongoose from 'mongoose';
import {
    createTestApp,
    validPatientData,
    validLabData,
    validLabLicense,
    sampleMedicalTests,
    mockEmailService,
    mockStripeService,
    mockNotificationController,
    mockAuthMiddleware,
} from '../helpers';
import Patient from '../../models/Patient';
import Lab from '../../models/Lab';
import Test from '../../models/Test';

// Activate mocks — MUST be called before route imports
mockStripeService();
mockEmailService();
mockNotificationController();
mockAuthMiddleware('patient');

import bookingRoutes from '../../routes/booking.routes';

const app = createTestApp(bookingRoutes, '/api/bookings');

describe('UC-5: Book Tests (createBooking)', () => {
    let patientId: string;
    let labId: string;
    let labNoConfigId: string;
    let testCbcId: string;
    let testLftId: string;
    let testRandomId: string;

    beforeEach(async () => {
        // ── Patient ──
        const patient = new Patient({
            ...validPatientData,
            email: 'patient.booking@example.com',
            isVerified: true,
            isActive: true,
        });
        await patient.save();
        patientId = patient._id.toString();

        // ── Medical Tests ──
        const [cbcData, lftData, randomData] = sampleMedicalTests;

        const cbc = new Test(cbcData);
        await cbc.save();
        testCbcId = cbc._id.toString();

        const lft = new Test(lftData);
        await lft.save();
        testLftId = lft._id.toString();

        const randomTest = new Test(randomData);
        await randomTest.save();
        testRandomId = randomTest._id.toString();

        // ── Configured Lab ──
        const lab = new Lab({
            ...validLabData,
            email: 'lab.ready@example.com',
            labName: 'Ready Diagnostics',
            isVerified: true,
            isActive: true,
            hasConfiguredTests: true,
            availableTests: [cbc._id, lft._id],
            license: validLabLicense,
        });
        await lab.save();
        labId = lab._id.toString();

        // ── Unconfigured Lab ──
        const labNoConfig = new Lab({
            ...validLabData,
            email: 'lab.notready@example.com',
            labName: 'New Diagnostics',
            phone: '1111111111',
            isVerified: true,
            isActive: true,
            hasConfiguredTests: false,
            availableTests: [],
            license: validLabLicense,
        });
        await labNoConfig.save();
        labNoConfigId = labNoConfig._id.toString();
    });

    it('should successfully create a home collection booking with valid data', async () => {
        const response = await request(app).post('/api/bookings').send({
            patient: patientId, lab: labId, tests: [testCbcId, testLftId],
            bookingDate: '2026-10-15', preferredTimeSlot: '10:00 AM - 11:00 AM',
            collectionType: 'home', collectionAddress: 'Patient Home Address 404', paymentMethod: 'cash',
        });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.booking.totalAmount).toBe(150);
        expect(response.body.data.booking.collectionAddress).toBe('Patient Home Address 404');
    });

    it('should successfully create a lab collection booking without needing an address', async () => {
        const response = await request(app).post('/api/bookings').send({
            patient: patientId, lab: labId, tests: [testCbcId],
            bookingDate: '2026-10-16', preferredTimeSlot: '02:00 PM - 03:00 PM',
            collectionType: 'lab', paymentMethod: 'cash',
        });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.booking.collectionType).toBe('lab');
    });

    it('should fail if missing required fields (e.g., bookingDate)', async () => {
        const response = await request(app).post('/api/bookings').send({
            patient: patientId, lab: labId, tests: [testCbcId],
            preferredTimeSlot: '02:00 PM - 03:00 PM', collectionType: 'lab',
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('required');
    });

    it('should fail if home collection is selected but address is missing', async () => {
        const response = await request(app).post('/api/bookings').send({
            patient: patientId, lab: labId, tests: [testCbcId],
            bookingDate: '2026-10-16', preferredTimeSlot: '02:00 PM - 03:00 PM',
            collectionType: 'home',
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Collection address is required for home collection');
    });

    it('should fail if a requested test does not exist in the database', async () => {
        const badTestId = new mongoose.Types.ObjectId().toString();
        const response = await request(app).post('/api/bookings').send({
            patient: patientId, lab: labId, tests: [testCbcId, badTestId],
            bookingDate: '2026-10-16', preferredTimeSlot: '11:00 AM - 12:00 PM', collectionType: 'lab',
        });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('One or more tests not found');
    });

    it('should fail if the lab does not exist', async () => {
        const badLabId = new mongoose.Types.ObjectId().toString();
        const response = await request(app).post('/api/bookings').send({
            patient: patientId, lab: badLabId, tests: [testCbcId],
            bookingDate: '2026-10-16', preferredTimeSlot: '11:00 AM - 12:00 PM', collectionType: 'lab',
        });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Lab not found');
    });

    it('should fail if the lab has not configured any tests', async () => {
        const response = await request(app).post('/api/bookings').send({
            patient: patientId, lab: labNoConfigId, tests: [testCbcId],
            bookingDate: '2026-10-16', preferredTimeSlot: '11:00 AM - 12:00 PM', collectionType: 'lab',
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('not configured their available tests');
    });

    it('should fail if the lab does not offer one of the requested tests', async () => {
        const response = await request(app).post('/api/bookings').send({
            patient: patientId, lab: labId, tests: [testCbcId, testRandomId],
            bookingDate: '2026-10-16', preferredTimeSlot: '11:00 AM - 12:00 PM', collectionType: 'lab',
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('does not offer one or more of the selected tests');
    });

    it('should fail if the patient does not exist', async () => {
        const badPatientId = new mongoose.Types.ObjectId().toString();
        const response = await request(app).post('/api/bookings').send({
            patient: badPatientId, lab: labId, tests: [testCbcId],
            bookingDate: '2026-10-16', preferredTimeSlot: '11:00 AM - 12:00 PM', collectionType: 'lab',
        });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Patient not found');
    });
});
