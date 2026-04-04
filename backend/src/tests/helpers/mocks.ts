/**
 * Centralized mock definitions for all external services.
 * Import and call the needed mock function at the top of each test file
 * before any route/controller imports.
 */

// ── Stripe (must be called before any module that imports stripe) ──
export const mockStripe = () => {
    jest.mock('stripe', () => {
        return jest.fn().mockImplementation(() => ({
            checkout: { sessions: { create: jest.fn(), retrieve: jest.fn() } }
        }));
    });
};

// ── Email Service ──
export const mockEmailService = () => {
    jest.mock('../../services/email.service', () => ({
        sendOTPEmail: jest.fn(),
        sendWelcomeEmail: jest.fn(),
        sendAdminNotification: jest.fn(),
        sendAdminPhlebotomistNotification: jest.fn(),
        sendNewBookingEmail: jest.fn().mockResolvedValue(true),
        sendOrderConfirmationEmail: jest.fn(),
        sendOrderStatusUpdateEmail: jest.fn(),
        sendAdminNewOrderEmail: jest.fn(),
    }));
};

// ── Stripe Service (for modules that import stripe.service directly) ──
export const mockStripeService = () => {
    jest.mock('../../services/stripe.service', () => ({
        __esModule: true,
        createCheckoutSession: jest.fn().mockResolvedValue({
            url: 'https://checkout.stripe.com/fake-url',
            sessionId: 'cs_test_fake_session',
        }),
        verifySession: jest.fn(),
    }));
};

// ── Notification Controller ──
export const mockNotificationController = () => {
    jest.mock('../../controllers/notification.controller', () => ({
        createNotification: jest.fn().mockResolvedValue(true),
    }));
};

// ── Auth Middleware (bypass protect + restrictTo) ──
export const mockAuthMiddleware = (defaultRole: string = 'patient') => {
    jest.mock('../../middleware/auth.middleware', () => ({
        protect: (req: any, _res: any, next: any) => {
            req.user = {
                id: req.body?.patient || req.params?.patientId || 'mockUserId',
                userType: defaultRole,
            };
            next();
        },
        restrictTo: (..._roles: string[]) => (_req: any, _res: any, next: any) => next(),
    }));
};
