import { Request, Response } from 'express';
import PhlebotomistRequest from '../models/PhlebotomistRequest';
import Booking from '../models/Booking';
import Phlebotomist from '../models/Phlebotomist';
import { createNotification } from './notification.controller';

// ============================================
// GET AVAILABLE PHLEBOTOMISTS FOR BOOKING (Lab)
// ============================================
export const getAvailablePhlebotomists = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bookingId } = req.params;
        const labId = req.user?.id;

        // Verify booking exists and belongs to lab
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }

        if (booking.lab.toString() !== labId) {
            res.status(403).json({ success: false, message: 'Not authorized to access this booking' });
            return;
        }

        // Get all phlebotomists and filter in memory to rely on Mongoose defaults
        const allPhlebotomists = await Phlebotomist.find({}).select('fullName email phone isAvailable isActive isVerified');

        console.log('🔍 Filtering in memory...');
        const phlebotomists = allPhlebotomists.filter(p => {
            const valid = p.isAvailable === true && p.isActive === true;
            console.log(`- ${p.fullName}: Available=${p.isAvailable}, Active=${p.isActive} -> Keep? ${valid}`);
            return valid;
        });

        console.log('✅ Found available phlebotomists (filtered):', phlebotomists.length);

        // Get workload for each phlebotomist (count of pending/confirmed bookings)
        const phlebotomistsWithWorkload = await Promise.all(
            phlebotomists.map(async (phleb) => {
                const workload = await Booking.countDocuments({
                    phlebotomist: phleb._id,
                    status: { $in: ['pending', 'confirmed', 'in-progress'] },
                });

                return {
                    _id: phleb._id,
                    name: phleb.fullName, // Map fullName to name for frontend
                    fullName: phleb.fullName,
                    email: phleb.email,
                    phone: phleb.phone,
                    isAvailable: phleb.isAvailable,
                    currentWorkload: workload,
                };
            })
        );

        // Sort by workload (ascending)
        phlebotomistsWithWorkload.sort((a, b) => a.currentWorkload - b.currentWorkload);

        res.status(200).json({
            success: true,
            data: phlebotomistsWithWorkload, // Use 'data' property as expected by frontend service
        });
    } catch (error: any) {
        console.error('Get available phlebotomists error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get available phlebotomists',
            error: error.message,
        });
    }
};

// ============================================
// SEND ASSIGNMENT REQUEST (Lab)
// ============================================
export const sendRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bookingId, phlebotomistId } = req.body;
        const labId = req.user?.id;

        // Verify booking exists and belongs to lab
        const booking = await Booking.findById(bookingId).populate('patient', 'fullName email');
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }

        if (booking.lab.toString() !== labId) {
            res.status(403).json({ success: false, message: 'Not authorized to access this booking' });
            return;
        }

        // Check if booking already has a phlebotomist assigned
        if (booking.phlebotomist) {
            res.status(400).json({ success: false, message: 'Phlebotomist already assigned to this booking' });
            return;
        }

        // Check if there's already a pending request for this booking and phlebotomist
        const existingRequest = await PhlebotomistRequest.findOne({
            booking: bookingId,
            phlebotomist: phlebotomistId,
            status: 'pending',
        });

        if (existingRequest) {
            res.status(400).json({ success: false, message: 'Request already sent to this phlebotomist' });
            return;
        }

        // Verify phlebotomist exists and is available
        const phlebotomist = await Phlebotomist.findById(phlebotomistId);
        if (!phlebotomist) {
            res.status(404).json({ success: false, message: 'Phlebotomist not found' });
            return;
        }

        if (!phlebotomist.isAvailable || !phlebotomist.isActive) {
            res.status(400).json({ success: false, message: 'Phlebotomist is not available' });
            return;
        }

        // Create request
        const request = await PhlebotomistRequest.create({
            booking: bookingId,
            lab: labId,
            phlebotomist: phlebotomistId,
            status: 'pending',
        });

        // Update booking status
        booking.phlebotomistRequestStatus = 'pending';
        if (!booking.assignmentHistory) {
            booking.assignmentHistory = [];
        }
        booking.assignmentHistory.push(request._id);
        await booking.save();

        // Populate request for response
        await request.populate([
            { path: 'booking', populate: { path: 'tests', select: 'name' } },
            { path: 'lab', select: 'labName' },
            { path: 'phlebotomist', select: 'fullName email' },
        ]);

        // Send notification to phlebotomist
        try {
            const { sendPhlebotomistRequestEmail } = await import('../services/email.service');
            const labInfo = await import('../models/Lab').then(m => m.default.findById(labId).select('labName'));

            await sendPhlebotomistRequestEmail(
                phlebotomist.email,
                phlebotomist.fullName,
                labInfo?.labName || 'Lab',
                (booking as any).patient.fullName,
                new Date(booking.bookingDate).toLocaleDateString(),
                booking.preferredTimeSlot
            );

            await createNotification({
                user: phlebotomistId,
                userType: 'phlebotomist',
                type: 'phlebotomist_request_sent',
                title: 'New Assignment Request 🔔',
                message: `You have a new assignment request from ${labInfo?.labName || 'a lab'}.`,
                relatedBooking: bookingId,
                metadata: {
                    labId,
                    labName: labInfo?.labName,
                    patientName: (booking as any).patient.fullName,
                    bookingDate: booking.bookingDate,
                },
            });

            console.log(`✅ Request notification sent to phlebotomist ${phlebotomistId}`);
        } catch (notifError) {
            console.error('❌ Failed to send request notification:', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'Assignment request sent successfully',
            request,
        });
    } catch (error: any) {
        console.error('Send request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send assignment request',
            error: error.message,
        });
    }
};

// ============================================
// GET MY REQUESTS (Phlebotomist)
// ============================================
export const getMyRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const phlebotomistId = req.user?.id;

        const requests = await PhlebotomistRequest.find({
            phlebotomist: phlebotomistId,
            status: 'pending',
        })
            .populate('booking')
            .populate({
                path: 'booking',
                populate: [
                    { path: 'patient', select: 'fullName email phone' },
                    { path: 'tests', select: 'name description' },
                ],
            })
            .populate('lab', 'labName email phone')
            .sort({ requestedAt: -1 });

        res.status(200).json({
            success: true,
            data: requests,
        });
    } catch (error: any) {
        console.error('Get my requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get requests',
            error: error.message,
        });
    }
};

// ============================================
// ACCEPT REQUEST (Phlebotomist)
// ============================================
export const acceptRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { requestId } = req.params;
        const phlebotomistId = req.user?.id;

        const request = await PhlebotomistRequest.findById(requestId);
        if (!request) {
            res.status(404).json({ success: false, message: 'Request not found' });
            return;
        }

        if (request.phlebotomist.toString() !== phlebotomistId) {
            res.status(403).json({ success: false, message: 'Not authorized to accept this request' });
            return;
        }

        if (request.status !== 'pending') {
            res.status(400).json({ success: false, message: 'Request is no longer pending' });
            return;
        }

        // Get booking
        const booking = await Booking.findById(request.booking).populate('patient', 'fullName email');
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }

        // Check if booking already has a phlebotomist (race condition)
        if (booking.phlebotomist) {
            res.status(400).json({ success: false, message: 'Booking already has an assigned phlebotomist' });
            return;
        }

        // Update request
        request.status = 'accepted';
        request.respondedAt = new Date();
        await request.save();

        // Assign phlebotomist to booking
        booking.phlebotomist = request.phlebotomist;
        booking.phlebotomistRequestStatus = 'assigned';
        booking.status = 'confirmed';
        await booking.save();

        // Reject all other pending requests for this booking
        await PhlebotomistRequest.updateMany(
            {
                booking: booking._id,
                _id: { $ne: requestId },
                status: 'pending',
            },
            {
                status: 'rejected',
                respondedAt: new Date(),
                rejectionReason: 'Another phlebotomist was assigned',
            }
        );

        // Get phlebotomist and lab info
        const phlebotomist = await Phlebotomist.findById(phlebotomistId).select('fullName email phone');
        const lab = await import('../models/Lab').then(m => m.default.findById(booking.lab).select('labName email'));

        // Send notifications
        try {
            const { sendRequestAcceptedEmail, sendPhlebotomistAssignedEmail } = await import('../services/email.service');

            // Notify lab
            if (lab) {
                await sendRequestAcceptedEmail(
                    lab.email,
                    lab.labName,
                    phlebotomist?.fullName || 'Phlebotomist',
                    (booking as any).patient.fullName,
                    new Date(booking.bookingDate).toLocaleDateString()
                );

                await createNotification({
                    user: booking.lab.toString(),
                    userType: 'lab',
                    type: 'phlebotomist_request_accepted',
                    title: 'Request Accepted ✅',
                    message: `${phlebotomist?.fullName} accepted your assignment request.`,
                    relatedBooking: booking._id.toString(),
                });
            }

            // Notify patient
            if ((booking as any).patient) {
                await sendPhlebotomistAssignedEmail(
                    (booking as any).patient.email,
                    (booking as any).patient.fullName,
                    phlebotomist?.fullName || 'Phlebotomist',
                    phlebotomist?.phone || '',
                    new Date(booking.bookingDate).toLocaleDateString(),
                    booking.preferredTimeSlot
                );

                await createNotification({
                    user: booking.patient.toString(),
                    userType: 'patient',
                    type: 'phlebotomist_assigned',
                    title: 'Phlebotomist Assigned 👨‍⚕️',
                    message: `${phlebotomist?.fullName} has been assigned to your appointment.`,
                    relatedBooking: booking._id.toString(),
                });
            }

            console.log(`✅ Acceptance notifications sent for booking ${booking._id}`);
        } catch (notifError) {
            console.error('❌ Failed to send acceptance notifications:', notifError);
        }

        res.status(200).json({
            success: true,
            message: 'Request accepted successfully',
            request,
        });
    } catch (error: any) {
        console.error('Accept request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept request',
            error: error.message,
        });
    }
};

// ============================================
// REJECT REQUEST (Phlebotomist)
// ============================================
export const rejectRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { requestId } = req.params;
        const { rejectionReason } = req.body;
        const phlebotomistId = req.user?.id;

        const request = await PhlebotomistRequest.findById(requestId);
        if (!request) {
            res.status(404).json({ success: false, message: 'Request not found' });
            return;
        }

        if (request.phlebotomist.toString() !== phlebotomistId) {
            res.status(403).json({ success: false, message: 'Not authorized to reject this request' });
            return;
        }

        if (request.status !== 'pending') {
            res.status(400).json({ success: false, message: 'Request is no longer pending' });
            return;
        }

        // Update request
        request.status = 'rejected';
        request.respondedAt = new Date();
        request.rejectionReason = rejectionReason || 'No reason provided';
        await request.save();

        // Update booking
        const booking = await Booking.findById(request.booking);
        if (booking) {
            booking.phlebotomistRequestStatus = 'rejected';
            await booking.save();
        }

        // Get phlebotomist and lab info
        const phlebotomist = await Phlebotomist.findById(phlebotomistId).select('fullName');
        const lab = await import('../models/Lab').then(m => m.default.findById(request.lab).select('labName email'));

        // Send notification to lab
        try {
            const { sendRequestRejectedEmail } = await import('../services/email.service');

            if (lab && booking) {
                await sendRequestRejectedEmail(
                    lab.email,
                    lab.labName,
                    phlebotomist?.fullName || 'Phlebotomist',
                    rejectionReason || 'No reason provided',
                    new Date(booking.bookingDate).toLocaleDateString()
                );

                await createNotification({
                    user: request.lab.toString(),
                    userType: 'lab',
                    type: 'phlebotomist_request_rejected',
                    title: 'Request Rejected ❌',
                    message: `${phlebotomist?.fullName} declined your assignment request.`,
                    relatedBooking: booking._id.toString(),
                    metadata: {
                        reason: rejectionReason,
                    },
                });
            }

            console.log(`✅ Rejection notification sent to lab ${request.lab}`);
        } catch (notifError) {
            console.error('❌ Failed to send rejection notification:', notifError);
        }

        res.status(200).json({
            success: true,
            message: 'Request rejected successfully',
            request,
        });
    } catch (error: any) {
        console.error('Reject request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject request',
            error: error.message,
        });
    }
};

// ============================================
// GET REQUEST HISTORY FOR BOOKING (Lab)
// ============================================
export const getRequestHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bookingId } = req.params;
        const labId = req.user?.id;

        // Verify booking exists and belongs to lab
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }

        if (booking.lab.toString() !== labId) {
            res.status(403).json({ success: false, message: 'Not authorized to access this booking' });
            return;
        }

        const requests = await PhlebotomistRequest.find({
            booking: bookingId,
        })
            .populate('phlebotomist', 'fullName email phone')
            .sort({ requestedAt: -1 });

        res.status(200).json({
            success: true,
            requests,
        });
    } catch (error: any) {
        console.error('Get request history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get request history',
            error: error.message,
        });
    }
};
