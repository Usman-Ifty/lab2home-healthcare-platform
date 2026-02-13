import { Request, Response } from 'express';
import Notification from '../models/Notification';

// ============================================
// GET USER NOTIFICATIONS
// ============================================
export const getUserNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const { limit = 50, unreadOnly = 'false' } = req.query;

        const query: any = { user: userId };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .populate('relatedBooking', 'bookingDate preferredTimeSlot status');

        const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

        res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            data: notifications,
        });
    } catch (error: any) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message,
        });
    }
};

// ============================================
// MARK NOTIFICATION AS READ
// ============================================
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: notification,
        });
    } catch (error: any) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message,
        });
    }
};

// ============================================
// MARK ALL AS READ
// ============================================
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;

        await Notification.updateMany(
            { user: userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error: any) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message,
        });
    }
};

// ============================================
// DELETE NOTIFICATION
// ============================================
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message,
        });
    }
};

// ============================================
// CREATE NOTIFICATION (Helper function)
// ============================================
export const createNotification = async (data: {
    user: string;
    userType: 'patient' | 'lab' | 'phlebotomist' | 'admin';
    type: 'status_update' | 'report_uploaded' | 'booking_created' | 'booking_cancelled' | 'booking_assigned' | 'new_message' | 'booking_confirmed' | 'sample_collected' | 'report_ready' | 'lab_registered' | 'lab_approved' | 'lab_rejected' | 'lab_activated' | 'lab_deactivated' | 'phlebotomist_registered' | 'phlebotomist_unavailable' | 'patient_activated' | 'patient_deactivated' | 'order_created' | 'new_order' | 'order_cancelled' | 'order_status_updated' | 'phlebotomist_request_sent' | 'phlebotomist_request_accepted' | 'phlebotomist_request_rejected' | 'phlebotomist_assigned' | 'general';
    title: string;
    message: string;
    relatedBooking?: string;
    metadata?: any;
}): Promise<void> => {
    try {
        await Notification.create(data);
        console.log(`✅ In-app notification created for user ${data.user}`);
    } catch (error) {
        console.error('❌ Failed to create notification:', error);
    }
};
