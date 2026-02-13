import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../lib/api';

interface Notification {
    _id: string;
    type: 'status_update' | 'report_uploaded' | 'booking_created' | 'booking_cancelled';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    relatedBooking?: {
        _id: string;
        bookingDate: string;
        preferredTimeSlot: string;
        status: string;
    };
    metadata?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    removeNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user?.id || !isAuthenticated) return;

        try {
            // Don't set loading to true for background polling to avoid UI flickering
            const response = await getUserNotifications(user.id);
            if (response.success && response.data) {
                setNotifications(response.data);
                setUnreadCount((response as any).unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [user, isAuthenticated]);

    // Initial fetch and polling
    useEffect(() => {
        if (isAuthenticated && user) {
            setLoading(true);
            fetchNotifications().finally(() => setLoading(false));

            // Poll every 30 seconds
            const intervalId = setInterval(fetchNotifications, 30000);
            return () => clearInterval(intervalId);
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, user, fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            await markNotificationAsRead(id);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            // Revert on error
            fetchNotifications();
        }
    };

    const markAllAsRead = async () => {
        if (!user?.id) return;

        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);

            await markAllNotificationsAsRead(user.id);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            fetchNotifications();
        }
    };

    const removeNotification = async (id: string) => {
        try {
            // Optimistic update
            const notification = notifications.find(n => n._id === id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (notification && !notification.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            await deleteNotification(id);
        } catch (error) {
            console.error('Failed to delete notification:', error);
            fetchNotifications();
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
                removeNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
