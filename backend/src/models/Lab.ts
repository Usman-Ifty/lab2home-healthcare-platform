import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ILab extends Document {
  fullName: string; // Contact person name
  email: string;
  password: string;
  phone: string;
  labName: string;
  license: {
    data: Buffer;
    contentType: string;
    filename: string;
    size: number;
  };
  labAddress: string;
  operatingHours?: {
    open: string;
    close: string;
  };
  timeSlots?: Array<{
    time: string;
    isActive: boolean;
  }>;
  testTypes?: string[];
  availableTests: mongoose.Types.ObjectId[]; // References to Test model
  hasConfiguredTests: boolean;
  certifications?: string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const labSchema = new Schema<ILab>(
  {
    fullName: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    labName: {
      type: String,
      required: [true, 'Lab name is required'],
      trim: true,
    },
    license: {
      data: {
        type: Buffer,
        required: [true, 'License document is required'],
      },
      contentType: {
        type: String,
        required: true,
      },
      filename: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
    },
    labAddress: {
      type: String,
      required: [true, 'Lab address is required'],
      trim: true,
    },
    operatingHours: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
    },
    timeSlots: {
      type: [
        {
          time: { type: String, required: true },
          isActive: { type: Boolean, default: true },
        },
      ],
      default: [
        { time: '08:00 AM - 10:00 AM', isActive: true },
        { time: '10:00 AM - 12:00 PM', isActive: true },
        { time: '12:00 PM - 02:00 PM', isActive: false },
        { time: '02:00 PM - 04:00 PM', isActive: true },
        { time: '04:00 PM - 06:00 PM', isActive: true },
        { time: '06:00 PM - 08:00 PM', isActive: true },
      ],
    },
    testTypes: {
      type: [String],
      default: ['Blood Test', 'Urine Test', 'X-Ray', 'CBC', 'Lipid Panel'],
    },
    availableTests: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Test' }],
      default: [],
    },
    hasConfiguredTests: {
      type: Boolean,
      default: false,
    },
    certifications: {
      type: [String],
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
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

// Hash password before saving
labSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
labSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<ILab>('Lab', labSchema);
