/**
 * AI Interpretation Controller
 *
 * Handles generating and retrieving AI interpretations of lab reports.
 */

import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Patient from '../models/Patient';
import AiInterpretation from '../models/AiInterpretation';
import { interpretReport } from '../utils/aiInterpreter';

// ============================================
// GENERATE INTERPRETATION (POST /:bookingId/interpret)
// ============================================
export const generateInterpretation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;

    // 1. Find booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
      return;
    }

    // 2. Authorization: Ensure the patient owns this booking
    if (booking.patient.toString() !== req.user?.id) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to interpret this report.',
      });
      return;
    }

    // 3. Check report exists
    if (!booking.reportData) {
      res.status(400).json({
        success: false,
        message: 'Report has not been uploaded yet for this booking.',
      });
      return;
    }

    // 4. Find patient profile
    const patient = await Patient.findById(req.user?.id);
    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
      return;
    }

    // 5. Ensure patient has age and sex for accurate interpretation
    if (!patient.age || !patient.sex) {
      res.status(400).json({
        success: false,
        message: 'Please complete your profile. Add your age and sex in profile settings before using AI interpretation.',
      });
      return;
    }

    // 6. Build patient profile and interpret
    const pdfBuffer = Buffer.isBuffer(booking.reportData)
      ? booking.reportData
      : Buffer.from((booking.reportData as any)?.buffer || booking.reportData);

    let interpretation;
    try {
      interpretation = await interpretReport(pdfBuffer, {
        age: patient.age,
        sex: patient.sex,
        weight: (patient as any).weight,
        conditions: patient.conditions || [],
      });
    } catch (error: any) {
      console.error('AI interpretation failed:', error);
      const msg = error.message || '';

      if (msg.includes('Could not read') || msg.includes('Could not identify') || msg.includes('No valid')) {
        res.status(422).json({ success: false, message: msg });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'AI interpretation failed. Please try again later.',
      });
      return;
    }

    // 7. Handle versioning — check for existing interpretation
    let version = 1;
    const existing = await AiInterpretation.findOne({ booking: bookingId });
    if (existing) {
      version = existing.version + 1;
      await AiInterpretation.deleteOne({ _id: existing._id });
    }

    // 8. Save new interpretation
    const newInterpretation = await AiInterpretation.create({
      booking: bookingId,
      patient: req.user?.id,
      overallClassification: interpretation.overallClassification,
      verdictMessage: interpretation.verdictMessage,
      results: interpretation.results,
      extractionMethod: interpretation.extractionMethod,
      llmUsed: interpretation.llmUsed,
      version,
    });

    // 9. Return result
    res.status(200).json({
      success: true,
      data: newInterpretation,
    });
  } catch (error: any) {
    console.error('Generate interpretation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate interpretation.',
      error: error.message,
    });
  }
};

// ============================================
// GET INTERPRETATION (GET /:bookingId/interpret)
// ============================================
export const getInterpretation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;

    const interpretation = await AiInterpretation.findOne({ booking: bookingId });

    if (!interpretation) {
      res.status(404).json({
        success: false,
        message: 'No interpretation found. Click Interpret with AI to generate one.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: interpretation,
    });
  } catch (error: any) {
    console.error('Get interpretation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interpretation.',
      error: error.message,
    });
  }
};
