import request from 'supertest';
import { createTestApp, validLabData, validLabLicense, mockEmailService } from '../helpers';
import Lab from '../../models/Lab';
import OTP from '../../models/OTP';

// Activate mocks
mockEmailService();

import authRoutes from '../../routes/auth.routes';

const app = createTestApp(authRoutes, '/api/auth');

describe('UC-2: Lab Registration / Signup', () => {
    it('should successfully register a new lab and send OTP', async () => {
        const response = await request(app)
            .post('/api/auth/signup/lab')
            .field('fullName', validLabData.fullName)
            .field('email', validLabData.email)
            .field('phone', validLabData.phone)
            .field('labName', validLabData.labName)
            .field('labAddress', validLabData.labAddress)
            .field('password', validLabData.password)
            .attach('licenseCopy', Buffer.from('fake pdf content'), 'license.pdf');

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);

        const lab = await Lab.findOne({ email: validLabData.email });
        expect(lab).toBeTruthy();
        expect(lab?.isVerified).toBe(false);
        expect(lab?.license?.filename).toBe('license.pdf');

        const otpRecord = await OTP.findOne({ email: validLabData.email, purpose: 'signup' });
        expect(otpRecord).toBeTruthy();
    });

    it('should fail registration if license file is missing', async () => {
        const response = await request(app)
            .post('/api/auth/signup/lab')
            .send(validLabData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('License document is required');
    });

    it('should fail registration if required fields are missing', async () => {
        const response = await request(app)
            .post('/api/auth/signup/lab')
            .field('email', 'incomplete@example.com')
            .attach('licenseCopy', Buffer.from('fake pdf content'), 'license.pdf');

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('All fields are required');
    });

    it('should resend OTP and update info if the lab exists but is not verified', async () => {
        await Lab.create({
            ...validLabData,
            email: 'unverified-lab@example.com',
            isVerified: false,
            license: validLabLicense,
        });

        const response = await request(app)
            .post('/api/auth/signup/lab')
            .field('fullName', 'New Name')
            .field('email', 'unverified-lab@example.com')
            .field('phone', validLabData.phone)
            .field('labName', validLabData.labName)
            .field('labAddress', validLabData.labAddress)
            .field('password', validLabData.password)
            .attach('licenseCopy', Buffer.from('fake pdf content'), 'license.pdf');

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('Account exists but not verified');

        const lab = await Lab.findOne({ email: 'unverified-lab@example.com' });
        expect(lab?.fullName).toBe('New Name');
    });

    it('should fail if email is already registered and verified', async () => {
        await Lab.create({
            ...validLabData,
            email: 'verified-lab@example.com',
            isVerified: true,
            license: validLabLicense,
        });

        const response = await request(app)
            .post('/api/auth/signup/lab')
            .field('fullName', validLabData.fullName)
            .field('email', 'verified-lab@example.com')
            .field('phone', validLabData.phone)
            .field('labName', validLabData.labName)
            .field('labAddress', validLabData.labAddress)
            .field('password', validLabData.password)
            .attach('licenseCopy', Buffer.from('fake pdf content'), 'license.pdf');

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Email already registered');
    });
});
