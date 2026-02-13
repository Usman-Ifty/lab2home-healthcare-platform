import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
    patient: mongoose.Types.ObjectId;
    lab?: mongoose.Types.ObjectId;
    phlebotomist?: mongoose.Types.ObjectId;
    booking?: mongoose.Types.ObjectId;
    participants: ('patient' | 'lab' | 'phlebotomist')[];
    lastMessage?: string;
    lastMessageAt?: Date;
    isActive: boolean;
    unreadCount: {
        patient: number;
        lab?: number;
        phlebotomist?: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        lab: {
            type: Schema.Types.ObjectId,
            ref: 'Lab',
            required: false,
        },
        phlebotomist: {
            type: Schema.Types.ObjectId,
            ref: 'Phlebotomist',
            required: false,
        },
        booking: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: false,
        },
        participants: {
            type: [String],
            enum: ['patient', 'lab', 'phlebotomist'],
            required: true,
        },
        lastMessage: {
            type: String,
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        unreadCount: {
            patient: { type: Number, default: 0 },
            lab: { type: Number, default: 0 },
            phlebotomist: { type: Number, default: 0 },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
conversationSchema.index({ patient: 1, lab: 1 });
conversationSchema.index({ patient: 1, phlebotomist: 1 });
conversationSchema.index({ lab: 1, phlebotomist: 1 });
conversationSchema.index({ booking: 1 });
conversationSchema.index({ updatedAt: -1 });

export default mongoose.model<IConversation>('Conversation', conversationSchema);

