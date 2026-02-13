import { Request, Response } from 'express';
import Patient from '../models/Patient';
import Lab from '../models/Lab';
import Phlebotomist from '../models/Phlebotomist';
import Admin from '../models/Admin';
import OTP from '../models/OTP';
import Notification from '../models/Notification';
import { generateToken } from '../utils/jwt.util';
import { sendOTPEmail, sendWelcomeEmail, sendAdminNotification, sendAdminPhlebotomistNotification } from '../services/email.service';

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================================
// PATIENT SIGNUP (Step 1: Send OTP)
// ============================================
export const patientSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, phone, dateOfBirth, age, address, password } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !dateOfBirth || !address || !password) {
      res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
      return;
    }

    // Check if email already exists
    const existingPatient = await Patient.findOne({ email: email.toLowerCase() });
    if (existingPatient) {
      // If account exists but is not verified, resend OTP
      if (!existingPatient.isVerified) {
        // Delete old OTP
        await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'signup' });

        // Generate new OTP
        const otp = generateOTP();
        await OTP.create({
          email: email.toLowerCase(),
          otp,
          purpose: 'signup',
        });

        // Send OTP email
        await sendOTPEmail(email, otp, existingPatient.fullName);

        res.status(200).json({
          success: true,
          message: 'Account exists but not verified. New OTP sent to your email.',
          data: {
            email: email.toLowerCase(),
            message: 'OTP sent to your email. Valid for 10 minutes.',
          },
        });
        return;
      }

      // Account exists and is verified
      res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    // Create new patient (unverified)
    const patient = new Patient({
      fullName,
      email: email.toLowerCase(),
      phone,
      dateOfBirth: new Date(dateOfBirth),
      age,
      address,
      password,
      isVerified: false,
    });

    await patient.save();

    // Generate and save OTP
    const otp = generateOTP();
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      purpose: 'signup',
    });

    // Send OTP email
    await sendOTPEmail(email, otp, fullName);

    res.status(201).json({
      success: true,
      message: 'Signup successful! Please check your email for OTP verification.',
      data: {
        email: email.toLowerCase(),
        message: 'OTP sent to your email. Valid for 10 minutes.',
      },
    });
  } catch (error: any) {
    console.error('Patient signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Signup failed',
      error: error.message,
    });
  }
};

// ============================================
// LAB SIGNUP (Step 1: Send OTP with License File Upload)
// ============================================
export const labSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, phone, labName, labAddress, password } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'License document is required',
      });
      return;
    }

    // Validate required fields
    if (!fullName || !email || !phone || !labName || !labAddress || !password) {
      res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
      return;
    }

    // Check if email already exists
    const existingLab = await Lab.findOne({ email: email.toLowerCase() });
    if (existingLab) {
      // If account exists but is not verified, resend OTP
      if (!existingLab.isVerified) {
        // Update lab information with new data if provided
        existingLab.fullName = fullName;
        existingLab.phone = phone;
        existingLab.labName = labName;
        existingLab.labAddress = labAddress;
        existingLab.password = password;
        existingLab.license = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
          filename: req.file.originalname,
          size: req.file.size,
        };
        await existingLab.save();

        // Delete old OTP
        await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'signup' });

        // Generate new OTP
        const otp = generateOTP();
        await OTP.create({
          email: email.toLowerCase(),
          otp,
          purpose: 'signup',
        });

        // Send OTP email
        await sendOTPEmail(email, otp, existingLab.fullName);

        res.status(200).json({
          success: true,
          message: 'Account exists but not verified. New OTP sent to your email.',
          data: {
            email: email.toLowerCase(),
            message: 'OTP sent to your email. Valid for 10 minutes.',
          },
        });
        return;
      }

      // Account exists and is verified
      res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    // Create new lab (unverified) with license file stored in MongoDB
    const lab = new Lab({
      fullName,
      email: email.toLowerCase(),
      phone,
      labName,
      license: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
        size: req.file.size,
      },
      labAddress,
      password,
      isVerified: false,
    });

    await lab.save();

    console.log(`✅ Lab created with license document stored in database (${req.file.size} bytes)`)

      ;

    // Notify all admins about new lab registration
    try {
      const admins = await Admin.find();
      for (const admin of admins) {
        // Send email notification
        await sendAdminNotification(
          admin.email,
          labName,
          email.toLowerCase(),
          fullName,
          phone,
          labAddress
        );

        // Create in-app notification
        await Notification.create({
          user: admin._id,
          userType: 'admin',
          type: 'lab_registered',
          title: 'New Lab Registration',
          message: `${labName} has registered and requires approval`,
          metadata: {
            labName,
            labEmail: email.toLowerCase(),
            contactPerson: fullName,
          },
        });
      }
      console.log(`✅ Notified ${admins.length} admin(s) about new lab registration`);
    } catch (notificationError) {
      console.error('Failed to send admin notifications:', notificationError);
      // Don't fail the registration if notifications fail
    }

    // Generate and save OTP
    const otp = generateOTP();
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      purpose: 'signup',
    });

    // Send OTP email
    await sendOTPEmail(email, otp, fullName);

    res.status(201).json({
      success: true,
      message: 'Signup successful! Please check your email for OTP verification.',
      data: {
        email: email.toLowerCase(),
        message: 'OTP sent to your email. Valid for 10 minutes.',
      },
    });
  } catch (error: any) {
    console.error('Lab signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Signup failed',
      error: error.message,
    });
  }
};

// ============================================
// PHLEBOTOMIST SIGNUP (Step 1: Send OTP)
// ============================================
export const phlebotomistSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, phone, qualification, password } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Traffic license copy is required',
      });
      return;
    }

    // Validate required fields
    if (!fullName || !email || !phone || !qualification || !password) {
      res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
      return;
    }

    // Check if email already exists
    const existingPhlebotomist = await Phlebotomist.findOne({ email: email.toLowerCase() });
    if (existingPhlebotomist) {
      // If account exists but is not verified, resend OTP
      if (!existingPhlebotomist.isVerified) {
        // Update phlebotomist information with new data if provided
        existingPhlebotomist.fullName = fullName;
        existingPhlebotomist.phone = phone;
        existingPhlebotomist.qualification = qualification;
        existingPhlebotomist.password = password;
        existingPhlebotomist.trafficLicense = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
          filename: req.file.originalname,
          size: req.file.size,
        };
        await existingPhlebotomist.save();

        // Delete old OTP
        await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'signup' });

        // Generate new OTP
        const otp = generateOTP();
        await OTP.create({
          email: email.toLowerCase(),
          otp,
          purpose: 'signup',
        });

        // Send OTP email
        await sendOTPEmail(email, otp, existingPhlebotomist.fullName);

        res.status(200).json({
          success: true,
          message: 'Account exists but not verified. New OTP sent to your email.',
          data: {
            email: email.toLowerCase(),
            message: 'OTP sent to your email. Valid for 10 minutes.',
          },
        });
        return;
      }

      // Account exists and is verified
      res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    // Create new phlebotomist (unverified) with file stored in MongoDB
    const phlebotomist = new Phlebotomist({
      fullName,
      email: email.toLowerCase(),
      phone,
      qualification,
      trafficLicense: {
        data: req.file.buffer, // File binary data stored in MongoDB
        contentType: req.file.mimetype,
        filename: req.file.originalname,
        size: req.file.size,
      },
      password,
      isVerified: false,
    });

    await phlebotomist.save();

    console.log(`✅ Phlebotomist created with traffic license stored in database (${req.file.size} bytes)`);

    // Notify all admins about new phlebotomist registration
    try {
      const admins = await Admin.find();
      for (const admin of admins) {
        // Send email notification
        await sendAdminPhlebotomistNotification(
          admin.email,
          fullName,
          email.toLowerCase(),
          phone,
          qualification
        );

        // Create in-app notification
        await Notification.create({
          user: admin._id,
          userType: 'admin',
          type: 'phlebotomist_registered',
          title: '🩺 New Phlebotomist Registration',
          message: `${fullName} has registered as a phlebotomist and is awaiting approval.`,
          metadata: {
            phlebotomistId: phlebotomist._id,
            phlebotomistName: fullName,
            phlebotomistEmail: email.toLowerCase(),
            phlebotomistPhone: phone,
            qualification,
          },
        });
      }
      console.log(`✅ Admin notifications sent for new phlebotomist: ${fullName}`);
    } catch (notificationError) {
      console.error('Failed to send admin notifications:', notificationError);
      // Don't fail the signup if notifications fail
    }

    // Generate and save OTP
    const otp = generateOTP();
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      purpose: 'signup',
    });

    // Send OTP email
    await sendOTPEmail(email, otp, fullName);

    res.status(201).json({
      success: true,
      message: 'Signup successful! Please check your email for OTP verification.',
      data: {
        email: email.toLowerCase(),
        message: 'OTP sent to your email. Valid for 10 minutes.',
      },
    });
  } catch (error: any) {
    console.error('Phlebotomist signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Signup failed',
      error: error.message,
    });
  }
};

// ============================================
// VERIFY OTP (Step 2: Verify and Activate Account)
// ============================================
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, userType } = req.body; // userType: 'patient' or 'lab'

    if (!email || !otp || !userType) {
      res.status(400).json({
        success: false,
        message: 'Email, OTP, and user type are required',
      });
      return;
    }

    // Find OTP record (Check for existing OTP regardless of the code provided first)
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'signup',
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.',
      });
      return;
    }

    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      // Increment attempts
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;

      // If attempts reach 3, generate new OTP and send it
      if (otpRecord.attempts >= 3) {
        // Delete the old OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        // Find user name for email
        let userName = 'User';
        if (userType === 'patient') {
          const u = await Patient.findOne({ email: email.toLowerCase() });
          if (u) userName = u.fullName;
        } else if (userType === 'lab') {
          const u = await Lab.findOne({ email: email.toLowerCase() });
          if (u) userName = u.fullName;
        } else if (userType === 'phlebotomist') {
          const u = await Phlebotomist.findOne({ email: email.toLowerCase() });
          if (u) userName = u.fullName;
        }

        // Generate new OTP
        const newOtp = generateOTP();
        await OTP.create({
          email: email.toLowerCase(),
          otp: newOtp,
          purpose: 'signup',
        });

        // Send new OTP email
        await sendOTPEmail(email, newOtp, userName);

        res.status(400).json({
          success: false,
          message: 'Incorrect OTP. Maximum attempts (3) reached. A new OTP has been sent to your email.',
        });
        return;
      }

      // Save the incremented attempt count
      await otpRecord.save();

      res.status(400).json({
        success: false,
        message: `Incorrect OTP. You have ${3 - otpRecord.attempts} attempts remaining.`,
      });
      return;
    }

    // ===================================
    // OTP MATCHES - PROCEED WITH SUCCESS
    // ===================================

    // Verify and activate account based on user type
    if (userType === 'phlebotomist') {
      const phlebotomist = await Phlebotomist.findOne({ email: email.toLowerCase() });
      if (!phlebotomist) {
        res.status(404).json({
          success: false,
          message: 'Phlebotomist not found',
        });
        return;
      }

      // DO NOT set isVerified = true here
      // Phlebotomists must be approved by admin first
      // phlebotomist.isVerified will remain false until admin approves

      // Delete OTP after successful verification
      await OTP.deleteOne({ _id: otpRecord._id });

      res.status(200).json({
        success: true,
        message: 'Email verified successfully! Your registration is pending admin approval. You will be notified once approved.',
        data: {
          email: phlebotomist.email,
          fullName: phlebotomist.fullName,
          userType: 'phlebotomist',
          status: 'pending_approval',
        },
      });
    } else if (userType === 'patient') {
      const patient = await Patient.findOne({ email: email.toLowerCase() });
      if (!patient) {
        res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
        return;
      }

      patient.isVerified = true;
      await patient.save();

      // Send welcome email
      await sendWelcomeEmail(email, patient.fullName, 'Patient');

      // Generate JWT token
      const token = generateToken({
        id: patient._id.toString(),
        email: patient.email,
        userType: 'patient',
      });

      // Delete OTP after successful verification
      await OTP.deleteOne({ _id: otpRecord._id });

      res.status(200).json({
        success: true,
        message: 'Email verified successfully! Welcome to Lab2Home!',
        data: {
          token,
          user: {
            id: patient._id,
            fullName: patient.fullName,
            email: patient.email,
            phone: patient.phone,
            userType: 'patient',
          },
        },
      });
    } else if (userType === 'lab') {
      const lab = await Lab.findOne({ email: email.toLowerCase() });
      if (!lab) {
        res.status(404).json({
          success: false,
          message: 'Lab not found',
        });
        return;
      }

      // DO NOT set isVerified = true here
      // Labs must be approved by admin first
      // lab.isVerified will remain false until admin approves

      // Delete OTP after successful verification
      await OTP.deleteOne({ _id: otpRecord._id });

      res.status(200).json({
        success: true,
        message: 'Email verified successfully! Your registration is pending admin approval. You will be notified once approved.',
        data: {
          email: lab.email,
          labName: lab.labName,
          fullName: lab.fullName,
          userType: 'lab',
          status: 'pending_approval',
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user type',
      });
    }
  } catch (error: any) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message,
    });
  }
};

// ============================================
// RESEND OTP
// ============================================
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, userType } = req.body;

    if (!email || !userType) {
      res.status(400).json({
        success: false,
        message: 'Email and user type are required',
      });
      return;
    }

    // Check if user exists
    let user;
    let name = '';

    if (userType === 'patient') {
      user = await Patient.findOne({ email: email.toLowerCase() });
      if (user) name = user.fullName;
    } else if (userType === 'lab') {
      user = await Lab.findOne({ email: email.toLowerCase() });
      if (user) name = user.fullName;
    } else if (userType === 'phlebotomist') {
      user = await Phlebotomist.findOne({ email: email.toLowerCase() });
      if (user) name = user.fullName;
    }

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
        message: 'Email already verified',
      });
      return;
    }

    // Delete old OTP
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'signup' });

    // Generate new OTP
    const otp = generateOTP();
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      purpose: 'signup',
    });

    // Send OTP email
    await sendOTPEmail(email, otp, name);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      data: {
        email: email.toLowerCase(),
        message: 'New OTP sent to your email. Valid for 10 minutes.',
      },
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: error.message,
    });
  }
};

// ============================================
// UNIFIED LOGIN (Automatically detects Patient or Lab)
// ============================================
export const unifiedLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Try to find in Patient collection first
    let patient = await Patient.findOne({ email: email.toLowerCase() }).select('+password');

    if (patient) {
      // Found as patient
      if (!patient.isVerified) {
        res.status(403).json({
          success: false,
          message: 'Please verify your email first',
          needsVerification: true,
        });
        return;
      }

      if (!patient.isActive) {
        res.status(403).json({
          success: false,
          message: 'Your account has been deactivated by the admin team. Please contact support.',
        });
        return;
      }

      // Verify password
      const isPasswordCorrect = await patient.comparePassword(password);
      if (!isPasswordCorrect) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Generate token for patient
      const token = generateToken({
        id: patient._id.toString(),
        email: patient.email,
        userType: 'patient',
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: patient._id,
            fullName: patient.fullName,
            email: patient.email,
            phone: patient.phone,
            address: patient.address,
            userType: 'patient',
          },
        },
      });
      return;
    }

    // Not found in Patient, try Lab collection
    let lab = await Lab.findOne({ email: email.toLowerCase() }).select('+password');

    if (lab) {
      // Found as lab
      if (!lab.isVerified) {
        res.status(403).json({
          success: false,
          message: 'Your lab registration is pending admin approval. You will be notified once approved.',
          needsApproval: true,
        });
        return;
      }

      if (!lab.isActive) {
        res.status(403).json({
          success: false,
          message: 'Your account has been deactivated by the admin team. Please contact support.',
        });
        return;
      }

      // Verify password
      const isPasswordCorrect = await lab.comparePassword(password);
      if (!isPasswordCorrect) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Generate token for lab
      const token = generateToken({
        id: lab._id.toString(),
        email: lab.email,
        userType: 'lab',
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: lab._id,
            fullName: lab.fullName,
            email: lab.email,
            phone: lab.phone,
            labName: lab.labName,
            labAddress: lab.labAddress,
            userType: 'lab',
          },
        },
      });
      return;
    }

    // Not found in Patient or Lab, try Phlebotomist collection
    let phlebotomist = await Phlebotomist.findOne({ email: email.toLowerCase() }).select('+password');

    if (phlebotomist) {
      // Found as phlebotomist
      if (!phlebotomist.isVerified) {
        res.status(403).json({
          success: false,
          message: 'Your phlebotomist registration is pending admin approval. You will be notified once approved.',
          needsApproval: true,
        });
        return;
      }

      if (!phlebotomist.isActive) {
        res.status(403).json({
          success: false,
          message: 'Your account has been deactivated by the admin team. Please contact support.',
        });
        return;
      }

      // Verify password
      const isPasswordCorrect = await phlebotomist.comparePassword(password);
      if (!isPasswordCorrect) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Generate token for phlebotomist
      const token = generateToken({
        id: phlebotomist._id.toString(),
        email: phlebotomist.email,
        userType: 'phlebotomist',
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: phlebotomist._id,
            fullName: phlebotomist.fullName,
            email: phlebotomist.email,
            phone: phlebotomist.phone,
            qualification: phlebotomist.qualification,
            userType: 'phlebotomist',
          },
        },
      });
      return;
    }

    // Not found in Patient, Lab, or Phlebotomist, try Admin collection
    let admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (admin) {
      // Found as admin
      if (!admin.isActive) {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.',
        });
        return;
      }

      // Verify password
      const isPasswordCorrect = await admin.comparePassword(password);
      if (!isPasswordCorrect) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Generate token for admin
      const token = generateToken({
        id: admin._id.toString(),
        email: admin.email,
        userType: 'admin',
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: admin._id,
            email: admin.email,
            userType: 'admin',
          },
        },
      });
      return;
    }

    // Not found in any collection
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });

  } catch (error: any) {
    console.error('Unified login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// ============================================
// PATIENT LOGIN (Legacy - kept for compatibility)
// ============================================
export const patientLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Find patient with password field
    const patient = await Patient.findOne({ email: email.toLowerCase() }).select('+password');

    if (!patient) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if verified
    if (!patient.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        needsVerification: true,
      });
      return;
    }

    // Check if active
    if (!patient.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated by the admin team. Please contact support.',
      });
      return;
    }

    // Verify password
    const isPasswordCorrect = await patient.comparePassword(password);
    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate token
    const token = generateToken({
      id: patient._id.toString(),
      email: patient.email,
      userType: 'patient',
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: patient._id,
          fullName: patient.fullName,
          email: patient.email,
          phone: patient.phone,
          address: patient.address,
          userType: 'patient',
        },
      },
    });
  } catch (error: any) {
    console.error('Patient login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// ============================================
// LAB LOGIN (Legacy - kept for compatibility)
// ============================================
export const labLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Find lab with password field
    const lab = await Lab.findOne({ email: email.toLowerCase() }).select('+password');

    if (!lab) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if verified
    if (!lab.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        needsVerification: true,
      });
      return;
    }

    // Check if active
    if (!lab.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated by the admin team. Please contact support.',
      });
      return;
    }

    // Verify password
    const isPasswordCorrect = await lab.comparePassword(password);
    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate token
    const token = generateToken({
      id: lab._id.toString(),
      email: lab.email,
      userType: 'lab',
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: lab._id,
          fullName: lab.fullName,
          email: lab.email,
          phone: lab.phone,
          labName: lab.labName,
          labAddress: lab.labAddress,
          userType: 'lab',
        },
      },
    });
  } catch (error: any) {
    console.error('Lab login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// ============================================
// GET CURRENT USER
// ============================================
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (req.user.userType === 'phlebotomist') {
      const phlebotomist = await Phlebotomist.findById(req.user.id);
      if (!phlebotomist) {
        res.status(404).json({
          success: false,
          message: 'Phlebotomist not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: phlebotomist._id,
          fullName: phlebotomist.fullName,
          email: phlebotomist.email,
          phone: phlebotomist.phone,
          qualification: phlebotomist.qualification,
          availability: phlebotomist.isAvailable,
          trafficLicenseInfo: {
            filename: phlebotomist.trafficLicense.filename,
            size: phlebotomist.trafficLicense.size,
            contentType: phlebotomist.trafficLicense.contentType,
          },
          userType: 'phlebotomist',
        },
      });
    } else if (req.user.userType === 'patient') {
      const patient = await Patient.findById(req.user.id);
      if (!patient) {
        res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: patient._id,
          fullName: patient.fullName,
          email: patient.email,
          phone: patient.phone,
          address: patient.address,
          dateOfBirth: patient.dateOfBirth,

          userType: 'patient',
        },
      });
    } else if (req.user.userType === 'lab') {
      const lab = await Lab.findById(req.user.id);
      if (!lab) {
        res.status(404).json({
          success: false,
          message: 'Lab not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: lab._id,
          fullName: lab.fullName,
          email: lab.email,
          phone: lab.phone,
          labName: lab.labName,
          labAddress: lab.labAddress,
          userType: 'lab',
        },
      });
    } else if (req.user.userType === 'admin') {
      const admin = await Admin.findById(req.user.id);
      if (!admin) {
        res.status(404).json({
          success: false,
          message: 'Admin not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: admin._id,
          email: admin.email,
          userType: 'admin',
        },
      });
    }
  } catch (error: any) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
      error: error.message,
    });
  }
};

// ============================================
// FORGOT PASSWORD - Step 1: Send Reset OTP
// ============================================
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    // Search for user across all collections
    let user: any = null;
    let userName = '';
    let userType = '';

    // Check Patient
    const patient = await Patient.findOne({ email: email.toLowerCase() });
    if (patient) {
      user = patient;
      userName = patient.fullName;
      userType = 'patient';
    }

    // Check Lab if not found in Patient
    if (!user) {
      const lab = await Lab.findOne({ email: email.toLowerCase() });
      if (lab) {
        user = lab;
        userName = lab.fullName;
        userType = 'lab';
      }
    }

    // Check Phlebotomist if not found in Lab
    if (!user) {
      const phlebotomist = await Phlebotomist.findOne({ email: email.toLowerCase() });
      if (phlebotomist) {
        user = phlebotomist;
        userName = phlebotomist.fullName;
        userType = 'phlebotomist';
      }
    }

    // If user not found, return error message
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Account not found. Please check your email or sign up.',
      });
      return;
    }

    // Check if user is verified
    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Please verify your email first before resetting password',
      });
      return;
    }

    // Delete any existing password reset OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'reset-password' });

    // Generate new OTP
    const otp = generateOTP();
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      purpose: 'reset-password',
    });

    // Send OTP email
    await sendOTPEmail(email, otp, userName);

    console.log(`🔐 Password reset OTP sent to ${email} (${userType})`);

    res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email',
      data: {
        email: email.toLowerCase(),
        message: 'OTP sent to your email. Valid for 10 minutes.',
      },
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: error.message,
    });
  }
};

// ============================================
// FORGOT PASSWORD - Step 2: Verify Reset OTP
// ============================================
export const verifyResetOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
      return;
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      purpose: 'reset-password',
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
      return;
    }

    // OTP is valid - don't delete it yet, we need it for password reset
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        email: email.toLowerCase(),
        message: 'You can now reset your password',
      },
    });
  } catch (error: any) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message,
    });
  }
};

// ============================================
// FORGOT PASSWORD - Step 3: Reset Password
// ============================================
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required',
      });
      return;
    }

    // Verify OTP one more time
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      purpose: 'reset-password',
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
      return;
    }

    // Find user and update password
    let user: any = null;
    let userType = '';

    // Check Patient
    const patient = await Patient.findOne({ email: email.toLowerCase() });
    if (patient) {
      patient.password = newPassword; // Will be hashed by pre-save hook
      await patient.save();
      user = patient;
      userType = 'patient';
    }

    // Check Lab if not found in Patient
    if (!user) {
      const lab = await Lab.findOne({ email: email.toLowerCase() });
      if (lab) {
        lab.password = newPassword; // Will be hashed by pre-save hook
        await lab.save();
        user = lab;
        userType = 'lab';
      }
    }

    // Check Phlebotomist if not found in Lab
    if (!user) {
      const phlebotomist = await Phlebotomist.findOne({ email: email.toLowerCase() });
      if (phlebotomist) {
        phlebotomist.password = newPassword; // Will be hashed by pre-save hook
        await phlebotomist.save();
        user = phlebotomist;
        userType = 'phlebotomist';
      }
    }

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Delete the OTP after successful password reset
    await OTP.deleteOne({ _id: otpRecord._id });

    console.log(`✅ Password reset successful for ${email} (${userType})`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.',
      data: {
        email: email.toLowerCase(),
      },
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
};

// ============================================
// REQUEST PASSWORD CHANGE OTP (For logged-in users)
// ============================================
export const requestPasswordChangeOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    // Check if user exists in any collection
    let user = await Patient.findOne({ email: email.toLowerCase() });
    let userType = 'patient';
    let userName = user?.fullName;

    if (!user) {
      user = await Lab.findOne({ email: email.toLowerCase() });
      userType = 'lab';
      userName = user?.fullName;
    }

    if (!user) {
      user = await Phlebotomist.findOne({ email: email.toLowerCase() });
      userType = 'phlebotomist';
      userName = user?.fullName;
    }

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Delete any existing password change OTPs
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'password-change' });

    // Generate new OTP
    const otp = generateOTP();
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      purpose: 'password-change',
      userType,
    });

    // Send OTP email
    await sendOTPEmail(email, otp, userName || 'User');

    console.log(`✅ Password change OTP sent to ${email} (${userType})`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email successfully',
      data: {
        email: email.toLowerCase(),
      },
    });
  } catch (error: any) {
    console.error('Request password change OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

// ============================================
// VERIFY PASSWORD CHANGE OTP
// ============================================
export const verifyPasswordChangeOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
      return;
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      purpose: 'password-change',
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
      return;
    }

    console.log(`✅ Password change OTP verified for ${email}`);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        email: email.toLowerCase(),
      },
    });
  } catch (error: any) {
    console.error('Verify password change OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message,
    });
  }
};

// ============================================
// CHANGE PASSWORD (With OTP verification)
// ============================================
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required',
      });
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
      return;
    }

    // Find and verify OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      purpose: 'password-change',
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
      return;
    }

    const userType = otpRecord.userType;
    let user: any = null;

    // Find user and update password
    if (userType === 'patient') {
      user = await Patient.findOne({ email: email.toLowerCase() });
      if (user) {
        user.password = newPassword;
        await user.save();
      }
    } else if (userType === 'lab') {
      user = await Lab.findOne({ email: email.toLowerCase() });
      if (user) {
        user.password = newPassword;
        await user.save();
      }
    } else if (userType === 'phlebotomist') {
      user = await Phlebotomist.findOne({ email: email.toLowerCase() });
      if (user) {
        user.password = newPassword;
        await user.save();
      }
    }

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Delete the OTP after successful password change
    await OTP.deleteOne({ _id: otpRecord._id });

    console.log(`✅ Password changed successfully for ${email} (${userType})`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully!',
      data: {
        email: email.toLowerCase(),
      },
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};
