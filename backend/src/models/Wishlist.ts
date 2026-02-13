import mongoose, { Document, Schema } from 'mongoose';

export interface IWishlist extends Document {
    patient: mongoose.Types.ObjectId;
    products: mongoose.Types.ObjectId[];
    updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
            unique: true,
        },
        products: {
            type: [Schema.Types.ObjectId],
            ref: 'Product',
            default: [],
        },
    },
    {
        timestamps: { createdAt: false, updatedAt: true },
    }
);

// Index for faster patient wishlist lookup
wishlistSchema.index({ patient: 1 });

export default mongoose.model<IWishlist>('Wishlist', wishlistSchema);
