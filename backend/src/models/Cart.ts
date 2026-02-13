import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
    product: mongoose.Types.ObjectId;
    quantity: number;
    priceSnapshot: number;
}

export interface ICart extends Document {
    patient: mongoose.Types.ObjectId;
    items: ICartItem[];
    updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1'],
            default: 1,
        },
        priceSnapshot: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative'],
        },
    },
    { _id: false }
);

const cartSchema = new Schema<ICart>(
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
            unique: true,
        },
        items: {
            type: [cartItemSchema],
            default: [],
        },
    },
    {
        timestamps: { createdAt: false, updatedAt: true },
    }
);

// Index for faster patient cart lookup
cartSchema.index({ patient: 1 });

export default mongoose.model<ICart>('Cart', cartSchema);
