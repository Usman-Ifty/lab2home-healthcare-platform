import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
    admin: mongoose.Types.ObjectId;
    action: 'approve_user' | 'suspend_user' | 'reactivate_user' | 'reject_user';
    targetUser: mongoose.Types.ObjectId;
    targetUserType: 'patient' | 'lab' | 'phlebotomist';
    details: {
        previousStatus?: string;
        newStatus?: string;
        reason?: string;
        [key: string]: any;
    };
    timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
    {
        admin: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: ['approve_user', 'suspend_user', 'reactivate_user', 'reject_user'],
        },
        targetUser: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'targetUserType',
        },
        targetUserType: {
            type: String,
            required: true,
            enum: ['patient', 'lab', 'phlebotomist'],
        },
        details: {
            type: Schema.Types.Mixed,
            default: {},
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
auditLogSchema.index({ admin: 1, timestamp: -1 });
auditLogSchema.index({ targetUser: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog;
