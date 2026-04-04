import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp } from '../helpers';
import Notification from '../../models/Notification';

import { authenticateToken } from '../../middleware/auth.middleware';

jest.mock('../../middleware/auth.middleware', () => ({
    authenticateToken: jest.fn(),
}));

import notificationRoutes from '../../routes/notification.routes';

const app = createTestApp(notificationRoutes, '/api/notifications');

describe('UC-10: View Notifications/Receive Alerts', () => {
    let userId1: string;
    let userId2: string;
    let notif1Id: string;
    let notif2Id: string;
    let notif3Id: string;

    beforeEach(async () => {
        userId1 = new mongoose.Types.ObjectId().toString();
        userId2 = new mongoose.Types.ObjectId().toString();

        // Seed notifications for User 1
        const notif1 = new Notification({
            user: userId1,
            userType: 'patient',
            type: 'general',
            title: 'Welcome',
            message: 'Welcome to Lab2Home',
            isRead: false,
        });
        await notif1.save();
        notif1Id = notif1._id.toString();

        const notif2 = new Notification({
            user: userId1,
            userType: 'patient',
            type: 'status_update',
            title: 'Booking Confirmed',
            message: 'Your booking has been confirmed',
            isRead: true,   // Already read
        });
        await notif2.save();
        notif2Id = notif2._id.toString();

        // Seed notification for User 2
        const notif3 = new Notification({
            user: userId2,
            userType: 'lab',
            type: 'new_order',
            title: 'New Request',
            message: 'You have a new test request',
            isRead: false,
        });
        await notif3.save();
        notif3Id = notif3._id.toString();
    });

    // Mock authentication per test
    const authAs = (userId: string, userType: string) => {
        (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
            req.user = { id: userId, userType };
            next();
        });
    };

    describe('GET /api/notifications/:userId', () => {
        it('should fetch all notifications for a user and return accurate unreadCount', async () => {
            authAs(userId1, 'patient');

            const response = await request(app).get(`/api/notifications/${userId1}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(2);
            expect(response.body.unreadCount).toBe(1);
            expect(response.body.data[0].title).toBeDefined();
        });

        it('should filter notifications when unreadOnly=true is passed', async () => {
            authAs(userId1, 'patient');

            const response = await request(app).get(`/api/notifications/${userId1}?unreadOnly=true`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(1); // Only 1 unread
            expect(response.body.data[0].isRead).toBe(false);
        });

        it('should limit the number of notifications returned based on the limit query', async () => {
            authAs(userId1, 'patient');

            const response = await request(app).get(`/api/notifications/${userId1}?limit=1`);

            expect(response.status).toBe(200);
            expect(response.body.count).toBe(1);
        });
    });

    describe('PUT /api/notifications/:id/read', () => {
        it('should individually mark a notification as read', async () => {
            authAs(userId1, 'patient');

            const response = await request(app).put(`/api/notifications/${notif1Id}/read`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Notification marked as read');
            
            expect(response.body.data.isRead).toBe(true);
            expect(response.body.data.readAt).toBeDefined();

            // Verify in db
            const dbNotif = await Notification.findById(notif1Id);
            expect(dbNotif?.isRead).toBe(true);
        });

        it('should return 404 if trying to mark a non-existent notification', async () => {
            authAs(userId1, 'patient');
            const fakeId = new mongoose.Types.ObjectId().toString();

            const response = await request(app).put(`/api/notifications/${fakeId}/read`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Notification not found');
        });
    });

    describe('PUT /api/notifications/read-all', () => {
        it('should mark all unread notifications for a user as read', async () => {
            authAs(userId1, 'patient');

            const response = await request(app).put('/api/notifications/read-all').send({
                userId: userId1
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify in db
            const unreadCount = await Notification.countDocuments({ user: userId1, isRead: false });
            expect(unreadCount).toBe(0);
        });
    });

    describe('DELETE /api/notifications/:id', () => {
        it('should successfully delete a notification by ID', async () => {
            authAs(userId1, 'patient');

            const response = await request(app).delete(`/api/notifications/${notif1Id}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify db
            const check = await Notification.findById(notif1Id);
            expect(check).toBeNull();
        });

        it('should return 404 if notification ID is missing or invalid', async () => {
            authAs(userId1, 'patient');
            const fakeId = new mongoose.Types.ObjectId().toString();

            const response = await request(app).delete(`/api/notifications/${fakeId}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });
});
