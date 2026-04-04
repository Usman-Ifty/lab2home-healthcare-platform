import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
    patient: mongoose.Types.ObjectId;
    targetType: 'lab' | 'phlebotomist' | 'product';
    targetId: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
    booking?: mongoose.Types.ObjectId;
    order?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient reference is required'],
        },
        targetType: {
            type: String,
            enum: ['lab', 'phlebotomist', 'product'],
            required: [true, 'Target type is required'],
        },
        targetId: {
            type: Schema.Types.ObjectId,
            required: [true, 'Target ID is required'],
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        },
        booking: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
        },
        order: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
        },
    },
    {
        timestamps: true,
    }
);

// Per-booking reviews: one review per target type per booking
// (e.g. one lab review + one phlebotomist review per booking)
feedbackSchema.index(
    { booking: 1, targetType: 1, targetId: 1 },
    { unique: true, sparse: true, name: 'unique_review_per_booking' }
);

// Per-order reviews: one review per product per order
feedbackSchema.index(
    { order: 1, targetId: 1 },
    { unique: true, sparse: true, name: 'unique_review_per_order' }
);

// Fast lookup of all reviews for a target
feedbackSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
// Patient's own reviews
feedbackSchema.index({ patient: 1, createdAt: -1 });

export default mongoose.model<IFeedback>('Feedback', feedbackSchema);
