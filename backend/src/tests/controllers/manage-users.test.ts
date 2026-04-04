import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, validPatientData, validLabData } from '../helpers';
import Admin from '../../models/Admin';
import Lab from '../../models/Lab';
import Patient from '../../models/Patient';
import Booking from '../../models/Booking';
import AuditLog from '../../models/AuditLog';
import adminRoutes from '../../routes/admin.routes';

// Mock Email Services
jest.mock('../../services/email.service', () => ({
    sendWelcomeEmail: jest.fn(),
    sendLabApprovalEmail: jest.fn(),
    sendLabRejectionEmail: jest.fn(),
    sendLabActivationEmail: jest.fn(),
    sendLabDeactivationEmail: jest.fn(),
    sendPatientActivationEmail: jest.fn(),
    sendPatientDeactivationEmail: jest.fn()
}));

import { protect, authorizeUserType } from '../../middleware/auth.middleware';
jest.mock('../../middleware/auth.middleware', () => ({
    protect: jest.fn(),
    authorizeUserType: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

const app = createTestApp(adminRoutes, '/api/admin');

describe('UC-17: Manage Users (Admin)', () => {
    let adminId: string;
    let pendingLabId: string;
    let activeLabId: string;
    let patientId: string;

    beforeEach(async () => {
        // Create an Admin 
        const admin = new Admin({ email: 'admin@lab2home.com', password: 'Password123' });
        await admin.save();
        adminId = admin._id.toString();

        // Create Pending Lab
        const pendingLabData: any = { ...validLabData, email: 'pending@lab.com' };
        pendingLabData.license = {
            data: Buffer.from('mock-pdf-content'),
            contentType: 'application/pdf',
            filename: 'license.pdf',
            size: 1024
        };
        const pendingLab = new Lab(pendingLabData);
        pendingLab.isVerified = false; // Need approval
        await pendingLab.save();
        pendingLabId = pendingLab._id.toString();

        // Create Active Lab
        const activeLabData: any = { ...validLabData, email: 'active@lab.com', labName: 'Active Lab' };
        activeLabData.license = {
            data: Buffer.from('mock-pdf-content'),
            contentType: 'application/pdf',
            filename: 'license.pdf',
            size: 1024
        };
        const activeLab = new Lab(activeLabData);
        activeLab.isVerified = true;
        activeLab.isActive = true;
        await activeLab.save();
        activeLabId = activeLab._id.toString();

        // Create Patient
        const patientData: any = { ...validPatientData, email: 'patient@user.com' };
        const patient = new Patient(patientData);
        patient.isActive = true;
        await patient.save();
        patientId = patient._id.toString();

        // Mock authentication context
        (protect as jest.Mock).mockImplementation((req, res, next) => {
            req.user = { id: adminId, userType: 'admin' };
            next();
        });
    });

    // ─── DASHBOARD ──────────────────────────────────────────────
    describe('Dashboard Statistics', () => {
        it('should return aggregated metrics representing user statistics across platform', async () => {
            const response = await request(app).get('/api/admin/dashboard/stats');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.users.labs).toBe(2);
            expect(response.body.data.users.patients).toBe(1);
            expect(response.body.data.pendingApprovals.labs).toBe(1);
            expect(response.body.data.bookings.total).toBe(0);
        });
    });

    // ─── LABS MANAGEMENT ────────────────────────────────────────
    describe('Pending Labs Verification', () => {
        it('should safely fetch unverified and pending labs', async () => {
            const response = await request(app).get('/api/admin/labs/pending');

            expect(response.status).toBe(200);
            expect(response.body.count).toBe(1);
            expect(response.body.data[0].email).toBe('pending@lab.com');
        });

        it('should correctly serve lab license file by tracking buffers', async () => {
            const response = await request(app).get(`/api/admin/labs/${pendingLabId}/license`);
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/pdf');
            expect(response.body.toString()).toBe('mock-pdf-content');
        });

        it('should successfully approve a pending lab, verify them, and write audit log', async () => {
            const response = await request(app).put(`/api/admin/labs/${pendingLabId}/approve`);

            expect(response.status).toBe(200);
            expect(response.body.data.isVerified).toBe(true);

            // Audit
            const logEntry = await AuditLog.findOne({ targetUser: pendingLabId });
            expect(logEntry?.action).toBe('approve_user');
            expect(logEntry?.details.newStatus).toBe('approved');
        });

        it('should prevent approving a lab that is already verified', async () => {
            const response = await request(app).put(`/api/admin/labs/${activeLabId}/approve`);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('already approved');
        });

        it('should reject a lab given a required reason and delete it completely', async () => {
            const response = await request(app)
                .put(`/api/admin/labs/${pendingLabId}/reject`)
                .send({ reason: 'License not legible' });

            expect(response.status).toBe(200);

            // Audit verification BEFORE deletion
            const logEntry = await AuditLog.findOne({ targetUser: pendingLabId });
            expect(logEntry?.details.reason).toBe('License not legible');

            // Deletion Check
            const deletedDbLab = await Lab.findById(pendingLabId);
            expect(deletedDbLab).toBeNull();
        });
    });

    describe('Active Labs Configuration', () => {
        it('should correctly deactivate an active lab', async () => {
            const response = await request(app).put(`/api/admin/labs/${activeLabId}/deactivate`);
            
            expect(response.status).toBe(200);
            const check = await Lab.findById(activeLabId);
            expect(check?.isActive).toBe(false);
        });

        it('should fetch lab properties by ID', async () => {
            const response = await request(app).get(`/api/admin/labs/${activeLabId}`);
            
            expect(response.status).toBe(200);
            expect(response.body.data.labName).toBe('Active Lab');
        });

        it('should perfectly update profile properties ignoring restricted properties', async () => {
            // Update to a new name
            const response = await request(app)
                .put(`/api/admin/labs/${activeLabId}/edit`)
                .send({ labName: 'Super Mega Lab', isVerified: false });

            expect(response.status).toBe(200);
            expect(response.body.data.labName).toBe('Super Mega Lab');

            // Confirm restricted `isVerified` didn't drop
            const dbCheck = await Lab.findById(activeLabId);
            expect(dbCheck?.isVerified).toBe(true);
        });

        it('should delete a lab ONLY when there are no active bookings', async () => {
            const response = await request(app).delete(`/api/admin/labs/${activeLabId}`);
            expect(response.status).toBe(200);
            
            const check = await Lab.findById(activeLabId);
            expect(check).toBeNull();
        });
        
        it('should refuse to delete a lab containing active pending bookings', async () => {
            await Booking.create({
                patient: patientId,
                lab: activeLabId,
                tests: [new mongoose.Types.ObjectId()],
                bookingDate: new Date(),
                preferredTimeSlot: 'morning',
                collectionType: 'home',
                collectionAddress: '123 Fake St',
                status: 'pending',
                totalAmount: 1000
            });
            
            const response = await request(app).delete(`/api/admin/labs/${activeLabId}`);
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('active booking(s)');
        });
    });

    // ─── PATIENTS MANAGEMENT ────────────────────────────────────
    describe('Patients Management', () => {
        it('should return a strictly paginated array of patients directly from Patient Models', async () => {
            const response = await request(app).get('/api/admin/patients');
            
            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].email).toBe('patient@user.com');
        });

        it('should accurately deactivate the patient blocking their login properties', async () => {
            const response = await request(app).put(`/api/admin/patients/${patientId}/deactivate`);
            
            expect(response.status).toBe(200);
            const check = await Patient.findById(patientId);
            expect(check?.isActive).toBe(false);
        });

        it('should return 400 when attempting to deactivate an already inactive patient', async () => {
            await Patient.findByIdAndUpdate(patientId, { isActive: false });

            const response = await request(app).put(`/api/admin/patients/${patientId}/deactivate`);
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('already deactivated');
        });
    });
});
