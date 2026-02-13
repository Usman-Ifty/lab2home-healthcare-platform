import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import {
    createConversation,
    getConversations,
    sendMessage,
    getMessages,
    markMessagesAsRead,
    getAttachment,
} from '../controllers/chat.controller';

const router = express.Router();

router.use(protect); // All chat routes require authentication

router.post('/conversation', createConversation);
router.get('/conversations', getConversations);

// Wrapped route for better error handling
router.post('/messages', (req, res, next) => {
    console.log('POST /messages route hit');
    upload.array('files', 5)(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ success: false, message: `Upload Error: ${err.message}` });
        }
        console.log('Multer processing done');
        next();
    });
}, sendMessage);

router.get('/messages/:conversationId', getMessages);
router.put('/messages/:conversationId/read', markMessagesAsRead);
router.get('/messages/:messageId/attachments/:attachmentIndex', getAttachment);

export default router;
