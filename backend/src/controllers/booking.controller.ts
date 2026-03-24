import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Test from '../models/Test';
import Lab from '../models/Lab';
import Patient from '../models/Patient';
import * as payfastService from '../services/payfast.service';
import Notification from '../models/Notification';

// ============================================
// CREATE BOOKING (Patient)
// ============================================
export const createBooking = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patient, lab, tests, bookingDate, preferredTimeSlot, collectionType, collectionAddress, notes, paymentMethod } = req.body;

        // Validate required fields
        if (!patient || !lab || !tests || !Array.isArray(tests) || tests.length === 0 || !bookingDate || !preferredTimeSlot || !collectionType) {
            res.status(400).json({
                success: false,
                message: 'Patient, lab, tests (array), booking date, time slot, and collection type are required',
            });
            return;
        }

        // Validate collection address for home collection
        if (collectionType === 'home' && !collectionAddress) {
            res.status(400).json({
                success: false,
                message: 'Collection address is required for home collection',
            });
            return;
        }

        // Verify all tests exist and calculate total amount
        const testDocs = await Test.find({ _id: { $in: tests } });
        if (testDocs.length !== tests.length) {
            res.status(404).json({
                success: false,
                message: 'One or more tests not found',
            });
            return;
        }

        // Calculate total amount from all tests
        const totalAmount = testDocs.reduce((sum, test) => sum + test.basePrice, 0);

        // Verify lab exists and has all these tests available
        const labDoc = await Lab.findById(lab);
        if (!labDoc) {
            res.status(404).json({
                success: false,
                message: 'Lab not found',
            });
            return;
        }

        // Check if lab has configured tests
        if (!labDoc.hasConfiguredTests || labDoc.availableTests.length === 0) {
            res.status(400).json({
                success: false,
                message: 'This lab has not configured their available tests yet',
            });
            return;
        }

        // Check if lab offers all selected tests
        const labTestIds = labDoc.availableTests.map(t => t.toString());
        const allTestsAvailable = tests.every(testId => labTestIds.includes(testId));
        if (!allTestsAvailable) {
            res.status(400).json({
                success: false,
                message: 'This lab does not offer one or more of the selected tests',
            });
            return;
        }

        // Verify patient exists
        const patientDoc = await Patient.findById(patient);
        if (!patientDoc) {
            res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
            return;
        }

        // Create booking
        const booking = new Booking({
            patient,
            lab,
            tests,
            bookingDate: new Date(bookingDate),
            preferredTimeSlot,
            collectionType,
            collectionAddress: collectionType === 'home' ? collectionAddress : undefined,
            totalAmount,
            notes,
            status: 'pending',
            paymentMethod: paymentMethod || 'cash',
            paymentStatus: 'pending',
        });

        await booking.save();

        // Prepare PayFast data if online payment
        let paymentData = null;
        if (paymentMethod === 'online') {
            try {
                paymentData = payfastService.generatePaymentData({
                    orderId: booking._id.toString(),
                    amount: totalAmount,
                    itemName: `Lab Test Booking`,
                    itemDescription: `Booking for ${testDocs.map(t => t.name).join(', ')}`,
                    patientEmail: patientDoc.email,
                    patientName: patientDoc.fullName,
                    // Different notify URL for bookings
                    notifyUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/bookings/itn`
                });
            } catch (payError) {
                console.error('Error generating PayFast data for booking:', payError);
            }
        }

        // Populate the booking with related data
        await booking.populate([
            { path: 'patient', select: 'fullName email phone address' },
            { path: 'lab', select: 'labName email phone labAddress' },
            { path: 'tests', select: 'name description category basePrice reportDeliveryTime' },
        ]);

        // Send notifications to Lab (Email + In-App)
        try {
            const { sendNewBookingEmail } = await import('../services/email.service');
            const { createNotification } = await import('./notification.controller');

            const testNames = (booking.tests as any[]).map(t => t.name).join(', ');

            // 1. Send Email to Lab
            if ((booking.lab as any).email) {
                await sendNewBookingEmail(
                    (booking.lab as any).email,
                    (booking.lab as any).labName,
                    (booking.patient as any).fullName,
                    testNames,
                    new Date(booking.bookingDate).toLocaleDateString(),
                    booking.preferredTimeSlot
                );
                console.log(`✅ New booking email sent to lab ${(booking.lab as any).email}`);
            }

            // 2. Create In-App Notification for Lab
            await createNotification({
                user: (booking.lab as any)._id.toString(),
                userType: 'lab',
                type: 'booking_created',
                title: 'New Booking 📅',
                message: `You have a new booking for ${testNames} from ${(booking.patient as any).fullName}.`,
                relatedBooking: booking._id.toString(),
                metadata: {
                    patientName: (booking.patient as any).fullName,
                    testNames,
                    bookingDate: booking.bookingDate,
                    timeSlot: booking.preferredTimeSlot
                }
            });

            console.log(`✅ New booking in-app notification sent to lab ${(booking.lab as any)._id}`);
        } catch (notificationError) {
            console.error('❌ Failed to send lab notifications:', notificationError);
            // Don't fail the request if notification fails
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: {
                booking,
                paymentData
            },
        });
    } catch (error: any) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message,
        });
    }
};

// ============================================
// GET PATIENT BOOKINGS
// ============================================
export const getPatientBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patientId } = req.params;
        const { status } = req.query;

        // Authorization: Ensure the requesting user is the patient
        if (req.user?.userType !== 'patient' || req.user?.id.toString() !== patientId.toString()) {
            res.status(403).json({
                success: false,
                message: 'You are not authorized to access these bookings',
            });
            return;
        }

        const query: any = { patient: patientId };
        if (status) {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate('lab', 'labName email phone labAddress')
            .populate('tests', 'name description category basePrice reportDeliveryTime')
            .populate('phlebotomist', 'fullName phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (error: any) {
        console.error('Get patient bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message,
        });
    }
};

// ============================================
// GET LAB BOOKINGS
// ============================================
export const getLabBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { labId } = req.params;
        const { status, date } = req.query;

        // Authorization: Ensure the requesting user is the lab
        if (req.user?.userType !== 'lab' || req.user?.id.toString() !== labId.toString()) {
            res.status(403).json({
                success: false,
                message: 'You are not authorized to access these bookings',
            });
            return;
        }

        const query: any = { lab: labId };
        if (status) {
            query.status = status;
        }
        if (date) {
            const startDate = new Date(date as string);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            query.bookingDate = { $gte: startDate, $lt: endDate };
        }

        const bookings = await Booking.find(query)
            .populate('patient', 'fullName email phone address')
            .populate('tests', 'name description category basePrice reportDeliveryTime')
            .populate('phlebotomist', 'fullName phone')
            .sort({ bookingDate: 1, preferredTimeSlot: 1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (error: any) {
        console.error('Get lab bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message,
        });
    }
};

// ============================================
// GET BOOKING BY ID
// ============================================
export const getBookingById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const booking = await Booking.findById(id)
            .populate('patient', 'fullName email phone address')
            .populate('lab', 'labName email phone labAddress')
            .populate('tests', 'name description category basePrice reportDeliveryTime preparationInstructions')
            .populate('phlebotomist', 'fullName phone qualification');

        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: booking,
        });
    } catch (error: any) {
        console.error('Get booking by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking',
            error: error.message,
        });
    }
};

// ============================================
// UPDATE BOOKING STATUS (Lab)
// ============================================
export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, phlebotomist } = req.body;

        if (!status) {
            res.status(400).json({
                success: false,
                message: 'Status is required',
            });
            return;
        }

        const booking = await Booking.findById(id);

        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
            return;
        }

        // Store old status to check if it changed
        const oldStatus = booking.status;

        booking.status = status;
        if (phlebotomist) {
            booking.phlebotomist = phlebotomist;
        }

        await booking.save();

        await booking.populate([
            { path: 'patient', select: 'fullName email phone' },
            { path: 'lab', select: 'labName email phone' },
            { path: 'tests', select: 'name description' },
            { path: 'phlebotomist', select: 'fullName phone' },
        ]);

        // Send notifications if status changed
        if (oldStatus !== status && booking.patient && (booking.patient as any).email) {
            try {
                const { sendBookingStatusUpdateEmail } = await import('../services/email.service');
                const { createNotification } = await import('./notification.controller');

                const testNames = (booking.tests as any[]).map(t => t.name).join(', ');

                // Send email notification
                await sendBookingStatusUpdateEmail(
                    (booking.patient as any).email,
                    (booking.patient as any).fullName,
                    testNames,
                    status,
                    new Date(booking.bookingDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    booking.preferredTimeSlot,
                    (booking.lab as any).labName
                );

                console.log(`✅ Status update email sent to ${(booking.patient as any).email}`);

                // Create in-app notification
                const statusMessages: Record<string, { title: string; message: string }> = {
                    confirmed: {
                        title: 'Booking Confirmed ✅',
                        message: `Your ${testNames} test(s) has been confirmed by ${(booking.lab as any).labName}.`
                    },
                    'in-progress': {
                        title: 'Sample Collection In Progress 🔬',
                        message: `Your sample for ${testNames} is being collected.`
                    },
                    completed: {
                        title: 'Test Completed ✨',
                        message: `Your ${testNames} test(s) has been completed! Report will be available soon.`
                    },
                    cancelled: {
                        title: 'Booking Cancelled ❌',
                        message: `Your ${testNames} test booking has been cancelled.`
                    }
                };

                const notificationInfo = statusMessages[status] || {
                    title: 'Status Updated',
                    message: `Your booking status has been updated to: ${status}`
                };

                await createNotification({
                    user: (booking.patient as any)._id.toString(),
                    userType: 'patient',
                    type: 'status_update',
                    title: notificationInfo.title,
                    message: notificationInfo.message,
                    relatedBooking: booking._id.toString(),
                    metadata: {
                        oldStatus,
                        newStatus: status,
                        testNames,
                        labName: (booking.lab as any).labName,
                    }
                });

                console.log(`✅ In-app notification created for patient ${(booking.patient as any)._id}`);
            } catch (notificationError) {
                console.error('❌ Failed to send notifications:', notificationError);
                // Don't fail the request if notification fails
            }
        }

        // Send notification to phlebotomist if newly assigned
        if (phlebotomist && (!booking.phlebotomist || booking.phlebotomist.toString() !== phlebotomist)) {
            try {
                const { createNotification } = await import('./notification.controller');
                const testNames = (booking.tests as any[]).map(t => t.name).join(', ');

                await createNotification({
                    user: phlebotomist,
                    userType: 'phlebotomist',
                    type: 'booking_assigned',
                    title: 'New Booking Assigned 📋',
                    message: `You have been assigned to collect samples for ${testNames} on ${new Date(booking.bookingDate).toLocaleDateString()}.`,
                    relatedBooking: booking._id.toString(),
                    metadata: {
                        patientName: (booking.patient as any).fullName,
                        testNames,
                        bookingDate: booking.bookingDate,
                        timeSlot: booking.preferredTimeSlot,
                        collectionAddress: booking.collectionAddress || (booking.lab as any).labAddress,
                    }
                });

                console.log(`✅ Phlebotomist notification sent for booking assignment`);
            } catch (notificationError) {
                console.error('❌ Failed to send phlebotomist notification:', notificationError);
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
// CANCEL BOOKING
// ============================================
export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { cancelReason } = req.body;

        const booking = await Booking.findById(id);

        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
            return;
        }

        if (booking.status === 'completed') {
            res.status(400).json({
                success: false,
                message: 'Cannot cancel a completed booking',
            });
            return;
        }

        if (booking.status === 'cancelled') {
            res.status(400).json({
                success: false,
                message: 'Booking is already cancelled',
            });
            return;
        }

        booking.status = 'cancelled';
        booking.cancelReason = cancelReason;

        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            data: booking,
        });
    } catch (error: any) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking',
            error: error.message,
        });
    }
};

// ============================================
// UPLOAD REPORT (Lab)
// ============================================
export const uploadReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'Report file is required',
            });
            return;
        }

        const booking = await Booking.findById(id);

        if (!booking) {
            res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
            return;
        }

        // Store report in database
        booking.reportData = req.file.buffer;
        booking.reportContentType = req.file.mimetype;

        // Construct report URL (API endpoint)
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const reportUrl = `${backendUrl}/api/bookings/${id}/report`;

        booking.reportUrl = reportUrl;
        booking.reportUploadedAt = new Date();
        // Ensure status is completed
        booking.status = 'completed';

        await booking.save();

        await booking.populate([
            { path: 'patient', select: 'fullName email phone' },
            { path: 'lab', select: 'labName email phone' },
            { path: 'tests', select: 'name description' },
        ]);

        // Send notifications
        if (booking.patient && (booking.patient as any).email) {
            try {
                const { sendReportUploadedEmail } = await import('../services/email.service');
                const { createNotification } = await import('./notification.controller');

                const testNames = (booking.tests as any[]).map(t => t.name).join(', ');

                // Send email
                await sendReportUploadedEmail(
                    (booking.patient as any).email,
                    (booking.patient as any).fullName,
                    testNames,
                    reportUrl,
                    (booking.lab as any).labName
                );

                // Create in-app notification
                await createNotification({
                    user: (booking.patient as any)._id.toString(),
                    userType: 'patient',
                    type: 'report_uploaded',
                    title: 'Report Ready 📄',
                    message: `Your report for ${testNames} is ready for download.`,
                    relatedBooking: booking._id.toString(),
                    metadata: {
                        reportUrl,
                        testNames,
                        labName: (booking.lab as any).labName,
                    }
                });

                console.log(`✅ Report notifications sent for booking ${booking._id}`);

            } catch (notificationError) {
                console.error('❌ Failed to send report notifications:', notificationError);
            }
        }

        // Lock conversations related to this booking
        try {
            const Conversation = (await import('../models/Conversation')).default;
            const { getIO } = await import('../server');

            // Find all conversations linked to this booking
            const conversations = await Conversation.find({ booking: id });

            // Emit socket event to lock conversations
            const io = getIO();
            if (io) {
                conversations.forEach(conv => {
                    io.to(conv._id.toString()).emit('conversation_locked', {
                        conversationId: conv._id,
                        bookingId: id,
                        message: 'Report has been uploaded. This conversation is now read-only.'
                    });
                });
                console.log(`✅ Locked ${conversations.length} conversation(s) for booking ${id}`);
            }
        } catch (lockError) {
            console.error('❌ Failed to lock conversations:', lockError);
        }

        res.status(200).json({
            success: true,
            message: 'Report uploaded successfully',
            data: booking,
        });

    } catch (error: any) {
        console.error('Upload report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload report',
            error: error.message,
        });
    }
};

// ============================================
// GET REPORT (Public/Protected)
// ============================================
export const getReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);

        if (!booking || !booking.reportData) {
            res.status(404).json({ success: false, message: 'Report not found' });
            return;
        }

        res.setHeader('Content-Type', booking.reportContentType || 'application/pdf');
        // Use 'inline' to view in browser, 'attachment' to download
        res.setHeader('Content-Disposition', `inline; filename="report-${id}.${booking.reportContentType?.split('/')[1] || 'pdf'}"`);
        res.send(booking.reportData);

    } catch (error: any) {
        console.error('Get report error:', error);
        res.status(500).json({ success: false, message: 'Failed to get report' });
    }
};
// ============================================
// HANDLE PAYFAST ITN (Webhooks)
// ============================================
export const handleBookingITN = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('📥 Received PayFast ITN for Booking:', req.body);

        const {
            m_payment_id,
            pf_payment_id,
            payment_status,
            item_name,
            amount_gross,
            signature,
        } = req.body;

        // 1. Validate Signature
        const receivedSignature = signature;
        const dataToVerify = { ...req.body };
        delete dataToVerify.signature;

        const calculatedSignature = payfastService.generateSignature(dataToVerify, process.env.PAYFAST_PASSPHRASE);

        if (receivedSignature !== calculatedSignature) {
            console.error('❌ PayFast Signature Validation Failed for Booking');
            res.status(400).send('Invalid signature');
            return;
        }

        // 2. Find Booking
        const booking = await Booking.findById(m_payment_id);
        if (!booking) {
            console.error(`❌ Booking not found for ITN: ${m_payment_id}`);
            res.status(404).send('Booking not found');
            return;
        }

        // 3. Update Booking Status
        if (payment_status === 'COMPLETE') {
            booking.paymentStatus = 'paid';
            booking.transactionId = pf_payment_id;
            // For bookings, we might keep status as pending until lab confirms, 
            // but we definitely mark as paid.
            await booking.save();

            // Notify patient
            await Notification.create({
                user: booking.patient,
                userType: 'patient',
                type: 'payment_completed',
                title: 'Payment Received! 💳',
                message: `Payment for your lab test booking was successful. Your booking is being processed.`,
                relatedBooking: booking._id,
            });

            console.log(`✅ Booking ${booking._id} marked as PAID via PayFast`);
        } else if (payment_status === 'FAILED') {
            // paymentStatus stays pending or we could add a failed status
            console.log(`⚠️ Payment FAILED for booking ${booking._id}`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error handling Booking ITN:', error);
        res.status(500).send('Internal Server Error');
    }
};
