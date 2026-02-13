import { Request, Response } from 'express';
import Patient from '../models/Patient';
import Lab from '../models/Lab';
import Phlebotomist from '../models/Phlebotomist';
import Admin from '../models/Admin';
import Booking from '../models/Booking';
import Contact from '../models/Contact';
import AuditLog from '../models/AuditLog';
import Notification from '../models/Notification';
import {
    sendWelcomeEmail,
    sendLabApprovalEmail,
    sendLabRejectionEmail,
    sendLabActivationEmail,
    sendLabDeactivationEmail,
    sendPhlebotomistApprovalEmail,
    sendPhlebotomistRejectionEmail,
    sendPhlebotomistActivationEmail,
    sendPhlebotomistDeactivationEmail,
    sendPatientActivationEmail,
    sendPatientDeactivationEmail
} from '../services/email.service';
import fs from 'fs';
import path from 'path';

// ============================================
// GET DASHBOARD STATISTICS
// ============================================
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get current date for today's activity
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Count all users
        const [patientsCount, labsCount, phlebotomistsCount, adminsCount] = await Promise.all([
            Patient.countDocuments(),
            Lab.countDocuments(),
            Phlebotomist.countDocuments(),
            Admin.countDocuments(),
        ]);

        const totalUsers = patientsCount + labsCount + phlebotomistsCount + adminsCount;

        // Count pending approvals (unverified users)
        const [pendingLabs, pendingPhlebotomists] = await Promise.all([
            Lab.countDocuments({ isVerified: false }),
            Phlebotomist.countDocuments({ isVerified: false }),
        ]);

        const totalPendingApprovals = pendingLabs + pendingPhlebotomists;

        // Count bookings by status
        const [
            activeBookings,
            pendingBookings,
            completedBookings,
            cancelledBookings,
            totalBookings,
        ] = await Promise.all([
            Booking.countDocuments({ status: { $in: ['confirmed', 'in-progress'] } }),
            Booking.countDocuments({ status: 'pending' }),
            Booking.countDocuments({ status: 'completed' }),
            Booking.countDocuments({ status: 'cancelled' }),
            Booking.countDocuments(),
        ]);

        // Get today's activity
        const [newUsersToday, newBookingsToday, reportsUploadedToday] = await Promise.all([
            Promise.all([
                Patient.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
                Lab.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
                Phlebotomist.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
            ]).then(counts => counts.reduce((sum, count) => sum + count, 0)),
            Booking.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
            Booking.countDocuments({
                reportUploadedAt: { $gte: today, $lt: tomorrow },
                reportData: { $exists: true }
            }),
        ]);

        // Get recent feedback/complaints count
        const recentFeedback = await Contact.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        });

        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    patients: patientsCount,
                    labs: labsCount,
                    phlebotomists: phlebotomistsCount,
                    admins: adminsCount,
                },
                pendingApprovals: {
                    labs: pendingLabs,
                    phlebotomists: pendingPhlebotomists,
                    total: totalPendingApprovals,
                },
                bookings: {
                    active: activeBookings,
                    pending: pendingBookings,
                    completed: completedBookings,
                    cancelled: cancelledBookings,
                    total: totalBookings,
                },
                recentActivity: {
                    newUsersToday,
                    newBookingsToday,
                    reportsUploadedToday,
                },
                feedback: {
                    recentCount: recentFeedback,
                },
            },
        });
    } catch (error: any) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error.message,
        });
    }
};

// ============================================
// GET ALL USERS
// ============================================
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role, status, search, page = '1', limit = '20' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        let users: any[] = [];
        let total = 0;

        // Build query based on filters
        const buildQuery = () => {
            const query: any = {};

            if (status === 'pending') {
                query.isVerified = false;
            } else if (status === 'active') {
                query.isVerified = true;
                query.isActive = true;
            } else if (status === 'suspended') {
                query.isActive = false;
            }

            if (search) {
                query.$or = [
                    { email: { $regex: search, $options: 'i' } },
                    { fullName: { $regex: search, $options: 'i' } },
                ];
            }

            return query;
        };

        // Fetch users based on role filter
        if (!role || role === 'all') {
            // Fetch from all collections
            const query = buildQuery();
            const [patients, labs, phlebotomists] = await Promise.all([
                Patient.find(query).select('-password').limit(limitNum).skip(skip).lean(),
                Lab.find(query).select('-password').limit(limitNum).skip(skip).lean(),
                Phlebotomist.find(query).select('-password').limit(limitNum).skip(skip).lean(),
            ]);

            users = [
                ...patients.map(u => ({ ...u, userType: 'patient' })),
                ...labs.map(u => ({ ...u, userType: 'lab' })),
                ...phlebotomists.map(u => ({ ...u, userType: 'phlebotomist' })),
            ];

            total = await Promise.all([
                Patient.countDocuments(query),
                Lab.countDocuments(query),
                Phlebotomist.countDocuments(query),
            ]).then(counts => counts.reduce((sum, count) => sum + count, 0));
        } else {
            // Fetch from specific collection
            const query = buildQuery();
            let Model;
            let userType;

            if (role === 'patient') {
                Model = Patient;
                userType = 'patient';
            } else if (role === 'lab') {
                Model = Lab;
                userType = 'lab';
            } else if (role === 'phlebotomist') {
                Model = Phlebotomist;
                userType = 'phlebotomist';
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Invalid role filter',
                });
                return;
            }

            users = await (Model as any).find(query)
                .select('-password')
                .limit(limitNum)
                .skip(skip)
                .sort({ createdAt: -1 })
                .lean();

            users = users.map(u => ({ ...u, userType }));
            total = await (Model as any).countDocuments(query);
        }

        // Sort by creation date
        users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        res.status(200).json({
            success: true,
            data: users.slice(0, limitNum),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error: any) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message,
        });
    }
};

// ============================================
// GET USER BY ID
// ============================================
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { userType } = req.query;

        let user;
        let Model;

        if (userType === 'patient') {
            Model = Patient;
        } else if (userType === 'lab') {
            Model = Lab;
        } else if (userType === 'phlebotomist') {
            Model = Phlebotomist;
        } else {
            res.status(400).json({
                success: false,
                message: 'userType query parameter is required',
            });
            return;
        }

        user = await (Model as any).findById(id).select('-password');

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        // Get audit logs for this user
        const auditLogs = await AuditLog.find({ targetUser: id })
            .populate('admin', 'email')
            .sort({ timestamp: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                ...user.toObject(),
                userType,
                auditLogs,
            },
        });
    } catch (error: any) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user details',
            error: error.message,
        });
    }
};

// ============================================
// APPROVE USER
// ============================================
export const approveUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { userType } = req.body;

        if (userType !== 'lab' && userType !== 'phlebotomist') {
            res.status(400).json({
                success: false,
                message: 'Only labs and phlebotomists require approval',
            });
            return;
        }

        const Model = userType === 'lab' ? Lab : Phlebotomist;
        const user = await (Model as any).findById(id);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        if (user.isVerified) {
            res.status(400).json({
                success: false,
                message: 'User is already approved',
            });
            return;
        }

        // Approve user
        user.isVerified = true;
        await user.save();

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'approve_user',
            targetUser: id,
            targetUserType: userType,
            details: {
                previousStatus: 'pending',
                newStatus: 'active',
            },
        });

        // Send notifications (email + in-app)
        try {
            if (userType === 'lab') {
                // Send lab-specific approval email
                await sendLabApprovalEmail(user.email, (user as any).labName);

                // Create in-app notification for lab
                await Notification.create({
                    user: id,
                    userType: 'lab',
                    type: 'lab_approved',
                    title: 'Registration Approved! 🎉',
                    message: 'Your lab has been approved. You can now login and start accepting bookings.',
                });
            } else {
                // Send generic welcome email for other user types
                await sendWelcomeEmail(user.email, (user as any).fullName || (user as any).labName, userType);
            }
        } catch (emailError) {
            console.error('Failed to send approval notifications:', emailError);
        }

        res.status(200).json({
            success: true,
            message: 'User approved successfully',
            data: user,
        });
    } catch (error: any) {
        console.error('Approve user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve user',
            error: error.message,
        });
    }
};

// ============================================
// SUSPEND USER
// ============================================
export const suspendUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { userType, reason } = req.body;

        if (!userType || !reason) {
            res.status(400).json({
                success: false,
                message: 'userType and reason are required',
            });
            return;
        }

        let Model;
        if (userType === 'patient') {
            Model = Patient;
        } else if (userType === 'lab') {
            Model = Lab;
        } else if (userType === 'phlebotomist') {
            Model = Phlebotomist;
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid userType',
            });
            return;
        }

        const user = await (Model as any).findById(id);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        if (!user.isActive) {
            res.status(400).json({
                success: false,
                message: 'User is already suspended',
            });
            return;
        }

        // Suspend user
        user.isActive = false;
        await user.save();

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'suspend_user',
            targetUser: id,
            targetUserType: userType,
            details: {
                previousStatus: 'active',
                newStatus: 'suspended',
                reason,
            },
        });

        res.status(200).json({
            success: true,
            message: 'User suspended successfully',
            data: user,
        });
    } catch (error: any) {
        console.error('Suspend user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to suspend user',
            error: error.message,
        });
    }
};

// ============================================
// REACTIVATE USER
// ============================================
export const reactivateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { userType } = req.body;

        if (!userType) {
            res.status(400).json({
                success: false,
                message: 'userType is required',
            });
            return;
        }

        let Model;
        if (userType === 'patient') {
            Model = Patient;
        } else if (userType === 'lab') {
            Model = Lab;
        } else if (userType === 'phlebotomist') {
            Model = Phlebotomist;
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid userType',
            });
            return;
        }

        const user = await (Model as any).findById(id);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        if (user.isActive) {
            res.status(400).json({
                success: false,
                message: 'User is already active',
            });
            return;
        }

        // Reactivate user
        user.isActive = true;
        await user.save();

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'reactivate_user',
            targetUser: id,
            targetUserType: userType,
            details: {
                previousStatus: 'suspended',
                newStatus: 'active',
            },
        });

        res.status(200).json({
            success: true,
            message: 'User reactivated successfully',
            data: user,
        });
    } catch (error: any) {
        console.error('Reactivate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reactivate user',
            error: error.message,
        });
    }
};

// ============================================
// LAB MANAGEMENT ENDPOINTS
// ============================================

// GET PENDING LABS
export const getPendingLabs = async (req: Request, res: Response): Promise<void> => {
    try {
        const labs = await Lab.find({ isVerified: false })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: labs,
            count: labs.length,
        });
    } catch (error: any) {
        console.error('Get pending labs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending labs',
            error: error.message,
        });
    }
};

// GET ALL LABS
export const getAllLabs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, search, page = '1', limit = '20' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const query: any = {};

        if (status === 'pending') {
            query.isVerified = false;
        } else if (status === 'active') {
            query.isVerified = true;
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        if (search) {
            query.$or = [
                { labName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const labs = await Lab.find(query)
            .select('-password')
            .limit(limitNum)
            .skip(skip)
            .sort({ createdAt: -1 });

        const total = await Lab.countDocuments(query);

        res.status(200).json({
            success: true,
            data: labs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error: any) {
        console.error('Get all labs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch labs',
            error: error.message,
        });
    }
};

// GET LAB BY ID WITH PERFORMANCE
export const getLabById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const lab = await Lab.findById(id).select('-password');

        if (!lab) {
            res.status(404).json({
                success: false,
                message: 'Lab not found',
            });
            return;
        }

        // Get performance metrics
        const [totalBookings, completedBookings, activeBookings] = await Promise.all([
            Booking.countDocuments({ lab: id }),
            Booking.countDocuments({ lab: id, status: 'completed' }),
            Booking.countDocuments({ lab: id, status: { $in: ['pending', 'confirmed', 'in-progress'] } }),
        ]);

        // Get audit logs
        const auditLogs = await AuditLog.find({ targetUser: id })
            .populate('admin', 'email')
            .sort({ timestamp: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                ...lab.toObject(),
                performance: {
                    totalBookings,
                    completedBookings,
                    activeBookings,
                },
                auditLogs,
            },
        });
    } catch (error: any) {
        console.error('Get lab by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch lab details',
            error: error.message,
        });
    }
};

// GET LAB LICENSE DOCUMENT
export const getLabLicense = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const lab = await Lab.findById(id);

        if (!lab) {
            res.status(404).json({
                success: false,
                message: 'Lab not found',
            });
            return;
        }

        if (!lab.license || !lab.license.data) {
            res.status(404).json({
                success: false,
                message: 'License document not found',
            });
            return;
        }

        // Send PDF buffer
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${lab.license.filename}"`);
        res.send(lab.license.data);
    } catch (error: any) {
        console.error('Get lab license error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch lab license',
            error: error.message,
        });
    }
};

// REJECT LAB
export const rejectLab = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            res.status(400).json({
                success: false,
                message: 'Rejection reason is required',
            });
            return;
        }

        const lab = await Lab.findById(id);

        if (!lab) {
            res.status(404).json({
                success: false,
                message: 'Lab not found',
            });
            return;
        }

        if (lab.isVerified) {
            res.status(400).json({
                success: false,
                message: 'Cannot reject an already approved lab',
            });
            return;
        }

        // Store lab info before deletion for audit log and email
        const labEmail = lab.email;
        const labName = lab.labName;

        // Create audit log BEFORE deletion
        await AuditLog.create({
            admin: req.user!.id,
            action: 'reject_user',
            targetUser: id,
            targetUserType: 'lab',
            details: {
                previousStatus: 'pending',
                newStatus: 'rejected',
                reason,
                labName,
                labEmail,
            },
        });

        // Send notifications BEFORE deletion
        try {
            await sendLabRejectionEmail(labEmail, labName, reason);

            // Note: Cannot create in-app notification since user will be deleted
            // The email notification is sufficient for rejected users
        } catch (notificationError) {
            console.error('Failed to send rejection notifications:', notificationError);
        }

        // DELETE the lab from database
        await Lab.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Lab rejected and removed successfully',
            data: { reason },
        });
    } catch (error: any) {
        console.error('Reject lab error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject lab',
            error: error.message,
        });
    }
};


// APPROVE LAB
export const approveLab = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const lab = await Lab.findById(id);

        if (!lab) {
            res.status(404).json({
                success: false,
                message: 'Lab not found',
            });
            return;
        }

        if (lab.isVerified) {
            res.status(400).json({
                success: false,
                message: 'Lab is already approved',
            });
            return;
        }

        // Approve lab
        lab.isVerified = true;
        await lab.save();

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'approve_user',
            targetUser: id,
            targetUserType: 'lab',
            details: {
                previousStatus: 'pending',
                newStatus: 'approved',
            },
        });

        // Send notifications (email + in-app)
        try {
            await sendLabApprovalEmail(lab.email, lab.labName);

            await Notification.create({
                user: id,
                userType: 'lab',
                type: 'lab_approved',
                title: 'Registration Approved! 🎉',
                message: 'Your lab has been approved. You can now login and start accepting bookings.',
            });
        } catch (notificationError) {
            console.error('Failed to send approval notifications:', notificationError);
        }

        res.status(200).json({
            success: true,
            message: 'Lab approved successfully',
            data: lab,
        });
    } catch (error: any) {
        console.error('Approve lab error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve lab',
            error: error.message,
        });
    }
};


// EDIT LAB PROFILE
export const editLabProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Remove sensitive fields that shouldn't be updated
        delete updates.password;
        delete updates.license;
        delete updates.isVerified;

        const lab = await Lab.findByIdAndUpdate(id, updates, { new: true }).select('-password');

        if (!lab) {
            res.status(404).json({
                success: false,
                message: 'Lab not found',
            });
            return;
        }

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'approve_user',
            targetUser: id,
            targetUserType: 'lab',
            details: {
                action: 'edit_profile',
                updates: Object.keys(updates),
            },
        });

        res.status(200).json({
            success: true,
            message: 'Lab profile updated successfully',
            data: lab,
        });
    } catch (error: any) {
        console.error('Edit lab profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update lab profile',
            error: error.message,
        });
    }
};

// REMOVE LAB
export const removeLab = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Check for active bookings
        const activeBookings = await Booking.countDocuments({
            lab: id,
            status: { $in: ['pending', 'confirmed', 'in-progress'] },
        });

        if (activeBookings > 0) {
            res.status(400).json({
                success: false,
                message: `Cannot remove lab with ${activeBookings} active booking(s)`,
            });
            return;
        }

        const lab = await Lab.findByIdAndDelete(id);

        if (!lab) {
            res.status(404).json({
                success: false,
                message: 'Lab not found',
            });
            return;
        }

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'approve_user',
            targetUser: id,
            targetUserType: 'lab',
            details: {
                action: 'remove_lab',
                labName: lab.labName,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Lab removed successfully',
        });
    } catch (error: any) {
        console.error('Remove lab error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove lab',
            error: error.message,
        });
    }
};

// ACTIVATE LAB
export const activateLab = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const lab = await Lab.findById(id);

        if (!lab) {
            res.status(404).json({
                success: false,
                message: 'Lab not found',
            });
            return;
        }

        if (lab.isActive) {
            res.status(400).json({
                success: false,
                message: 'Lab is already active',
            });
            return;
        }

        lab.isActive = true;
        await lab.save();

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'reactivate_user',
            targetUser: id,
            targetUserType: 'lab',
            details: {
                action: 'activate_lab',
                labName: lab.labName,
            },
        });

        // Send notifications (email + in-app)
        try {
            await sendLabActivationEmail(lab.email, lab.labName);

            await Notification.create({
                user: id,
                userType: 'lab',
                type: 'lab_activated',
                title: 'Lab Activated! ✅',
                message: 'Your lab is now visible to patients and can accept new bookings.',
            });
        } catch (notificationError) {
            console.error('Failed to send activation notifications:', notificationError);
        }

        res.status(200).json({
            success: true,
            message: 'Lab activated successfully. It is now visible to patients.',
            data: lab,
        });
    } catch (error: any) {
        console.error('Activate lab error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to activate lab',
            error: error.message,
        });
    }
};

// DEACTIVATE LAB
export const deactivateLab = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const lab = await Lab.findById(id);

        if (!lab) {
            res.status(404).json({
                success: false,
                message: 'Lab not found',
            });
            return;
        }

        if (!lab.isActive) {
            res.status(400).json({
                success: false,
                message: 'Lab is already inactive',
            });
            return;
        }

        lab.isActive = false;
        await lab.save();

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'suspend_user',
            targetUser: id,
            targetUserType: 'lab',
            details: {
                action: 'deactivate_lab',
                labName: lab.labName,
            },
        });

        // Send notifications (email + in-app)
        try {
            await sendLabDeactivationEmail(lab.email, lab.labName);

            await Notification.create({
                user: id,
                userType: 'lab',
                type: 'lab_deactivated',
                title: 'Lab Deactivated ⚠️',
                message: 'Your lab has been temporarily deactivated and is not visible to patients.',
            });
        } catch (notificationError) {
            console.error('Failed to send deactivation notifications:', notificationError);
        }

        res.status(200).json({
            success: true,
            message: 'Lab deactivated successfully. It will no longer be visible to patients.',
            data: lab,
        });
    } catch (error: any) {
        console.error('Deactivate lab error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate lab',
            error: error.message,
        });
    }
};
// ============================================
// PHLEBOTOMIST MANAGEMENT ENDPOINTS
// ============================================

// Get all phlebotomists with filters
export const getAllPhlebotomists = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;

        const query: any = {};

        // Status filter
        if (status === 'pending') {
            query.isVerified = false;
        } else if (status === 'active') {
            query.isVerified = true;
            query.isActive = true;
        } else if (status === 'suspended') {
            query.isActive = false;
        }

        // Search filter
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const phlebotomists = await Phlebotomist.find(query)
            .select('-password -trafficLicense.data')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Phlebotomist.countDocuments(query);

        res.status(200).json({
            success: true,
            data: phlebotomists,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error: any) {
        console.error('Get phlebotomists error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch phlebotomists',
            error: error.message,
        });
    }
};

// Get pending phlebotomists
export const getPendingPhlebotomists = async (req: Request, res: Response): Promise<void> => {
    try {
        const phlebotomists = await Phlebotomist.find({ isVerified: false })
            .select('-password -trafficLicense.data')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: phlebotomists,
        });
    } catch (error: any) {
        console.error('Get pending phlebotomists error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending phlebotomists',
            error: error.message,
        });
    }
};

// Get phlebotomist by ID
export const getPhlebotomistById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const phlebotomist = await Phlebotomist.findById(id)
            .select('-password -trafficLicense.data')
            .populate('assignedLab', 'labName');

        if (!phlebotomist) {
            res.status(404).json({
                success: false,
                message: 'Phlebotomist not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: phlebotomist,
        });
    } catch (error: any) {
        console.error('Get phlebotomist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch phlebotomist',
            error: error.message,
        });
    }
};

// Get phlebotomist traffic license
export const getPhlebotomistLicense = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const phlebotomist = await Phlebotomist.findById(id).select('trafficLicense');

        if (!phlebotomist || !phlebotomist.trafficLicense) {
            res.status(404).json({
                success: false,
                message: 'Traffic license not found',
            });
            return;
        }

        res.setHeader('Content-Type', phlebotomist.trafficLicense.contentType);
        res.setHeader('Content-Disposition', `inline; filename="${phlebotomist.trafficLicense.filename}"`);
        res.send(phlebotomist.trafficLicense.data);
    } catch (error: any) {
        console.error('Get traffic license error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch traffic license',
            error: error.message,
        });
    }
};

// Approve phlebotomist
export const approvePhlebotomist = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const phlebotomist = await Phlebotomist.findById(id);

        if (!phlebotomist) {
            res.status(404).json({
                success: false,
                message: 'Phlebotomist not found',
            });
            return;
        }

        if (phlebotomist.isVerified) {
            res.status(400).json({
                success: false,
                message: 'Phlebotomist is already verified',
            });
            return;
        }

        phlebotomist.isVerified = true;
        phlebotomist.isActive = true;
        await phlebotomist.save();

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'approve_user',
            targetUser: id,
            targetUserType: 'phlebotomist',
            details: {
                previousStatus: 'pending',
                newStatus: 'active',
            },
        });

        // Send notifications (email + in-app)
        try {
            await sendPhlebotomistApprovalEmail(phlebotomist.email, phlebotomist.fullName);

            await Notification.create({
                user: id,
                userType: 'phlebotomist',
                type: 'lab_approved',
                title: 'Registration Approved! 🎉',
                message: 'Your phlebotomist registration has been approved. You can now login and start accepting assignments.',
            });
        } catch (notificationError) {
            console.error('Failed to send approval notifications:', notificationError);
        }

        res.status(200).json({
            success: true,
            message: 'Phlebotomist approved successfully',
            data: phlebotomist,
        });
    } catch (error: any) {
        console.error('Approve phlebotomist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve phlebotomist',
            error: error.message,
        });
    }
};

// Reject phlebotomist
export const rejectPhlebotomist = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            res.status(400).json({
                success: false,
                message: 'Rejection reason is required',
            });
            return;
        }

        const phlebotomist = await Phlebotomist.findById(id);

        if (!phlebotomist) {
            res.status(404).json({
                success: false,
                message: 'Phlebotomist not found',
            });
            return;
        }

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'reject_user',
            targetUser: id,
            targetUserType: 'phlebotomist',
            details: {
                previousStatus: 'pending',
                newStatus: 'rejected',
                reason,
            },
        });

        // Send notifications (email + in-app)
        try {
            await sendPhlebotomistRejectionEmail(phlebotomist.email, phlebotomist.fullName, reason);

            await Notification.create({
                user: id,
                userType: 'phlebotomist',
                type: 'lab_rejected',
                title: 'Registration Rejected',
                message: `Your phlebotomist registration was rejected. Reason: ${reason}`,
                metadata: { reason },
            });
        } catch (notificationError) {
            console.error('Failed to send rejection notifications:', notificationError);
        }

        res.status(200).json({
            success: true,
            message: 'Phlebotomist rejected successfully',
        });
    } catch (error: any) {
        console.error('Reject phlebotomist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject phlebotomist',
            error: error.message,
        });
    }
};

// Activate phlebotomist
export const activatePhlebotomist = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const phlebotomist = await Phlebotomist.findById(id);

        if (!phlebotomist) {
            res.status(404).json({
                success: false,
                message: 'Phlebotomist not found',
            });
            return;
        }

        if (phlebotomist.isActive) {
            res.status(400).json({
                success: false,
                message: 'Phlebotomist is already active',
            });
            return;
        }

        phlebotomist.isActive = true;
        await phlebotomist.save();

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'reactivate_user',
            targetUser: id,
            targetUserType: 'phlebotomist',
            details: {
                action: 'activate_phlebotomist',
                phlebotomistName: phlebotomist.fullName,
            },
        });

        // Send notifications (email + in-app)
        try {
            await sendPhlebotomistActivationEmail(phlebotomist.email, phlebotomist.fullName);

            await Notification.create({
                user: id,
                userType: 'phlebotomist',
                type: 'lab_activated',
                title: 'Account Activated! ✅',
                message: 'Your account has been activated and you can now accept assignments.',
            });
        } catch (notificationError) {
            console.error('Failed to send activation notifications:', notificationError);
        }

        res.status(200).json({
            success: true,
            message: 'Phlebotomist activated successfully. They can now accept assignments.',
            data: phlebotomist,
        });
    } catch (error: any) {
        console.error('Activate phlebotomist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to activate phlebotomist',
            error: error.message,
        });
    }
};

// Deactivate phlebotomist
export const deactivatePhlebotomist = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const phlebotomist = await Phlebotomist.findById(id);

        if (!phlebotomist) {
            res.status(404).json({
                success: false,
                message: 'Phlebotomist not found',
            });
            return;
        }

        if (!phlebotomist.isActive) {
            res.status(400).json({
                success: false,
                message: 'Phlebotomist is already deactivated',
            });
            return;
        }

        phlebotomist.isActive = false;
        await phlebotomist.save();

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'suspend_user',
            targetUser: id,
            targetUserType: 'phlebotomist',
            details: {
                action: 'deactivate_phlebotomist',
                phlebotomistName: phlebotomist.fullName,
            },
        });

        // Send notifications (email + in-app)
        try {
            await sendPhlebotomistDeactivationEmail(phlebotomist.email, phlebotomist.fullName);

            await Notification.create({
                user: id,
                userType: 'phlebotomist',
                type: 'lab_deactivated',
                title: 'Account Deactivated ⚠️',
                message: 'Your account has been temporarily deactivated and you cannot accept new assignments.',
            });
        } catch (notificationError) {
            console.error('Failed to send deactivation notifications:', notificationError);
        }

        res.status(200).json({
            success: true,
            message: 'Phlebotomist deactivated successfully. They will no longer be able to accept assignments.',
            data: phlebotomist,
        });
    } catch (error: any) {
        console.error('Deactivate phlebotomist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate phlebotomist',
            error: error.message,
        });
    }
};

// Edit phlebotomist profile
export const editPhlebotomistProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { fullName, phone, qualification } = req.body;

        const phlebotomist = await Phlebotomist.findById(id);

        if (!phlebotomist) {
            res.status(404).json({
                success: false,
                message: 'Phlebotomist not found',
            });
            return;
        }

        // Update fields
        if (fullName) phlebotomist.fullName = fullName;
        if (phone) phlebotomist.phone = phone;
        if (qualification) phlebotomist.qualification = qualification;

        await phlebotomist.save();

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'edit_user',
            targetUser: id,
            targetUserType: 'phlebotomist',
            details: {
                updatedFields: { fullName, phone, qualification },
            },
        });

        res.status(200).json({
            success: true,
            message: 'Phlebotomist profile updated successfully',
            data: phlebotomist,
        });
    } catch (error: any) {
        console.error('Edit phlebotomist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update phlebotomist profile',
            error: error.message,
        });
    }
};

// Remove phlebotomist
export const removePhlebotomist = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const phlebotomist = await Phlebotomist.findById(id);

        if (!phlebotomist) {
            res.status(404).json({
                success: false,
                message: 'Phlebotomist not found',
            });
            return;
        }

        // Check for active bookings
        const activeBookings = await Booking.countDocuments({
            phlebotomist: id,
            status: { $in: ['pending', 'confirmed', 'sample_collected'] },
        });

        if (activeBookings > 0) {
            res.status(400).json({
                success: false,
                message: `Cannot remove phlebotomist. They have ${activeBookings} active booking(s).`,
            });
            return;
        }

        // Create audit log before deletion
        await AuditLog.create({
            admin: req.user!.id,
            action: 'delete_user',
            targetUser: id,
            targetUserType: 'phlebotomist',
            details: {
                phlebotomistName: phlebotomist.fullName,
                email: phlebotomist.email,
            },
        });

        await Phlebotomist.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Phlebotomist removed successfully',
        });
    } catch (error: any) {
        console.error('Remove phlebotomist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove phlebotomist',
            error: error.message,
        });
    }
};
// ============================================
// PATIENT MANAGEMENT ENDPOINTS
// ============================================

// Get all patients with filters
export const getAllPatients = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;

        const query: any = {};

        // Status filter
        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'suspended') {
            query.isActive = false;
        }

        // Search filter
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const patients = await Patient.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Patient.countDocuments(query);

        res.status(200).json({
            success: true,
            data: patients,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error: any) {
        console.error('Get patients error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch patients',
            error: error.message,
        });
    }
};

// Get patient by ID
export const getPatientById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const patient = await Patient.findById(id).select('-password');

        if (!patient) {
            res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: patient,
        });
    } catch (error: any) {
        console.error('Get patient error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch patient',
            error: error.message,
        });
    }
};

// Activate patient
export const activatePatient = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const patient = await Patient.findById(id);

        if (!patient) {
            res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
            return;
        }

        if (patient.isActive) {
            res.status(400).json({
                success: false,
                message: 'Patient is already active',
            });
            return;
        }

        patient.isActive = true;
        await patient.save();

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'reactivate_user',
            targetUser: id,
            targetUserType: 'patient',
            details: {
                action: 'activate_patient',
                patientName: patient.fullName,
            },
        });

        // Send notifications (email + in-app)
        try {
            await sendPatientActivationEmail(patient.email, patient.fullName);

            await Notification.create({
                user: id,
                userType: 'patient',
                type: 'patient_activated',
                title: 'Account Activated! ✅',
                message: 'Your account has been activated. You can now book tests and access all services.',
            });
        } catch (notificationError) {
            console.error('Failed to send activation notifications:', notificationError);
        }

        res.status(200).json({
            success: true,
            message: 'Patient activated successfully.',
            data: patient,
        });
    } catch (error: any) {
        console.error('Activate patient error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to activate patient',
            error: error.message,
        });
    }
};

// Deactivate patient
export const deactivatePatient = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const patient = await Patient.findById(id);

        if (!patient) {
            res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
            return;
        }

        if (!patient.isActive) {
            res.status(400).json({
                success: false,
                message: 'Patient is already deactivated',
            });
            return;
        }

        patient.isActive = false;
        await patient.save();

        // Create audit log
        await AuditLog.create({
            admin: req.user!.id,
            action: 'suspend_user',
            targetUser: id,
            targetUserType: 'patient',
            details: {
                action: 'deactivate_patient',
                patientName: patient.fullName,
            },
        });

        // Send notifications (email + in-app)
        try {
            await sendPatientDeactivationEmail(patient.email, patient.fullName);

            await Notification.create({
                user: id,
                userType: 'patient',
                type: 'patient_deactivated',
                title: 'Account Deactivated ⚠️',
                message: 'Your account has been temporarily deactivated. Please contact support for assistance.',
            });
        } catch (notificationError) {
            console.error('Failed to send deactivation notifications:', notificationError);
        }

        res.status(200).json({
            success: true,
            message: 'Patient deactivated successfully.',
            data: patient,
        });
    } catch (error: any) {
        console.error('Deactivate patient error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate patient',
            error: error.message,
        });
    }
};
