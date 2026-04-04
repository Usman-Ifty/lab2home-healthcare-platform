import request from 'supertest';
import { createTestApp, validPhlebotomistData, validTrafficLicense, mockEmailService } from '../helpers';
import Phlebotomist from '../../models/Phlebotomist';
import OTP from '../../models/OTP';

// Activate mocks
mockEmailService();

import authRoutes from '../../routes/auth.routes';

const app = createTestApp(authRoutes, '/api/auth');

describe('UC-3: Phlebotomist Registration / Signup', () => {
    it('should successfully register a new phlebotomist and send OTP', async () => {
        const response = await request(app)
            .post('/api/auth/signup/phlebotomist')
            .field('fullName', validPhlebotomistData.fullName)
            .field('email', validPhlebotomistData.email)
            .field('phone', validPhlebotomistData.phone)
            .field('qualification', validPhlebotomistData.qualification)
            .field('password', validPhlebotomistData.password)
            .attach('trafficLicenseCopy', Buffer.from('fake image content'), 'license.jpg');

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);

        const phlebotomist = await Phlebotomist.findOne({ email: validPhlebotomistData.email });
        expect(phlebotomist).toBeTruthy();
        expect(phlebotomist?.isVerified).toBe(false);
        expect(phlebotomist?.trafficLicense?.filename).toBe('license.jpg');

        const otpRecord = await OTP.findOne({ email: validPhlebotomistData.email, purpose: 'signup' });
        expect(otpRecord).toBeTruthy();
    });

    it('should fail registration if traffic license file is missing', async () => {
        const response = await request(app)
            .post('/api/auth/signup/phlebotomist')
            .send(validPhlebotomistData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Traffic license copy is required');
    });

    it('should fail registration if required fields are missing', async () => {
        const response = await request(app)
            .post('/api/auth/signup/phlebotomist')
            .field('email', 'incomplete@example.com')
            .attach('trafficLicenseCopy', Buffer.from('fake image content'), 'license.jpg');

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('All fields are required');
    });

    it('should resend OTP and update info if the phlebotomist exists but is not verified', async () => {
        await Phlebotomist.create({
            ...validPhlebotomistData,
            email: 'unverified-phleb@example.com',
            isVerified: false,
            trafficLicense: validTrafficLicense,
        });

        const response = await request(app)
            .post('/api/auth/signup/phlebotomist')
            .field('fullName', 'Updated Jane')
            .field('email', 'unverified-phleb@example.com')
            .field('phone', validPhlebotomistData.phone)
            .field('qualification', validPhlebotomistData.qualification)
            .field('password', validPhlebotomistData.password)
            .attach('trafficLicenseCopy', Buffer.from('fake new file'), 'new_license.jpg');

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('Account exists but not verified');

        const phlebotomist = await Phlebotomist.findOne({ email: 'unverified-phleb@example.com' });
        expect(phlebotomist?.fullName).toBe('Updated Jane');
        expect(phlebotomist?.trafficLicense?.filename).toBe('new_license.jpg');
    });

    it('should fail if email is already registered and verified', async () => {
        await Phlebotomist.create({
            ...validPhlebotomistData,
            email: 'verified-phleb@example.com',
            isVerified: true,
            trafficLicense: validTrafficLicense,
        });

        const response = await request(app)
            .post('/api/auth/signup/phlebotomist')
            .field('fullName', validPhlebotomistData.fullName)
            .field('email', 'verified-phleb@example.com')
            .field('phone', validPhlebotomistData.phone)
            .field('qualification', validPhlebotomistData.qualification)
            .field('password', validPhlebotomistData.password)
            .attach('trafficLicenseCopy', Buffer.from('fake image content'), 'license.jpg');

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Email already registered');
    });
});
