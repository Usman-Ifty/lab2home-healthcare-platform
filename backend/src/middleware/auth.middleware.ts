import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt.util';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

// User type authorization (patient, lab, phlebotomist, or admin)
export const authorizeUserType = (...userTypes: ('patient' | 'lab' | 'phlebotomist' | 'admin')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized access.',
      });
      return;
    }

    if (!userTypes.includes(req.user.userType)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required user type: ${userTypes.join(' or ')}`,
      });
      return;
    }

    next();
  };
};

// Alias for authenticateToken (commonly used as 'protect' in routes)
export const protect = authenticateToken;

// Alias for authorizeUserType (commonly used as 'restrictTo' in routes)
export const restrictTo = authorizeUserType;

