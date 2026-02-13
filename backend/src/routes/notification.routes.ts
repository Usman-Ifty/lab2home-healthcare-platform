import express from 'express';
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user notifications
router.get('/:userId', getUserNotifications);

// Mark notification as read
router.put('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

export default router;
