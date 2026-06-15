import mongoose, { Document, Schema } from 'mongoose';

export interface IAiInterpretationResult {
  testName: string;
  patientValue: number;
  unit: string;
  normalMin: number | null;
  normalMax: number | null;
  status: 'Good' | 'Needs Attention' | 'Critical' | 'Unknown';
  note: string;
}

export interface IAiInterpretation extends Document {
  booking: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  overallClassification: 'Good' | 'Needs Attention' | 'Critical';
  verdictMessage: string;
  results: IAiInterpretationResult[];
  extractionMethod: string;
  llmUsed: string;
  version: number;
  createdAt: Date;
}

const aiInterpretationSchema = new Schema<IAiInterpretation>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
    },
    overallClassification: {
      type: String,
      enum: ['Good', 'Needs Attention', 'Critical'],
      required: true,
    },
    verdictMessage: {
      type: String,
      required: true,
    },
    results: [
      {
        testName: { type: String, required: true },
        patientValue: { type: Number, required: true },
        unit: { type: String, default: '' },
        normalMin: { type: Number, default: null },
        normalMax: { type: Number, default: null },
        status: {
          type: String,
          enum: ['Good', 'Needs Attention', 'Critical', 'Unknown'],
          required: true,
        },
        note: { type: String, default: '' },
      },
    ],
    extractionMethod: {
      type: String,
      required: true,
    },
    llmUsed: {
      type: String,
      default: 'gemini',
    },
    version: {
      type: Number,
      default: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We manage createdAt manually
  }
);

// Index for fast lookups by booking
aiInterpretationSchema.index({ booking: 1 });
aiInterpretationSchema.index({ patient: 1, createdAt: -1 });

export default mongoose.model<IAiInterpretation>('AiInterpretation', aiInterpretationSchema);
