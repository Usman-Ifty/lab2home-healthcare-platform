import { Request, Response } from 'express';
import Phlebotomist from '../models/Phlebotomist';
import Booking from '../models/Booking';

// ============================================
// GET TRAFFIC LICENSE FILE
// ============================================
export const getTrafficLicense = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'phlebotomist') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only phlebotomists can access their license.',
      });
      return;
    }

    const phlebotomist = await Phlebotomist.findById(req.user.id);

    if (!phlebotomist || !phlebotomist.trafficLicense) {
      res.status(404).json({
        success: false,
        message: 'Traffic license not found',
      });
      return;
    }

    // Set proper headers for file download
    res.set({
      'Content-Type': phlebotomist.trafficLicense.contentType,
      'Content-Disposition': `inline; filename="${phlebotomist.trafficLicense.filename}"`,
      'Content-Length': phlebotomist.trafficLicense.size,
    });

    // Send the file buffer
    res.send(phlebotomist.trafficLicense.data);

  } catch (error: any) {
    console.error('Get traffic license error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve traffic license',
      error: error.message,
    });
  }
};

// ============================================
// GET PHLEBOTOMIST DASHBOARD DATA (Enhanced with Real Data)
// ============================================
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'phlebotomist') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Execute queries in parallel for better performance
    const [phlebotomist, todaysBookings, pendingRequests] = await Promise.all([
      Phlebotomist.findById(req.user!.id)
        .select('-trafficLicense -password')
        .populate('assignedLab', 'labName email phone labAddress'),

      Booking.find({
        phlebotomist: req.user!.id,
        bookingDate: { $gte: today, $lt: tomorrow },
      })
        .populate('patient', 'fullName phone address')
        .populate('lab', 'labName phone labAddress')
        .populate('tests', 'name category')
        .select('-reportData')
        .sort({ preferredTimeSlot: 1 }),

      import('../models/PhlebotomistRequest').then(m =>
        m.default.countDocuments({
          phlebotomist: req.user!.id,
          status: 'pending'
        })
      )
    ]);

    if (!phlebotomist) {
      res.status(404).json({
        success: false,
        message: 'Phlebotomist not found',
      });
      return;
    }

    // Get completed bookings today
    const completedToday = todaysBookings.filter(
      (booking) => booking.status === 'completed' || booking.status === 'sample_collected'
    );

    // Get in-progress bookings
    const inProgress = todaysBookings.filter(
      (booking) => booking.status === 'in-progress'
    );

    // Get pending/confirmed bookings (remaining)
    const remaining = todaysBookings.filter(
      (booking) => booking.status === 'pending' || booking.status === 'confirmed'
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          fullName: phlebotomist.fullName,
          email: phlebotomist.email,
          phone: phlebotomist.phone,
          qualification: phlebotomist.qualification,
          availability: phlebotomist.isAvailable,
          assignedLab: phlebotomist.assignedLab,
        },
        stats: {
          todaysCollections: todaysBookings.length,
          completed: completedToday.length,
          inProgress: inProgress.length,
          remaining: remaining.length,
          pendingRequests: pendingRequests
        },
        schedule: todaysBookings,
        completedToday: completedToday,
      },
    });

  } catch (error: any) {
    console.error('Get phlebotomist dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
    });
  }
};

// ============================================
// GET ASSIGNED BOOKINGS
// ============================================
export const getAssignedBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'phlebotomist') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const { status, date } = req.query;

    // Build query
    const query: any = { phlebotomist: req.user.id };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by date if provided
    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.bookingDate = { $gte: startDate, $lt: endDate };
    }

    const bookings = await Booking.find(query)
      .populate('patient', 'fullName email phone address dateOfBirth')
      .populate('lab', 'labName email phone labAddress')
      .populate('tests', 'name description category basePrice reportDeliveryTime preparationInstructions')
      .select('-reportData')
      .sort({ bookingDate: 1, preferredTimeSlot: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });

  } catch (error: any) {
    console.error('Get assigned bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned bookings',
      error: error.message,
    });
  }
};

// ============================================
// GET TODAY'S BOOKINGS
// ============================================
export const getTodaysBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'phlebotomist') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookings = await Booking.find({
      phlebotomist: req.user.id,
      bookingDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'in-progress'] },
    })
      .populate('patient', 'fullName phone address')
      .populate('lab', 'labName phone labAddress')
      .populate('tests', 'name category')
      .select('-reportData')
      .sort({ preferredTimeSlot: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });

  } catch (error: any) {
    console.error('Get today\'s bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s bookings',
      error: error.message,
    });
  }
};

// ============================================
// UPDATE BOOKING STATUS (Phlebotomist)
// ============================================
export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'phlebotomist') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const { id } = req.params;
    const { status, notes, sampleDetails } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Status is required',
      });
      return;
    }

    // Find booking
    const booking = await Booking.findById(id);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Verify this phlebotomist is assigned to this booking
    if (booking.phlebotomist?.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'You are not assigned to this booking',
      });
      return;
    }

    // Validate status transition
    const allowedStatuses = ['in-progress', 'sample_collected', 'completed'];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Phlebotomists can only set status to in-progress, sample_collected or completed',
      });
      return;
    }

    const oldStatus = booking.status;

    // Update booking status
    booking.status = status;

    // Update notes if provided
    if (notes) {
      booking.notes = notes;
    }

    // If sample collected, save sample collection details
    if (status === 'sample_collected') {
      booking.sampleCollection = {
        collectedAt: sampleDetails?.collectedAt ? new Date(sampleDetails.collectedAt) : new Date(),
        sampleId: sampleDetails?.sampleId || undefined,
        notes: notes,
        collectedBy: req.user.id as any
      };
    }

    await booking.save();

    // Populate for response
    await booking.populate([
      { path: 'patient', select: 'fullName email phone' },
      { path: 'lab', select: 'labName email phone' },
      { path: 'tests', select: 'name description' },
    ]);

    // Send notifications
    if (oldStatus !== status) {
      try {
        const { createNotification } = await import('./notification.controller');
        const testNames = (booking.tests as any[]).map(t => t.name).join(', ');

        // Notify patient
        if (status === 'in-progress') {
          await createNotification({
            user: (booking.patient as any)._id.toString(),
            userType: 'patient',
            type: 'status_update',
            title: 'Sample Collection Started 🔬',
            message: `Your sample collection for ${testNames} has started.`,
            relatedBooking: booking._id.toString(),
          });
        }

        // Notify lab when collection is complete
        if (status === 'completed') {
          await createNotification({
            user: (booking.lab as any)._id.toString(),
            userType: 'lab',
            type: 'status_update',
            title: 'Sample Collected ✅',
            message: `Sample for ${testNames} has been collected. Please upload the report.`,
            relatedBooking: booking._id.toString(),
          });
        }

        console.log(`✅ Notifications sent for booking status update: ${oldStatus} → ${status}`);
      } catch (notificationError) {
        console.error('❌ Failed to send notifications:', notificationError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking,
    });

  } catch (error: any) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message,
    });
  }
};

// ============================================
// UPDATE AVAILABILITY
// ============================================
export const updateAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'phlebotomist') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const { availability } = req.body;

    if (typeof availability !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'Availability must be a boolean value',
      });
      return;
    }

    const phlebotomist = await Phlebotomist.findById(req.user.id);

    if (!phlebotomist) {
      res.status(404).json({
        success: false,
        message: 'Phlebotomist not found',
      });
      return;
    }

    phlebotomist.isAvailable = availability;
    await phlebotomist.save();

    // Notify assigned lab if going offline
    if (!availability && phlebotomist.assignedLab) {
      try {
        const { createNotification } = await import('./notification.controller');
        await createNotification({
          user: phlebotomist.assignedLab.toString(),
          userType: 'lab',
          type: 'phlebotomist_unavailable',
          title: 'Phlebotomist Unavailable',
          message: `${phlebotomist.fullName} is now unavailable.`,
        });
      } catch (notificationError) {
        console.error('Failed to send availability notification:', notificationError);
      }
    }

    res.status(200).json({
      success: true,
      message: `Availability updated to ${availability ? 'available' : 'unavailable'}`,
      data: {
        availability: phlebotomist.isAvailable,
      },
    });

  } catch (error: any) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message,
    });
  }
};

// ============================================
// GET PERFORMANCE METRICS
// ============================================
export const getPerformanceMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'phlebotomist') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // Get date ranges
    const now = new Date();

    // This week (Monday to Sunday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // This month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Total completed bookings
    const totalCompleted = await Booking.countDocuments({
      phlebotomist: req.user.id,
      status: 'completed',
    });

    // This week's completed bookings
    const weekCompleted = await Booking.countDocuments({
      phlebotomist: req.user.id,
      status: 'completed',
      updatedAt: { $gte: startOfWeek },
    });

    // This month's completed bookings
    const monthCompleted = await Booking.countDocuments({
      phlebotomist: req.user.id,
      status: 'completed',
      updatedAt: { $gte: startOfMonth },
    });

    // Get all completed bookings for average calculation
    const completedBookings = await Booking.find({
      phlebotomist: req.user.id,
      status: 'completed',
    }).select('createdAt updatedAt');

    // Calculate average completion time (in hours)
    let averageCompletionTime = 0;
    if (completedBookings.length > 0) {
      const totalTime = completedBookings.reduce((sum, booking) => {
        const diff = booking.updatedAt.getTime() - booking.createdAt.getTime();
        return sum + diff;
      }, 0);
      averageCompletionTime = totalTime / completedBookings.length / (1000 * 60 * 60); // Convert to hours
    }

    res.status(200).json({
      success: true,
      data: {
        totalCompleted,
        thisWeek: weekCompleted,
        thisMonth: monthCompleted,
        averageCompletionTime: `${averageCompletionTime.toFixed(1)} hours`,
        completionRate: totalCompleted > 0 ? '100%' : '0%', // Can be enhanced with more logic
      },
    });

  } catch (error: any) {
    console.error('Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance metrics',
      error: error.message,
    });
  }
};
