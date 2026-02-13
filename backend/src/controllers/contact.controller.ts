import { Request, Response } from 'express';
import Contact from '../models/Contact';

// ============================================
// SUBMIT CONTACT FORM
// ============================================
export const submitContactForm = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
            return;
        }

        // Create contact entry
        const contact = await Contact.create({
            name,
            email,
            subject,
            message,
        });

        // Optional: Send email notification to admin (TODO)

        res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully! We will get back to you soon.',
            data: contact,
        });
    } catch (error: any) {
        console.error('Submit contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message,
        });
    }
};

// ============================================
// GET ALL MESSAGES (Admin only - Future use)
// ============================================
export const getAllMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message,
        });
    }
};
