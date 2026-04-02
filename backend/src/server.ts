import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDatabase from './config/database';
import authRoutes from './routes/auth.routes';
import phlebotomistRoutes from './routes/phlebotomist.routes';
import phlebotomistRequestRoutes from './routes/phlebotomistRequest.routes';
import testRoutes from './routes/test.routes';
import bookingRoutes from './routes/booking.routes';
import labRoutes from './routes/lab.routes';
import notificationRoutes from './routes/notification.routes';
import chatRoutes from './routes/chat.routes';
import contactRoutes from './routes/contact.routes';
import adminRoutes from './routes/admin.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import feedbackRoutes from './routes/feedback.routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import { initializeSocket } from './socket/chat.socket';
import { setIO } from './controllers/chat.controller';

// Initialize Express app
const app: Application = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:5173', 'https://lab2home.netlify.app', process.env.FRONTEND_URL || 'http://localhost:8080'],
        credentials: true,
    },
});

// Setup Socket.io
initializeSocket(io);
setIO(io);

// Export getIO function for other controllers
export const getIO = () => io;

// Middleware
app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:5173', 'https://lab2home.netlify.app', process.env.FRONTEND_URL || 'http://localhost:8080'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// HTTP request logger with custom format
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('🌐 :method :url :status :response-time ms - :res[content-length]'));
} else {
    app.use(morgan('combined'));
}

// Connect to Database
connectDatabase();

// Health check route
app.get('/health', (req, res) => {
    console.log('✅ Health check requested');
    res.status(200).json({
        success: true,
        message: 'Lab2Home API is running! 🚀',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/phlebotomist', phlebotomistRoutes);
app.use('/api/phlebotomist-request', phlebotomistRequestRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/feedback', feedbackRoutes);

// Error Handling Middleware
app.use(notFound); // 404 handler
app.use(errorHandler); // Global error handler

// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║   🏥  Lab2Home Backend Server Running    ║
║                                           ║
║   Port: ${PORT}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}             ║
║                                           ║
╚═══════════════════════════════════════════╝
  `);
    console.log(`📡 Server URL: http://localhost:${PORT}`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
    console.log(`\n🎯 Available Endpoints:`);
    console.log(`   POST /api/auth/signup/patient`);
    console.log(`   POST /api/auth/signup/lab`);
    console.log(`   POST /api/auth/signup/phlebotomist (file → MongoDB)`);
    console.log(`   POST /api/auth/verify-otp`);
    console.log(`   POST /api/auth/resend-otp`);
    console.log(`   POST /api/auth/login (unified)`);
    console.log(`   GET  /api/auth/me (protected)`);
    console.log(`   GET  /api/phlebotomist/traffic-license (protected)`);
    console.log(`   GET  /api/phlebotomist/dashboard (protected)`);
    console.log(`   GET  /api/tests (public)`);
    console.log(`   GET  /api/tests/:id (public)`);
    console.log(`   POST /api/tests (protected - admin)`);
    console.log(`   GET  /api/labs/available (public)`);
    console.log(`   GET  /api/labs/:id/tests (public)`);
    console.log(`   PUT  /api/labs/:id/tests (protected - lab)`);
    console.log(`   POST /api/bookings (protected - patient)`);
    console.log(`   GET  /api/bookings/patient/:id (protected)`);
    console.log(`   GET  /api/bookings/lab/:id (protected)`);
    console.log(`   POST /api/chat/conversation (protected)`);
    console.log(`   GET  /api/chat/conversations (protected)`);
    console.log(`   POST /api/chat/messages (protected)`);
    console.log(`   GET  /api/chat/messages/:id (protected)`);
    console.log(`\n👀 Watching for requests...\n`);
});

export default app;