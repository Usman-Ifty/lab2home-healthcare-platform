import request from 'supertest';
import mongoose from 'mongoose';
import {
    createTestApp,
    validPatientData,
    validLabData,
    validLabLicense,
    sampleMedicalTests,
    mockStripeService,
    mockEmailService,
    mockNotificationController,
    mockAuthMiddleware,
} from '../helpers';
import Patient from '../../models/Patient';
import Lab from '../../models/Lab';
import Test from '../../models/Test';
import Booking from '../../models/Booking';

// Activate mocks before route imports
mockStripeService();
mockEmailService();
mockNotificationController();
mockAuthMiddleware('lab');

// Mock conversation lock logic (requires server import)
jest.mock('../../server', () => ({
    getIO: jest.fn().mockReturnValue(null),
}));

jest.mock('../../models/Conversation', () => ({
    __esModule: true,
    default: { find: jest.fn().mockResolvedValue([]) },
}));

import bookingRoutes from '../../routes/booking.routes';

const app = createTestApp(bookingRoutes, '/api/bookings');

describe('UC-7: Track Reports', () => {
    let patientId: string;
    let labId: string;
    let testCbcId: string;
    let bookingWithReportId: string;
    let bookingWithoutReportId: string;

    beforeEach(async () => {
        // ── Patient ──
        const patient = new Patient({
            ...validPatientData,
            email: 'report.patient@example.com',
            isVerified: true,
            isActive: true,
        });
        await patient.save();
        patientId = patient._id.toString();

        // ── Medical Test ──
        const cbc = new Test(sampleMedicalTests[0]);
        await cbc.save();
        testCbcId = cbc._id.toString();

        // ── Lab ──
        const lab = new Lab({
            ...validLabData,
            email: 'report.lab@example.com',
            labName: 'Report Lab',
            isVerified: true,
            isActive: true,
            hasConfiguredTests: true,
            availableTests: [cbc._id],
            license: validLabLicense,
        });
        await lab.save();
        labId = lab._id.toString();

        // ── Booking WITH report already uploaded ──
        const bookingWithReport = new Booking({
            patient: patient._id,
            lab: lab._id,
            tests: [cbc._id],
            bookingDate: new Date('2026-10-10'),
            preferredTimeSlot: '09:00 AM - 10:00 AM',
            collectionType: 'lab',
            totalAmount: 50,
            status: 'completed',
            reportData: Buffer.from('%PDF-1.4 fake report content'),
            reportContentType: 'application/pdf',
            reportUrl: 'http://localhost:5000/api/bookings/fakeid/report',
            reportUploadedAt: new Date(),
        });
        await bookingWithReport.save();
        bookingWithReportId = bookingWithReport._id.toString();

        // ── Booking WITHOUT report ──
        const bookingWithoutReport = new Booking({
            patient: patient._id,
            lab: lab._id,
            tests: [cbc._id],
            bookingDate: new Date('2026-10-12'),
            preferredTimeSlot: '11:00 AM - 12:00 PM',
            collectionType: 'home',
            collectionAddress: '789 Home St',
            totalAmount: 50,
            status: 'in-progress',
        });
        await bookingWithoutReport.save();
        bookingWithoutReportId = bookingWithoutReport._id.toString();
    });

    // ──────────────────────────────────────────────
    // Unit: uploadReport(id, file)
    // ──────────────────────────────────────────────

    it('should successfully upload a report PDF for a booking', async () => {
        const response = await request(app)
            .post(`/api/bookings/${bookingWithoutReportId}/upload-report`)
            .attach('report', Buffer.from('%PDF-1.4 new report data'), 'cbc_report.pdf');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Report uploaded successfully');

        // Verify DB state
        const updated = await Booking.findById(bookingWithoutReportId);
        expect(updated?.reportData).toBeDefined();
        expect(updated?.reportContentType).toBe('application/pdf');
        expect(updated?.reportUrl).toContain(`/api/bookings/${bookingWithoutReportId}/report`);
        expect(updated?.status).toBe('completed');
    });

    it('should fail if no report file is attached', async () => {
        const response = await request(app)
            .post(`/api/bookings/${bookingWithoutReportId}/upload-report`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Report file is required');
    });

    it('should fail if the booking does not exist', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const response = await request(app)
            .post(`/api/bookings/${fakeId}/upload-report`)
            .attach('report', Buffer.from('%PDF-1.4 data'), 'report.pdf');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Booking not found');
    });

    // ──────────────────────────────────────────────
    // Unit: getReport(id)
    // ──────────────────────────────────────────────

    it('should successfully return the report binary for a booking with report', async () => {
        const response = await request(app)
            .get(`/api/bookings/${bookingWithReportId}/report`);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/pdf');
        expect(response.headers['content-disposition']).toContain('inline');
        // Body should be the raw buffer
        expect(response.body).toBeDefined();
    });

    it('should return 404 if the booking has no report uploaded', async () => {
        const response = await request(app)
            .get(`/api/bookings/${bookingWithoutReportId}/report`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Report not found');
    });

    it('should return 404 if the booking ID does not exist', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const response = await request(app)
            .get(`/api/bookings/${fakeId}/report`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Report not found');
    });
});
