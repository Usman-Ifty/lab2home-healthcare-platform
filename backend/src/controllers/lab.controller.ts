import { Request, Response } from 'express';
import Lab from '../models/Lab';
import Test from '../models/Test';
import Booking from '../models/Booking';

// ============================================
// GET AVAILABLE LABS (Labs that have configured tests)
// ============================================
export const getAvailableLabs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { testId } = req.query;

        const query: any = {
            isActive: true,
            isVerified: true,
            hasConfiguredTests: true,
        };

        // If testId is provided, filter labs that offer this test
        if (testId) {
            query.availableTests = testId;
        }

        const labs = await Lab.find(query)
            .populate('availableTests', 'name category basePrice reportDeliveryTime')
            .select('labName email phone labAddress operatingHours availableTests timeSlots')
            .sort({ labName: 1 });

        res.status(200).json({
            success: true,
            count: labs.length,
            data: labs,
        });
    } catch (error: any) {
        console.error('Get available labs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available labs',
            error: error.message,
        });
    }
};

// ============================================
// GET LAB'S AVAILABLE TESTS
// ============================================
export const getLabTests = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const lab = await Lab.findById(id).populate('availableTests', 'name description category basePrice reportDeliveryTime preparationInstructions sampleType');

        if (!lab) {
            res.status(404).json({
                success: false,
                message: 'Lab not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: lab,
        });
    } catch (error: any) {
        console.error('Get lab tests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch lab tests',
            error: error.message,
        });
    }
};

// ============================================
// UPDATE LAB'S AVAILABLE TESTS
// ============================================
export const updateLabTests = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { testIds } = req.body;

        // Authorization: Ensure the requesting user is the lab
        if (req.user?.userType !== 'lab' || req.user?.id.toString() !== id.toString()) {
            res.status(403).json({
                success: false,
                message: 'You are not authorized to update this lab',
            });
            return;
        }

        if (!testIds || !Array.isArray(testIds)) {
            res.status(400).json({
                success: false,
                message: 'testIds array is required',
            });
            return;
        }

        // Verify all test IDs exist
        const tests = await Test.find({ _id: { $in: testIds } });
        if (tests.length !== testIds.length) {
            res.status(400).json({
                success: false,
                message: 'One or more test IDs are invalid',
            });
            return;
        }

        const lab = await Lab.findByIdAndUpdate(
            id,
            {
                availableTests: testIds,
                hasConfiguredTests: testIds.length > 0,
            },
            { new: true, runValidators: true }
        ).populate('availableTests', 'name category basePrice');

        if (!lab) {
            res.status(404).json({
                success: false,
                message: 'Lab not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Lab tests updated successfully',
            data: lab,
        });
    } catch (error: any) {
        console.error('Update lab tests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update lab tests',
            error: error.message,
        });
    }
};

// ============================================
// GET LABS OFFERING A SPECIFIC TEST
// ============================================
export const getLabsByTest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { testId } = req.params;

        const test = await Test.findById(testId);
        if (!test) {
            res.status(404).json({
                success: false,
                message: 'Test not found',
            });
            return;
        }

        const labs = await Lab.find({
            isActive: true,
            isVerified: true,
            hasConfiguredTests: true,
            availableTests: testId,
        })
            .select('labName email phone labAddress operatingHours')
            .sort({ labName: 1 });

        res.status(200).json({
            success: true,
            count: labs.length,
            data: {
                test: {
                    id: test._id,
                    name: test.name,
                    category: test.category,
                    basePrice: test.basePrice,
                },
                labs,
            },
        });
    } catch (error: any) {
        console.error('Get labs by test error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch labs',
            error: error.message,
        });
    }
};

// ============================================
// UPDATE LAB TIME SLOTS
// ============================================
export const updateLabTimeSlots = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { timeSlots } = req.body;

        // Authorization: Ensure the requesting user is the lab
        if (req.user?.userType !== 'lab' || req.user?.id.toString() !== id.toString()) {
            res.status(403).json({
                success: false,
                message: 'You are not authorized to update this lab',
            });
            return;
        }

        if (!timeSlots || !Array.isArray(timeSlots)) {
            res.status(400).json({
                success: false,
                message: 'timeSlots array is required',
            });
            return;
        }

        // Validate time slot format
        const isValid = timeSlots.every(
            (slot: any) =>
                slot.time &&
                typeof slot.time === 'string' &&
                typeof slot.isActive === 'boolean'
        );

        if (!isValid) {
            res.status(400).json({
                success: false,
                message: 'Invalid time slot format. Each slot must have time (string) and isActive (boolean)',
            });
            return;
        }

        const lab = await Lab.findByIdAndUpdate(
            id,
            { timeSlots },
            { new: true, runValidators: true }
        ).select('labName timeSlots operatingHours');

        if (!lab) {
            res.status(404).json({
                success: false,
                message: 'Lab not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Time slots updated successfully',
            data: lab,
        });
    } catch (error: any) {
        console.error('Update lab time slots error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update time slots',
            error: error.message,
        });
    }
};

// ============================================
// GET AVAILABLE TIME SLOTS FOR A LAB ON A SPECIFIC DATE
// ============================================
export const getAvailableTimeSlots = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { date } = req.query;

        if (!date) {
            res.status(400).json({
                success: false,
                message: 'Date parameter is required (format: YYYY-MM-DD)',
            });
            return;
        }

        const lab = await Lab.findById(id).select('labName timeSlots');

        if (!lab) {
            res.status(404).json({
                success: false,
                message: 'Lab not found',
            });
            return;
        }

        // Get all active time slots from lab configuration
        const activeSlots = lab.timeSlots?.filter(slot => slot.isActive) || [];

        // Get existing bookings for this lab on this date
        const startDate = new Date(date as string);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        const existingBookings = await Booking.find({
            lab: id,
            bookingDate: {
                $gte: startDate,
                $lt: endDate,
            },
            status: { $nin: ['cancelled'] }, // Exclude cancelled bookings
        }).select('preferredTimeSlot');

        // Get booked time slots
        const bookedSlots = existingBookings.map(b => b.preferredTimeSlot);

        // Filter out booked slots
        const availableSlots = activeSlots.filter(
            slot => !bookedSlots.includes(slot.time)
        );

        res.status(200).json({
            success: true,
            data: {
                labName: lab.labName,
                date,
                availableSlots: availableSlots.map(s => s.time),
                bookedSlots,
            },
        });
    } catch (error: any) {
        console.error('Get available time slots error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available time slots',
            error: error.message,
        });
    }
};
