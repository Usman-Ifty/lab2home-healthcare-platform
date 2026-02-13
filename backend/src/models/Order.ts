import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
    product: mongoose.Types.ObjectId;
    productName: string;
    quantity: number;
    price: number;
}

export interface IShippingAddress {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
}

export interface IOrder extends Document {
    orderNumber: string;
    patient: mongoose.Types.ObjectId;
    items: IOrderItem[];
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    status: 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
    shippingAddress: IShippingAddress;
    paymentMethod: string;
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    notes?: string;
    courierService?: 'TCS' | 'Leopard';
    trackingNumber?: string;
    courierBookingDate?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        productName: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1'],
        },
        price: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative'],
        },
    },
    { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        addressLine1: {
            type: String,
            required: true,
            trim: true,
        },
        addressLine2: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        state: {
            type: String,
            required: true,
            trim: true,
        },
        postalCode: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { _id: false }
);

const orderSchema = new Schema<IOrder>(
    {
        orderNumber: {
            type: String,
            unique: true,
        },
        patient: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: function (v: IOrderItem[]) {
                    return v.length > 0;
                },
                message: 'Order must contain at least one item',
            },
        },
        subtotal: {
            type: Number,
            required: true,
            min: [0, 'Subtotal cannot be negative'],
        },
        tax: {
            type: Number,
            required: true,
            min: [0, 'Tax cannot be negative'],
            default: 0,
        },
        shipping: {
            type: Number,
            required: true,
            min: [0, 'Shipping cost cannot be negative'],
            default: 0,
        },
        total: {
            type: Number,
            required: true,
            min: [0, 'Total cannot be negative'],
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'],
            default: 'pending',
        },
        shippingAddress: {
            type: shippingAddressSchema,
            required: true,
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ['online', 'cash_on_delivery'],
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending',
        },
        transactionId: {
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
        },
        courierService: {
            type: String,
            enum: ['TCS', 'Leopard'],
        },
        trackingNumber: {
            type: String,
            trim: true,
        },
        courierBookingDate: {
            type: Date,
        },
        cancelledAt: {
            type: Date,
        },
        cancelReason: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Generate unique order number before saving
orderSchema.pre('save', async function (next) {
    if (this.isNew) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.orderNumber = `ORD-${timestamp}-${random}`;
    }
    next();
});

// Indexes for efficient querying
orderSchema.index({ patient: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });

export default mongoose.model<IOrder>('Order', orderSchema);
