import mongoose, { Document, Schema } from 'mongoose';

export interface ITest extends Document {
    name: string;
    description: string;
    category: string; // e.g., "Blood Test", "Imaging", "Urine Test", "Radiology"
    basePrice: number;
    preparationInstructions?: string;
    reportDeliveryTime: string; // e.g., "24 hours", "Same day", "48 hours"
    sampleType?: string; // e.g., "Blood", "Urine", "Saliva"
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const testSchema = new Schema<ITest>(
    {
        name: {
            type: String,
            required: [true, 'Test name is required'],
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            required: [true, 'Test description is required'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Test category is required'],
            enum: ['Blood Test', 'Urine Test', 'Imaging', 'Radiology', 'Pathology', 'Cardiology', 'Other'],
            default: 'Other',
        },
        basePrice: {
            type: Number,
            required: [true, 'Base price is required'],
            min: [0, 'Price cannot be negative'],
        },
        preparationInstructions: {
            type: String,
            trim: true,
        },
        reportDeliveryTime: {
            type: String,
            required: [true, 'Report delivery time is required'],
            default: '24 hours',
        },
        sampleType: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
testSchema.index({ category: 1, isActive: 1 });
testSchema.index({ name: 1 });

export default mongoose.model<ITest>('Test', testSchema);
