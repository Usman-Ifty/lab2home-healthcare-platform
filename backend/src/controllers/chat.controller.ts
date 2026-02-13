import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import Booking from '../models/Booking';
import { Server } from 'socket.io';

// Helper to get IO instance (will be attached to req in server.ts or we can export a setter)
let io: Server;
export const setIO = (socketIO: Server) => {
    io = socketIO;
};

// Create or Get Conversation
export const createConversation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { targetUserId, targetUserType } = req.body; // Target user ID and type
        const userId = req.user?.id;
        const userType = req.user?.userType;

        if (!userId || !userType) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        let patientId, labId, phlebotomistId;
        let participants: ('patient' | 'lab' | 'phlebotomist')[] = [];

        // Determine conversation participants based on user types
        if (userType === 'patient' && targetUserType === 'lab') {
            patientId = userId;
            labId = targetUserId;
            participants = ['patient', 'lab'];
        } else if (userType === 'patient' && targetUserType === 'phlebotomist') {
            patientId = userId;
            phlebotomistId = targetUserId;
            participants = ['patient', 'phlebotomist'];
        } else if (userType === 'lab' && targetUserType === 'patient') {
            patientId = targetUserId;
            labId = userId;
            participants = ['patient', 'lab'];
        } else if (userType === 'lab' && targetUserType === 'phlebotomist') {
            // NEW: Lab-Phlebotomist conversation
            labId = userId;
            phlebotomistId = targetUserId;
            participants = ['lab', 'phlebotomist'];
            // For Lab-Phlebotomist, we need a patient context (find common booking)
            const commonBooking = await Booking.findOne({
                lab: labId,
                phlebotomist: phlebotomistId,
            }).select('patient');
            if (commonBooking) {
                patientId = commonBooking.patient;
            } else {
                res.status(403).json({ success: false, message: 'No common booking found between lab and phlebotomist.' });
                return;
            }
        } else if (userType === 'phlebotomist' && targetUserType === 'patient') {
            patientId = targetUserId;
            phlebotomistId = userId;
            participants = ['patient', 'phlebotomist'];
        } else if (userType === 'phlebotomist' && targetUserType === 'lab') {
            // NEW: Phlebotomist-Lab conversation
            phlebotomistId = userId;
            labId = targetUserId;
            participants = ['lab', 'phlebotomist'];
            // Find common booking
            const commonBooking = await Booking.findOne({
                lab: labId,
                phlebotomist: phlebotomistId,
            }).select('patient');
            if (commonBooking) {
                patientId = commonBooking.patient;
            } else {
                res.status(403).json({ success: false, message: 'No common booking found between lab and phlebotomist.' });
                return;
            }
        } else {
            res.status(403).json({ success: false, message: 'Invalid conversation participants' });
            return;
        }

        // Check if booking exists based on conversation type
        let bookingExists;
        if (labId && phlebotomistId && !patientId) {
            // Lab-Phlebotomist conversation (patient already validated above)
            bookingExists = true;
        } else if (labId && patientId) {
            // Patient-Lab conversation
            bookingExists = await Booking.exists({
                patient: patientId,
                lab: labId,
            });
        } else if (phlebotomistId && patientId) {
            // Patient-Phlebotomist conversation
            bookingExists = await Booking.exists({
                patient: patientId,
                phlebotomist: phlebotomistId,
            });
        }

        if (!bookingExists) {
            res.status(403).json({ success: false, message: 'You can only chat if there is a booking history.' });
            return;
        }

        // Check if conversation exists
        let conversation;
        if (labId && phlebotomistId) {
            // Lab-Phlebotomist conversation
            conversation = await Conversation.findOne({ lab: labId, phlebotomist: phlebotomistId });
        } else if (labId) {
            conversation = await Conversation.findOne({ patient: patientId, lab: labId });
        } else if (phlebotomistId) {
            conversation = await Conversation.findOne({ patient: patientId, phlebotomist: phlebotomistId });
        }

        if (!conversation) {
            const conversationData: any = {
                patient: patientId,
                participants,
            };

            if (labId) conversationData.lab = labId;
            if (phlebotomistId) conversationData.phlebotomist = phlebotomistId;

            conversation = await Conversation.create(conversationData);
        }

        res.status(200).json({ success: true, conversation });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Conversations
export const getConversations = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const userType = req.user?.userType;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        let query: any = {};

        if (userType === 'patient') {
            query = { patient: userId };
        } else if (userType === 'lab') {
            query = { lab: userId };
        } else if (userType === 'phlebotomist') {
            query = { phlebotomist: userId };
        }

        const conversations = await Conversation.find(query)
            .populate('patient', 'fullName email phone')
            .populate('lab', 'labName email phone')
            .populate('phlebotomist', 'fullName email phone')
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, conversations });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send Message
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('sendMessage called');
        const { conversationId, content } = req.body;
        const userId = req.user?.id;
        const userType = req.user?.userType as 'patient' | 'lab' | 'phlebotomist';
        const files = req.files as Express.Multer.File[];

        console.log('Request body:', req.body);
        console.log('User:', userId, userType);
        console.log('Files:', files ? files.length : 'No files');

        if (!userId || !userType) {
            console.log('Unauthorized: Missing user info');
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        // Verify conversation participation
        const conversation = await Conversation.findById(conversationId).populate('booking');
        if (!conversation) {
            console.log('Conversation not found:', conversationId);
            res.status(404).json({ success: false, message: 'Conversation not found' });
            return;
        }

        // Check if user is participant in conversation
        const isParticipant =
            (userType === 'patient' && conversation.patient.toString() === userId) ||
            (userType === 'lab' && conversation.lab?.toString() === userId) ||
            (userType === 'phlebotomist' && conversation.phlebotomist?.toString() === userId);

        if (!isParticipant) {
            console.log('User not authorized for this conversation');
            res.status(403).json({ success: false, message: 'Not authorized to send message to this conversation' });
            return;
        }

        // Check if conversation is locked (report uploaded)
        if (conversation.booking) {
            const booking = conversation.booking as any;
            if (booking.reportUploadedAt) {
                res.status(403).json({
                    success: false,
                    message: 'This conversation is locked. The report has been uploaded and the booking is complete.'
                });
                return;
            }
        }

        // Process attachments
        const attachments = files?.map((file) => ({
            filename: file.originalname,
            contentType: file.mimetype,
            data: file.buffer,
            size: file.size,
        })) || [];

        console.log('Processed attachments:', attachments.map(a => ({ ...a, data: 'BUFFER' })));

        // Create Message
        console.log('Creating message...');
        const message = await Message.create({
            conversation: conversationId,
            sender: userType,
            senderId: userId,
            content,
            attachments,
            status: 'sent',
        });
        console.log('Message created:', message._id);

        // Update Conversation
        conversation.lastMessage = content || (attachments.length > 0 ? 'Attachment' : '');
        conversation.lastMessageAt = new Date();

        // Increment unread count for recipients
        const recipients: Array<{ id: string; type: 'patient' | 'lab' | 'phlebotomist' }> = [];

        if (userType === 'patient') {
            if (conversation.lab) {
                conversation.unreadCount.lab = (conversation.unreadCount.lab || 0) + 1;
                recipients.push({ id: conversation.lab.toString(), type: 'lab' });
            }
            if (conversation.phlebotomist) {
                conversation.unreadCount.phlebotomist = (conversation.unreadCount.phlebotomist || 0) + 1;
                recipients.push({ id: conversation.phlebotomist.toString(), type: 'phlebotomist' });
            }
        } else if (userType === 'lab') {
            if (conversation.patient) {
                conversation.unreadCount.patient = (conversation.unreadCount.patient || 0) + 1;
                recipients.push({ id: conversation.patient.toString(), type: 'patient' });
            }
            if (conversation.phlebotomist) {
                conversation.unreadCount.phlebotomist = (conversation.unreadCount.phlebotomist || 0) + 1;
                recipients.push({ id: conversation.phlebotomist.toString(), type: 'phlebotomist' });
            }
        } else if (userType === 'phlebotomist') {
            if (conversation.patient) {
                conversation.unreadCount.patient = (conversation.unreadCount.patient || 0) + 1;
                recipients.push({ id: conversation.patient.toString(), type: 'patient' });
            }
            if (conversation.lab) {
                conversation.unreadCount.lab = (conversation.unreadCount.lab || 0) + 1;
                recipients.push({ id: conversation.lab.toString(), type: 'lab' });
            }
        }

        await conversation.save();
        console.log('Conversation updated');

        // Create In-App Notifications for all recipients
        try {
            const { createNotification } = await import('./notification.controller');

            for (const recipient of recipients) {
                await createNotification({
                    user: recipient.id,
                    userType: recipient.type,
                    type: 'new_message',
                    title: 'New Message 💬',
                    message: `You have a new message from ${userType}.`,
                    metadata: {
                        conversationId: conversationId,
                        senderType: userType,
                    }
                });
                console.log(`✅ In-app notification sent to ${recipient.type} ${recipient.id}`);
            }
        } catch (notifError) {
            console.error('❌ Failed to create message notification:', notifError);
        }

        // Emit Socket Event (Exclude data buffer for performance)
        const messageForSocket: any = message.toObject();
        messageForSocket.attachments = messageForSocket.attachments.map((att: any) => ({
            _id: att._id,
            filename: att.filename,
            contentType: att.contentType,
            size: att.size,
            // Exclude data buffer
        }));

        if (io) {
            io.to(conversationId).emit('new_message', messageForSocket);
        }

        // Response (Exclude data buffer)
        res.status(201).json({ success: true, message: messageForSocket });
    } catch (error: any) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Messages
export const getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?.id;

        // Verify participation (optional but recommended)
        // ...

        const messages = await Message.find({ conversation: conversationId })
            .sort({ createdAt: 1 })
            .select('-attachments.data'); // Exclude buffer data

        res.status(200).json({ success: true, messages });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark Messages as Read
export const markMessagesAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?.id;
        const userType = req.user?.userType;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        await Message.updateMany(
            { conversation: conversationId, senderId: { $ne: userId }, status: { $ne: 'read' } },
            { status: 'read' }
        );

        // Reset unread count
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
            if (userType === 'patient') {
                conversation.unreadCount.patient = 0;
            } else if (userType === 'lab') {
                conversation.unreadCount.lab = 0;
            } else if (userType === 'phlebotomist') {
                conversation.unreadCount.phlebotomist = 0;
            }
            await conversation.save();
        }

        if (io) {
            io.to(conversationId).emit('messages_read', { conversationId, userId });
        }

        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Attachment
export const getAttachment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { messageId, attachmentIndex } = req.params;

        const message = await Message.findById(messageId);
        if (!message || !message.attachments[Number(attachmentIndex)]) {
            res.status(404).json({ success: false, message: 'Attachment not found' });
            return;
        }

        const attachment = message.attachments[Number(attachmentIndex)];

        res.set('Content-Type', attachment.contentType);
        res.set('Content-Disposition', `inline; filename="${attachment.filename}"`);
        res.send(attachment.data);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
