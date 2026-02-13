import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IPhlebotomist extends Document {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  qualification: string;
  trafficLicense: {
    data: Buffer;
    contentType: string;
    filename: string;
    size: number;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  isAvailable?: boolean;
  assignedLab?: mongoose.Types.ObjectId;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const phlebotomistSchema = new Schema<IPhlebotomist>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
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
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
    },
    trafficLicense: {
      data: {
        type: Buffer,
        required: [true, 'Traffic license file is required'],
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
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    assignedLab: {
      type: Schema.Types.ObjectId,
      ref: 'Lab',
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
phlebotomistSchema.pre('save', async function (next) {
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
phlebotomistSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IPhlebotomist>('Phlebotomist', phlebotomistSchema);

