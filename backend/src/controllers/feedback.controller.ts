import { Request, Response } from 'express';
import Feedback from '../models/Feedback';
import Lab from '../models/Lab';
import Phlebotomist from '../models/Phlebotomist';
import Product from '../models/Product';
import mongoose from 'mongoose';

// Model map for dynamic lookups
const modelMap: Record<string, mongoose.Model<any>> = {
    lab: Lab,
    phlebotomist: Phlebotomist,
    product: Product,
};

// ============================================
// HELPER: Recalculate rating for a target
// ============================================
const recalculateRating = async (targetType: string, targetId: string) => {
    const Model = modelMap[targetType];
    if (!Model) return;

    const result = await Feedback.aggregate([
        {
            $match: {
                targetType,
                targetId: new mongoose.Types.ObjectId(targetId),
            },
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
            },
        },
    ]);

    const stats = result[0] || { averageRating: 0, totalReviews: 0 };

    await Model.findByIdAndUpdate(targetId, {
        averageRating: Math.round(stats.averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: stats.totalReviews,
    });
};

// ============================================
// SUBMIT FEEDBACK
// ============================================
export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user?.id;
        const { targetType, targetId, rating, comment, booking, order } = req.body;

        // Validate target type
        if (!['lab', 'phlebotomist', 'product'].includes(targetType)) {
            res.status(400).json({
                success: false,
                message: 'Invalid target type. Must be lab, phlebotomist, or product.',
            });
            return;
        }

        // Validate target exists
        const Model = modelMap[targetType];
        const target = await Model.findById(targetId);
        if (!target) {
            res.status(404).json({
                success: false,
                message: `${targetType.charAt(0).toUpperCase() + targetType.slice(1)} not found.`,
            });
            return;
        }

        // Check for existing review
        const existingFeedback = await Feedback.findOne({
            patient: patientId,
            targetType,
            targetId,
        });

        if (existingFeedback) {
            res.status(409).json({
                success: false,
                message: 'You have already reviewed this item. Use the update endpoint instead.',
            });
            return;
        }

        // Create feedback
        const feedback = await Feedback.create({
            patient: patientId,
            targetType,
            targetId,
            rating,
            comment,
            booking,
            order,
        });

        // Recalculate rating
        await recalculateRating(targetType, targetId);

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully!',
            data: feedback,
        });
    } catch (error: any) {
        console.error('Error submitting feedback:', error);

        if (error.code === 11000) {
            res.status(409).json({
                success: false,
                message: 'You have already reviewed this item.',
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback.',
            error: error.message,
        });
    }
};

// ============================================
// GET FEEDBACK FOR A TARGET
// ============================================
export const getFeedbackForTarget = async (req: Request, res: Response): Promise<void> => {
    try {
        const { targetType, targetId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        if (!['lab', 'phlebotomist', 'product'].includes(targetType)) {
            res.status(400).json({
                success: false,
                message: 'Invalid target type.',
            });
            return;
        }

        const [feedbacks, total] = await Promise.all([
            Feedback.find({ targetType, targetId })
                .populate('patient', 'fullName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Feedback.countDocuments({ targetType, targetId }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                feedbacks,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit),
                    limit,
                },
            },
        });
    } catch (error: any) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback.',
            error: error.message,
        });
    }
};

// ============================================
// GET RATING STATS FOR A TARGET
// ============================================
export const getRatingStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { targetType, targetId } = req.params;

        if (!['lab', 'phlebotomist', 'product'].includes(targetType)) {
            res.status(400).json({
                success: false,
                message: 'Invalid target type.',
            });
            return;
        }

        const [statsResult, distributionResult] = await Promise.all([
            Feedback.aggregate([
                {
                    $match: {
                        targetType,
                        targetId: new mongoose.Types.ObjectId(targetId),
                    },
                },
                {
                    $group: {
                        _id: null,
                        averageRating: { $avg: '$rating' },
                        totalReviews: { $sum: 1 },
                    },
                },
            ]),
            Feedback.aggregate([
                {
                    $match: {
                        targetType,
                        targetId: new mongoose.Types.ObjectId(targetId),
                    },
                },
                {
                    $group: {
                        _id: '$rating',
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { _id: -1 },
                },
            ]),
        ]);

        const stats = statsResult[0] || { averageRating: 0, totalReviews: 0 };

        // Build distribution object (1-5 stars)
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distributionResult.forEach((d: any) => {
            distribution[d._id] = d.count;
        });

        res.status(200).json({
            success: true,
            data: {
                averageRating: Math.round(stats.averageRating * 10) / 10,
                totalReviews: stats.totalReviews,
                distribution,
            },
        });
    } catch (error: any) {
        console.error('Error fetching rating stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rating stats.',
            error: error.message,
        });
    }
};

// ============================================
// GET MY REVIEWS (Patient)
// ============================================
export const getMyReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user?.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const targetType = req.query.targetType as string;

        const filter: any = { patient: patientId };
        if (targetType && ['lab', 'phlebotomist', 'product'].includes(targetType)) {
            filter.targetType = targetType;
        }

        const [feedbacks, total] = await Promise.all([
            Feedback.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Feedback.countDocuments(filter),
        ]);

        // Populate target names manually since we have polymorphic refs
        const populatedFeedbacks = await Promise.all(
            feedbacks.map(async (fb: any) => {
                const Model = modelMap[fb.targetType];
                if (Model) {
                    const target = await Model.findById(fb.targetId)
                        .select('fullName labName name email')
                        .lean();
                    return {
                        ...fb,
                        target: target || null,
                    };
                }
                return { ...fb, target: null };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                feedbacks: populatedFeedbacks,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit),
                    limit,
                },
            },
        });
    } catch (error: any) {
        console.error('Error fetching my reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your reviews.',
            error: error.message,
        });
    }
};

// ============================================
// UPDATE FEEDBACK
// ============================================
export const updateFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user?.id;
        const { id } = req.params;
        const { rating, comment } = req.body;

        const feedback = await Feedback.findById(id);
        if (!feedback) {
            res.status(404).json({
                success: false,
                message: 'Feedback not found.',
            });
            return;
        }

        // Check ownership
        if (feedback.patient.toString() !== patientId) {
            res.status(403).json({
                success: false,
                message: 'You can only update your own reviews.',
            });
            return;
        }

        // Update fields
        if (rating !== undefined) feedback.rating = rating;
        if (comment !== undefined) feedback.comment = comment;
        await feedback.save();

        // Recalculate rating
        await recalculateRating(feedback.targetType, feedback.targetId.toString());

        res.status(200).json({
            success: true,
            message: 'Feedback updated successfully!',
            data: feedback,
        });
    } catch (error: any) {
        console.error('Error updating feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update feedback.',
            error: error.message,
        });
    }
};

// ============================================
// DELETE FEEDBACK
// ============================================
export const deleteFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user?.id;
        const { id } = req.params;

        const feedback = await Feedback.findById(id);
        if (!feedback) {
            res.status(404).json({
                success: false,
                message: 'Feedback not found.',
            });
            return;
        }

        // Check ownership
        if (feedback.patient.toString() !== patientId) {
            res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews.',
            });
            return;
        }

        const { targetType, targetId } = feedback;
        await Feedback.findByIdAndDelete(id);

        // Recalculate rating
        await recalculateRating(targetType, targetId.toString());

        res.status(200).json({
            success: true,
            message: 'Feedback deleted successfully!',
        });
    } catch (error: any) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete feedback.',
            error: error.message,
        });
    }
};

// ============================================
// CHECK IF PATIENT HAS REVIEWED A TARGET
// ============================================
export const checkExistingFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
        const patientId = req.user?.id;
        const { targetType, targetId } = req.params;

        const feedback = await Feedback.findOne({
            patient: patientId,
            targetType,
            targetId,
        });

        res.status(200).json({
            success: true,
            data: {
                hasReviewed: !!feedback,
                feedback: feedback || null,
            },
        });
    } catch (error: any) {
        console.error('Error checking feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check feedback status.',
            error: error.message,
        });
    }
};

// ============================================
// GET ALL PRODUCT REVIEWS (Admin)
// ============================================
export const getAllProductReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [feedbacks, total] = await Promise.all([
            Feedback.find({ targetType: 'product' })
                .populate('patient', 'fullName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Feedback.countDocuments({ targetType: 'product' }),
        ]);

        // Populate target (product names) manually since we have polymorphic refs
        const populatedFeedbacks = await Promise.all(
            feedbacks.map(async (fb: any) => {
                const target = await Product.findById(fb.targetId).select('name price imageUrl').lean();
                return {
                    ...fb,
                    target: target || null,
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                feedbacks: populatedFeedbacks,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit),
                    limit,
                },
            },
        });
    } catch (error: any) {
        console.error('Error fetching all product reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product reviews.',
            error: error.message,
        });
    }
};
