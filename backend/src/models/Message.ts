import mongoose, { Document, Schema } from 'mongoose';

export interface IAttachment {
    filename: string;
    contentType: string;
    data: Buffer;
    size: number;
}

export interface IMessage extends Document {
    conversation: mongoose.Types.ObjectId;
    sender: 'patient' | 'lab' | 'phlebotomist';
    senderId: mongoose.Types.ObjectId;
    content?: string;
    attachments: IAttachment[];
    status: 'sent' | 'delivered' | 'read';
    createdAt: Date;
    updatedAt: Date;
}

const attachmentSchema = new Schema({
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true },
    size: { type: Number, required: true },
});

const messageSchema = new Schema<IMessage>(
    {
        conversation: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
        },
        sender: {
            type: String,
            enum: ['patient', 'lab', 'phlebotomist'],
            required: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        content: {
            type: String,
            trim: true,
        },
        attachments: [attachmentSchema],
        status: {
            type: String,
            enum: ['sent', 'delivered', 'read'],
            default: 'sent',
        },
    },
    {
        timestamps: true,
    }
);

// Index for querying messages in a conversation
messageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model<IMessage>('Message', messageSchema);
