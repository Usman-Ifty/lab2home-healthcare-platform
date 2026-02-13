import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    user: mongoose.Types.ObjectId;
    userType: 'patient' | 'lab' | 'phlebotomist' | 'admin';
    type: 'status_update' | 'report_uploaded' | 'booking_created' | 'booking_cancelled' | 'booking_assigned' | 'new_message' | 'booking_confirmed' | 'sample_collected' | 'report_ready' | 'lab_registered' | 'lab_approved' | 'lab_rejected' | 'lab_activated' | 'lab_deactivated' | 'phlebotomist_registered' | 'phlebotomist_unavailable' | 'patient_activated' | 'patient_deactivated' | 'order_created' | 'new_order' | 'order_cancelled' | 'order_status_updated' | 'phlebotomist_request_sent' | 'phlebotomist_request_accepted' | 'phlebotomist_request_rejected' | 'phlebotomist_assigned' | 'general';
    title: string;
    message: string;
    relatedBooking?: mongoose.Types.ObjectId;
    metadata?: {
        oldStatus?: string;
        newStatus?: string;
        testName?: string;
        labName?: string;
        senderName?: string; // Add senderName for chat notifications
        conversationId?: string; // Add conversationId
        [key: string]: any;
    };
    isRead: boolean;
    createdAt: Date;
    readAt?: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        user: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'userType',
        },
        userType: {
            type: String,
            required: true,
            enum: ['patient', 'lab', 'phlebotomist', 'admin'],
        },
        type: {
            type: String,
            required: true,
            enum: [
                'status_update',
                'report_uploaded',
                'booking_created',
                'booking_cancelled',
                'booking_assigned',
                'new_message',
                'booking_confirmed',
                'sample_collected',
                'report_ready',
                'lab_registered',
                'lab_approved',
                'lab_rejected',
                'lab_activated',
                'lab_deactivated',
                'phlebotomist_registered',
                'phlebotomist_unavailable',
                'patient_activated',
                'patient_deactivated',
                'order_created',
                'new_order',
                'order_cancelled',
                'order_status_updated',
                'phlebotomist_request_sent',
                'phlebotomist_request_accepted',
                'phlebotomist_request_rejected',
                'phlebotomist_assigned',
                'general'
            ],
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        relatedBooking: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
