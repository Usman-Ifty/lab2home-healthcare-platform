import request from 'supertest';
import {
    createTestApp,
    validPatientData,
    validLabData,
    validLabLicense,
    validPhlebotomistData,
    validTrafficLicense,
    validAdminData,
    mockEmailService,
} from '../helpers';
import Patient from '../../models/Patient';
import Lab from '../../models/Lab';
import Phlebotomist from '../../models/Phlebotomist';
import Admin from '../../models/Admin';

// Activate mocks
mockEmailService();

import authRoutes from '../../routes/auth.routes';

const app = createTestApp(authRoutes, '/api/auth');
const validPassword = 'Password123!';

describe('UC-4: Log In (Unified Login)', () => {
    beforeEach(async () => {
        // ── Patients ──
        const patient = new Patient({ ...validPatientData, email: 'login.patient@example.com', isVerified: true, isActive: true });
        await patient.save();

        const unverifiedPatient = new Patient({ ...validPatientData, email: 'unverified.patient@example.com', isVerified: false, isActive: true });
        await unverifiedPatient.save();

        const inactivePatient = new Patient({ ...validPatientData, email: 'inactive.patient@example.com', isVerified: true, isActive: false });
        await inactivePatient.save();

        // ── Labs ──
        const labBase = { ...validLabData, license: validLabLicense, hasConfiguredTests: true };

        const lab = new Lab({ ...labBase, email: 'login.lab@example.com', isVerified: true, isActive: true });
        await lab.save();

        const unverifiedLab = new Lab({ ...labBase, email: 'unverified.lab@example.com', isVerified: false, isActive: true });
        await unverifiedLab.save();

        const inactiveLab = new Lab({ ...labBase, email: 'inactive.lab@example.com', isVerified: true, isActive: false });
        await inactiveLab.save();

        // ── Phlebotomists ──
        const phlebBase = { ...validPhlebotomistData, trafficLicense: validTrafficLicense };

        const phleb = new Phlebotomist({ ...phlebBase, email: 'login.phleb@example.com', isVerified: true, isActive: true });
        await phleb.save();

        const unverifiedPhleb = new Phlebotomist({ ...phlebBase, email: 'unverified.phleb@example.com', isVerified: false, isActive: true });
        await unverifiedPhleb.save();

        const inactivePhleb = new Phlebotomist({ ...phlebBase, email: 'inactive.phleb@example.com', isVerified: true, isActive: false });
        await inactivePhleb.save();

        // ── Admin ──
        const admin = new Admin(validAdminData);
        await admin.save();
    });

    // ── Patient Login ──
    describe('Patient Login', () => {
        it('should successfully log in a verified and active patient', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'login.patient@example.com', password: validPassword, role: 'patient' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.userType).toBe('patient');
        });

        it('should fail login if the password is incorrect', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'login.patient@example.com', password: 'WrongPassword!', role: 'patient' });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid email or password');
        });

        it('should fail login if the patient is unverified', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'unverified.patient@example.com', password: validPassword, role: 'patient' });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Please verify your email first');
            expect(response.body.needsVerification).toBe(true);
        });

        it('should fail login if the patient is inactive/suspended', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'inactive.patient@example.com', password: validPassword, role: 'patient' });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('deactivated');
        });
    });

    // ── Lab Login ──
    describe('Lab Login', () => {
        it('should successfully log in a verified and active lab', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'login.lab@example.com', password: validPassword, role: 'lab' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.userType).toBe('lab');
        });

        it('should fail login if the lab is unverified (pending approval)', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'unverified.lab@example.com', password: validPassword, role: 'lab' });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.needsApproval).toBe(true);
        });

        it('should fail login if the lab is inactive/suspended', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'inactive.lab@example.com', password: validPassword, role: 'lab' });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('deactivated');
        });
    });

    // ── Phlebotomist Login ──
    describe('Phlebotomist Login', () => {
        it('should successfully log in a verified and active phlebotomist', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'login.phleb@example.com', password: validPassword, role: 'phlebotomist' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.userType).toBe('phlebotomist');
        });

        it('should fail login if the phlebotomist is unverified (pending approval)', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'unverified.phleb@example.com', password: validPassword, role: 'phlebotomist' });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('pending admin approval');
            expect(response.body.needsApproval).toBe(true);
        });

        it('should fail login if the phlebotomist is inactive/suspended', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'inactive.phleb@example.com', password: validPassword, role: 'phlebotomist' });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('deactivated');
        });
    });

    // ── Admin Login ──
    describe('Admin Login', () => {
        it('should successfully log in an active admin', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: validAdminData.email, password: validPassword, role: 'admin' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.userType).toBe('admin');
        });
    });

    // ── General Validation ──
    describe('Role and General Validation', () => {
        it('should fail if an invalid role is provided', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'login.patient@example.com', password: validPassword, role: 'unknown_role' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should fail if email is empty or missing', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ password: validPassword, role: 'patient' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
