import request from 'supertest';
import { createTestApp, validPatientData, mockEmailService } from '../helpers';
import Patient from '../../models/Patient';
import OTP from '../../models/OTP';

// Activate mocks
mockEmailService();

import authRoutes from '../../routes/auth.routes';

const app = createTestApp(authRoutes, '/api/auth');

describe('UC-1: Patient Registration / Signup', () => {
    it('should successfully register a new patient and send OTP', async () => {
        const response = await request(app)
            .post('/api/auth/signup/patient')
            .send({ ...validPatientData, email: 'john.doe@example.com' });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Signup successful');

        const patient = await Patient.findOne({ email: 'john.doe@example.com' });
        expect(patient).toBeTruthy();
        expect(patient?.isVerified).toBe(false);

        const otpRecord = await OTP.findOne({ email: 'john.doe@example.com', purpose: 'signup' });
        expect(otpRecord).toBeTruthy();
    });

    it('should fail registration if required fields are missing', async () => {
        const response = await request(app)
            .post('/api/auth/signup/patient')
            .send({ fullName: 'Jane Doe', email: 'jane@example.com' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('All fields are required');
    });

    it('should resend OTP if the user exists but is not verified', async () => {
        await Patient.create({ ...validPatientData, email: 'unverified@example.com', isVerified: false });

        const response = await request(app)
            .post('/api/auth/signup/patient')
            .send({ ...validPatientData, email: 'unverified@example.com' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Account exists but not verified');

        const otpCount = await OTP.countDocuments({ email: 'unverified@example.com', purpose: 'signup' });
        expect(otpCount).toBe(1);
    });

    it('should fail if email is already registered and verified', async () => {
        await Patient.create({ ...validPatientData, email: 'verified@example.com', isVerified: true });

        const response = await request(app)
            .post('/api/auth/signup/patient')
            .send({ ...validPatientData, email: 'verified@example.com' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Email already registered');
    });
});
