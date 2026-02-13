import mongoose, { Document, Schema } from 'mongoose';

export interface IPhlebotomistRequest extends Document {
    booking: mongoose.Types.ObjectId;
    lab: mongoose.Types.ObjectId;
    phlebotomist: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted' | 'rejected';
    requestedAt: Date;
    respondedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const phlebotomistRequestSchema = new Schema<IPhlebotomistRequest>(
    {
        booking: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: [true, 'Booking reference is required'],
        },
        lab: {
            type: Schema.Types.ObjectId,
            ref: 'Lab',
            required: [true, 'Lab reference is required'],
        },
        phlebotomist: {
            type: Schema.Types.ObjectId,
            ref: 'Phlebotomist',
            required: [true, 'Phlebotomist reference is required'],
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        respondedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
phlebotomistRequestSchema.index({ phlebotomist: 1, status: 1 });
phlebotomistRequestSchema.index({ booking: 1 });
phlebotomistRequestSchema.index({ lab: 1, createdAt: -1 });

export default mongoose.model<IPhlebotomistRequest>('PhlebotomistRequest', phlebotomistRequestSchema);
