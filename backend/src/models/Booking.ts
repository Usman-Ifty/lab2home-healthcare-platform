import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
    patient: mongoose.Types.ObjectId;
    lab: mongoose.Types.ObjectId;
    tests: mongoose.Types.ObjectId[]; // Changed from single test to array of tests
    bookingDate: Date;
    preferredTimeSlot: string;
    collectionType: 'home' | 'lab';
    collectionAddress?: string;
    status: 'pending' | 'confirmed' | 'in-progress' | 'sample_collected' | 'completed' | 'cancelled';
    paymentMethod: 'cash' | 'online';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    totalAmount: number;
    transactionId?: string;
    notes?: string;
    phlebotomist?: mongoose.Types.ObjectId;
    phlebotomistRequestStatus?: 'none' | 'pending' | 'assigned' | 'rejected';
    assignmentHistory?: mongoose.Types.ObjectId[];
    cancelReason?: string;
    reportUrl?: string;
    reportData?: Buffer;
    reportContentType?: string;
    reportUploadedAt?: Date;
    sampleCollection?: {
        collectedAt: Date;
        sampleId?: string;
        notes?: string;
        collectedBy?: mongoose.Types.ObjectId;
    };
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient reference is required'],
        },
        lab: {
            type: Schema.Types.ObjectId,
            ref: 'Lab',
            required: [true, 'Lab reference is required'],
        },
        tests: [{
            type: Schema.Types.ObjectId,
            ref: 'Test',
            required: true,
        }],
        bookingDate: {
            type: Date,
            required: [true, 'Booking date is required'],
        },
        preferredTimeSlot: {
            type: String,
            required: [true, 'Preferred time slot is required'],
            trim: true,
        },
        collectionType: {
            type: String,
            enum: ['home', 'lab'],
            required: [true, 'Collection type is required'],
            default: 'home',
        },
        collectionAddress: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'in-progress', 'sample_collected', 'completed', 'cancelled'],
            default: 'pending',
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'online'],
            default: 'cash',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'refunded'],
            default: 'pending',
        },
        totalAmount: {
            type: Number,
            required: [true, 'Total amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        transactionId: {
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        },
        phlebotomist: {
            type: Schema.Types.ObjectId,
            ref: 'Phlebotomist',
        },
        phlebotomistRequestStatus: {
            type: String,
            enum: ['none', 'pending', 'assigned', 'rejected'],
            default: 'none',
        },
        assignmentHistory: [{
            type: Schema.Types.ObjectId,
            ref: 'PhlebotomistRequest',
        }],
        cancelReason: {
            type: String,
            trim: true,
        },
        reportUrl: {
            type: String,
            trim: true,
        },
        reportData: {
            type: Buffer,
        },
        reportContentType: {
            type: String,
        },
        reportUploadedAt: {
            type: Date,
        },
        sampleCollection: {
            collectedAt: {
                type: Date
            },
            sampleId: {
                type: String,
                trim: true
            },
            notes: {
                type: String,
                trim: true
            },
            collectedBy: {
                type: Schema.Types.ObjectId,
                ref: 'Phlebotomist'
            }
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
bookingSchema.index({ patient: 1, createdAt: -1 });
bookingSchema.index({ lab: 1, bookingDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ phlebotomist: 1, bookingDate: 1 });

// Validation: home collection must have address
bookingSchema.pre('save', function (next) {
    if (this.collectionType === 'home' && !this.collectionAddress) {
        next(new Error('Collection address is required for home collection'));
    } else {
        next();
    }
});

export default mongoose.model<IBooking>('Booking', bookingSchema);
