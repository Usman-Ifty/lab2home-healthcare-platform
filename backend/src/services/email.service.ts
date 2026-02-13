import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send email function
export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Lab2Home <noreply@lab2home.com>',
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending email: ${error}`);
    throw new Error('Failed to send email');
  }
};

// OTP Email Template
export const sendOTPEmail = async (email: string, otp: string, name: string): Promise<void> => {
  const subject = 'Verify Your Email - Lab2Home';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 20px 0; border-radius: 8px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Lab2Home</h1>
          <p>Healthcare at Your Doorstep</p>
        </div>
        <div class="content">
          <h2>Hello ${name}! 👋</h2>
          <p>Thank you for signing up with Lab2Home. To complete your registration, please verify your email address.</p>
          
          <p><strong>Your OTP (One-Time Password) is:</strong></p>
          <div class="otp-box">${otp}</div>
          
          <p>This OTP will expire in <strong>10 minutes</strong>.</p>
          
          <p>If you didn't create an account with Lab2Home, please ignore this email.</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// Welcome Email Template
export const sendWelcomeEmail = async (email: string, name: string, role: string): Promise<void> => {
  const subject = 'Welcome to Lab2Home! 🎉';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Welcome to Lab2Home!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}! 🎉</h2>
          <p>Your email has been successfully verified, and your <strong>${role}</strong> account is now active!</p>
          
          <p>You can now:</p>
          <ul>
            ${role === 'patient' ? `
              <li>Book lab tests from home</li>
              <li>View your test reports</li>
              <li>Track your health score</li>
              <li>Schedule appointments</li>
            ` : `
              <li>Manage test appointments</li>
              <li>Upload test results</li>
              <li>Track daily operations</li>
              <li>Monitor performance metrics</li>
            `}
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Go to Dashboard</a>
          </div>
          
          <p>If you have any questions, feel free to reach out to our support team.</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>Healthcare at Your Doorstep</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// Booking Status Update Email Template
export const sendBookingStatusUpdateEmail = async (
  email: string,
  patientName: string,
  testName: string,
  status: string,
  bookingDate: string,
  timeSlot: string,
  labName: string
): Promise<void> => {
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    confirmed: {
      title: 'Booking Confirmed ✅',
      message: 'Your test booking has been confirmed by the lab.',
      color: '#10b981'
    },
    'in-progress': {
      title: 'Sample Collection In Progress 🔬',
      message: 'Your sample is being collected. The lab will process it shortly.',
      color: '#3b82f6'
    },
    completed: {
      title: 'Test Completed ✨',
      message: 'Your test has been completed! Your report will be available soon.',
      color: '#8b5cf6'
    },
    cancelled: {
      title: 'Booking Cancelled ❌',
      message: 'Your test booking has been cancelled.',
      color: '#ef4444'
    }
  };

  const statusInfo = statusMessages[status] || {
    title: 'Status Updated',
    message: `Your booking status has been updated to: ${status}`,
    color: '#667eea'
  };

  const subject = `${statusInfo.title} - Lab2Home`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-badge { display: inline-block; padding: 8px 16px; background: ${statusInfo.color}; color: white; border-radius: 20px; font-weight: bold; margin: 15px 0; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusInfo.color}; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .info-label { font-weight: bold; color: #666; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Lab2Home</h1>
          <p>Healthcare at Your Doorstep</p>
        </div>
        <div class="content">
          <h2>Hello ${patientName}! 👋</h2>
          <p>${statusInfo.message}</p>
          
          <div style="text-align: center;">
            <span class="status-badge">${statusInfo.title}</span>
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: ${statusInfo.color};">Booking Details</h3>
            <div class="info-row">
              <span class="info-label">Test:</span>
              <span>${testName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Lab:</span>
              <span>${labName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${bookingDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time:</span>
              <span>${timeSlot}</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="info-label">Status:</span>
              <span style="color: ${statusInfo.color}; font-weight: bold; text-transform: capitalize;">${status.replace('-', ' ')}</span>
            </div>
          </div>
          
          ${status === 'completed' ? `
            <p style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
              📊 <strong>Your report will be available in your dashboard soon!</strong>
            </p>
          ` : ''}
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient" 
               style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">
              View Dashboard
            </a>
          </div>
          
          <p>If you have any questions, please contact the lab directly or reach out to our support team.</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// Report Uploaded Email Template
export const sendReportUploadedEmail = async (
  email: string,
  patientName: string,
  testName: string,
  reportUrl: string,
  labName: string
): Promise<void> => {
  const subject = 'Your Test Report is Ready! 📄 - Lab2Home';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Lab2Home</h1>
          <p>Healthcare at Your Doorstep</p>
        </div>
        <div class="content">
          <h2>Hello ${patientName}! 👋</h2>
          <p>Great news! Your test report for <strong>${testName}</strong> is now available.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #10b981;">Report Details</h3>
            <p><strong>Lab:</strong> ${labName}</p>
            <p><strong>Test:</strong> ${testName}</p>
            <p><strong>Status:</strong> Completed ✅</p>
          </div>
          
          <p>You can view and download your report by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${reportUrl}" class="button" target="_blank">View Report</a>
          </div>
          
          <p>Or log in to your dashboard to view all your reports.</p>
          
          <div style="text-align: center; margin-top: 10px;">
             <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/reports" style="color: #667eea; text-decoration: none;">Go to Dashboard</a>
          </div>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// New Booking Email Template (for Lab)
export const sendNewBookingEmail = async (
  email: string,
  labName: string,
  patientName: string,
  testName: string,
  bookingDate: string,
  timeSlot: string
): Promise<void> => {
  const subject = 'New Booking Received! 📅 - Lab2Home';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Lab2Home</h1>
          <p>Healthcare at Your Doorstep</p>
        </div>
        <div class="content">
          <h2>Hello ${labName}! 👋</h2>
          <p>You have received a new booking request!</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #667eea;">Booking Details</h3>
            <p><strong>Patient:</strong> ${patientName}</p>
            <p><strong>Test:</strong> ${testName}</p>
            <p><strong>Date:</strong> ${bookingDate}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
          </div>
          
          <p>Please log in to your dashboard to view details and manage this booking.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/lab/appointments" class="button">View Booking</a>
          </div>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// ============================================
// ADMIN NOTIFICATION - New Lab Registration
// ============================================
export const sendAdminNotification = async (
  adminEmail: string,
  labName: string,
  labEmail: string,
  contactPerson: string,
  phone: string,
  address: string
): Promise<void> => {
  const subject = `New Lab Registration Pending Approval - ${labName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .info-row { padding: 8px 0; border-bottom: 1px solid #eee; }
        .info-label { font-weight: bold; color: #666; display: inline-block; width: 150px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Lab2Home Admin</h1>
          <p>New Lab Registration Alert</p>
        </div>
        <div class="content">
          <div class="alert-box">
            <strong>⚠️ Action Required:</strong> A new laboratory has registered and requires your approval.
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #667eea;">Lab Details</h3>
            <div class="info-row">
              <span class="info-label">Lab Name:</span>
              <span><strong>${labName}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Contact Person:</span>
              <span>${contactPerson}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span>${labEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span>${phone}</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="info-label">Address:</span>
              <span>${address}</span>
            </div>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Review the lab's license document</li>
            <li>Verify the lab's credentials</li>
            <li>Approve or reject the registration</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/admin/labs" class="button">Review Lab Registration</a>
          </div>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: adminEmail, subject, html });
};

// ============================================
// LAB APPROVAL EMAIL
// ============================================
export const sendLabApprovalEmail = async (
  labEmail: string,
  labName: string
): Promise<void> => {
  const subject = `🎉 Your Lab Registration Has Been Approved!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .features-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature-item { padding: 10px 0; border-bottom: 1px solid #eee; }
        .feature-item:last-child { border-bottom: none; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations!</h1>
          <p>Your Lab Has Been Approved</p>
        </div>
        <div class="content">
          <h2>Hello ${labName}! 👋</h2>
          
          <div class="success-box">
            <strong>✅ Great News!</strong> Your lab registration has been approved by our admin team. You can now start accepting bookings from patients!
          </div>
          
          <div class="features-box">
            <h3 style="margin-top: 0; color: #10b981;">You Can Now:</h3>
            <div class="feature-item">
              ✅ <strong>Login to Your Dashboard</strong> - Access your lab management portal
            </div>
            <div class="feature-item">
              ✅ <strong>Accept Booking Requests</strong> - Receive and manage patient bookings
            </div>
            <div class="feature-item">
              ✅ <strong>Upload Test Reports</strong> - Provide test results to patients
            </div>
            <div class="feature-item">
              ✅ <strong>Manage Your Profile</strong> - Update lab information and services
            </div>
            <div class="feature-item">
              ✅ <strong>Track Performance</strong> - View analytics and booking statistics
            </div>
          </div>
          
          <p><strong>Getting Started:</strong></p>
          <ol>
            <li>Login to your dashboard using your registered email</li>
            <li>Complete your lab profile with available tests</li>
            <li>Set your operating hours and time slots</li>
            <li>Start accepting patient bookings!</li>
          </ol>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/login" class="button">Login to Dashboard</a>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>Welcome to the Lab2Home family! 🏥</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: labEmail, subject, html });
};

// ============================================
// LAB REJECTION EMAIL
// ============================================
export const sendLabRejectionEmail = async (
  labEmail: string,
  labName: string,
  reason: string
): Promise<void> => {
  const subject = `Lab Registration Status Update - ${labName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .reason-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Lab2Home</h1>
          <p>Registration Status Update</p>
        </div>
        <div class="content">
          <h2>Hello ${labName},</h2>
          
          <p>Thank you for your interest in joining Lab2Home.</p>
          
          <div class="info-box">
            We regret to inform you that we are unable to approve your lab registration at this time.
          </div>
          
          <div class="reason-box">
            <h3 style="margin-top: 0; color: #ef4444;">Reason for Rejection:</h3>
            <p style="margin: 0;">${reason}</p>
          </div>
          
          <p><strong>What You Can Do:</strong></p>
          <ul>
            <li>Review the rejection reason carefully</li>
            <li>Address the issues mentioned</li>
            <li>Contact our support team if you need clarification</li>
            <li>Reapply once you've resolved the concerns</li>
          </ul>
          
          <p>If you believe this decision was made in error or would like to discuss this further, please contact our support team at <a href="mailto:support@lab2home.com">support@lab2home.com</a>.</p>
          
          <p>We appreciate your understanding and hope to work with you in the future.</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: labEmail, subject, html });
};

// ============================================
// LAB ACTIVATION EMAIL
// ============================================
export const sendLabActivationEmail = async (
  labEmail: string,
  labName: string
): Promise<void> => {
  const subject = `✅ Your Lab Has Been Activated - ${labName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Lab Activated!</h1>
          <p>You're Back Online</p>
        </div>
        <div class="content">
          <h2>Hello ${labName}! 👋</h2>
          
          <div class="success-box">
            <strong>Good News!</strong> Your lab has been activated by our admin team.
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #10b981;">What This Means:</h3>
            <p>✅ Your lab is now <strong>visible to patients</strong></p>
            <p>✅ You can <strong>accept new booking requests</strong></p>
            <p>✅ Patients can find and book your services</p>
            <p>✅ All features are fully operational</p>
          </div>
          
          <p>You can now start receiving and managing patient bookings through your dashboard.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/lab" class="button">Go to Dashboard</a>
          </div>
          
          <p>Thank you for being part of Lab2Home!</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: labEmail, subject, html });
};

// ============================================
// LAB DEACTIVATION EMAIL
// ============================================
export const sendLabDeactivationEmail = async (
  labEmail: string,
  labName: string
): Promise<void> => {
  const subject = `Lab Temporarily Deactivated - ${labName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Lab Deactivated</h1>
          <p>Temporary Status Change</p>
        </div>
        <div class="content">
          <h2>Hello ${labName},</h2>
          
          <div class="warning-box">
            <strong>Notice:</strong> Your lab has been temporarily deactivated by our admin team.
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #f59e0b;">What This Means:</h3>
            <p>❌ Your lab is <strong>not visible to patients</strong></p>
            <p>❌ You <strong>cannot accept new booking requests</strong></p>
            <p>✅ You can still <strong>access your dashboard</strong></p>
            <p>✅ You can still <strong>view existing bookings</strong></p>
            <p>✅ You can still <strong>upload reports for existing bookings</strong></p>
          </div>
          
          <p><strong>What You Should Do:</strong></p>
          <ul>
            <li>Contact our admin team to understand the reason</li>
            <li>Address any outstanding issues</li>
            <li>Continue managing your existing bookings</li>
            <li>Wait for reactivation notification</li>
          </ul>
          
          <p>If you have questions or concerns about this deactivation, please contact our support team at <a href="mailto:support@lab2home.com">support@lab2home.com</a>.</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: labEmail, subject, html });
};

// ============================================
// PHLEBOTOMIST APPROVAL EMAIL
// ============================================
export const sendPhlebotomistApprovalEmail = async (
  email: string,
  fullName: string
): Promise<void> => {
  const subject = `🎉 Your Phlebotomist Registration Has Been Approved!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .features-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature-item { padding: 10px 0; border-bottom: 1px solid #eee; }
        .feature-item:last-child { border-bottom: none; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations!</h1>
          <p>Your Registration Has Been Approved</p>
        </div>
        <div class="content">
          <h2>Hello ${fullName}! 👋</h2>
          
          <div class="success-box">
            <strong>✅ Great News!</strong> Your phlebotomist registration has been approved by our admin team. You can now start accepting assignments!
          </div>
          
          <div class="features-box">
            <h3 style="margin-top: 0; color: #10b981;">You Can Now:</h3>
            <div class="feature-item">
              ✅ <strong>Login to Your Dashboard</strong> - Access your assigned tasks
            </div>
            <div class="feature-item">
              ✅ <strong>Accept Assignments</strong> - Receive and manage sample collection requests
            </div>
            <div class="feature-item">
              ✅ <strong>View Patient Details</strong> - See location and test requirements
            </div>
            <div class="feature-item">
              ✅ <strong>Update Status</strong> - Mark samples as collected and delivered
            </div>
            <div class="feature-item">
              ✅ <strong>Track Earnings</strong> - View your completed tasks and earnings
            </div>
          </div>
          
          <p><strong>Getting Started:</strong></p>
          <ol>
            <li>Login to your dashboard using your registered email</li>
            <li>Mark yourself as "Available" to receive requests</li>
            <li>Accept incoming assignments from labs</li>
            <li>Start collecting samples!</li>
          </ol>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Login to Dashboard</a>
          </div>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>Welcome to the Lab2Home team! 🩸</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// ============================================
// PHLEBOTOMIST ASSIGNMENT EMAILS
// ============================================

export const sendPhlebotomistRequestEmail = async (
  email: string,
  phlebotomistName: string,
  labName: string,
  patientName: string,
  date: string,
  time: string
): Promise<void> => {
  const subject = `New Assignment Request from ${labName} 📋`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Lab2Home</h1>
          <p>New Assignment Request</p>
        </div>
        <div class="content">
          <h2>Hello ${phlebotomistName}! 👋</h2>
          <p><strong>${labName}</strong> has sent you a new sample collection request.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #667eea;">Booking Details</h3>
            <p><strong>Patient:</strong> ${patientName}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
          </div>
          
          <p>Please log in to your dashboard to accept or reject this request.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/phlebotomist/appointments" class="button">View Request</a>
          </div>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail({ to: email, subject, html });
};

export const sendRequestAcceptedEmail = async (
  email: string,
  labName: string,
  phlebotomistName: string,
  patientName: string,
  date: string
): Promise<void> => {
  const subject = `Request Accepted by ${phlebotomistName} ✅`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Request Accepted!</h1>
        </div>
        <div class="content">
          <h2>Hello ${labName},</h2>
          
          <div class="info-box">
            <p><strong>${phlebotomistName}</strong> has accepted your assignment request for patient <strong>${patientName}</strong> on <strong>${date}</strong>.</p>
          </div>
          
          <p>The booking status has been updated to <strong>Confirmed</strong>.</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail({ to: email, subject, html });
};

export const sendRequestRejectedEmail = async (
  email: string,
  labName: string,
  phlebotomistName: string,
  reason: string,
  date: string
): Promise<void> => {
  const subject = `Request Declined by ${phlebotomistName} ❌`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .reason-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Request Declined</h1>
        </div>
        <div class="content">
          <h2>Hello ${labName},</h2>
          
          <p><strong>${phlebotomistName}</strong> has declined your assignment request for the appointment on <strong>${date}</strong>.</p>
          
          <div class="reason-box">
            <strong>Reason:</strong> ${reason}
          </div>
          
          <p>Please review the booking and assign another phlebotomist.</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail({ to: email, subject, html });
};

export const sendPhlebotomistAssignedEmail = async (
  email: string,
  patientName: string,
  phlebotomistName: string,
  phlebotomistPhone: string,
  date: string,
  time: string
): Promise<void> => {
  const subject = `Phlebotomist Assigned for Your Appointment 👨‍⚕️`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Lab2Home</h1>
          <p>Phlebotomist Assigned</p>
        </div>
        <div class="content">
          <h2>Hello ${patientName}! 👋</h2>
          <p>A phlebotomist has been assigned for your upcoming appointment.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #667eea;">Phlebotomist Details</h3>
            <p><strong>Name:</strong> ${phlebotomistName}</p>
            <p><strong>Phone:</strong> ${phlebotomistPhone}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
          </div>
          
          <p>The phlebotomist will arrive at your location at the scheduled time.</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail({ to: email, subject, html });
};

// ============================================
// PHLEBOTOMIST REJECTION EMAIL
// ============================================
export const sendPhlebotomistRejectionEmail = async (
  email: string,
  fullName: string,
  reason: string
): Promise<void> => {
  const subject = `Phlebotomist Registration Status Update`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .reason-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Lab2Home</h1>
          <p>Registration Status Update</p>
        </div>
        <div class="content">
          <h2>Hello ${fullName},</h2>
          
          <p>Thank you for your interest in joining Lab2Home as a phlebotomist.</p>
          
          <div class="info-box">
            We regret to inform you that we are unable to approve your registration at this time.
          </div>
          
          <div class="reason-box">
            <h3 style="margin-top: 0; color: #ef4444;">Reason for Rejection:</h3>
            <p style="margin: 0;">${reason}</p>
          </div>
          
          <p><strong>What You Can Do:</strong></p>
          <ul>
            <li>Review the rejection reason carefully</li>
            <li>Address the issues mentioned</li>
            <li>Contact our support team if you need clarification</li>
            <li>Reapply once you've resolved the concerns</li>
          </ul>
          
          <p>If you believe this decision was made in error or would like to discuss this further, please contact our support team at <a href="mailto:support@lab2home.com">support@lab2home.com</a>.</p>
          
          <p>We appreciate your understanding and hope to work with you in the future.</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// ============================================
// PHLEBOTOMIST ACTIVATION EMAIL
// ============================================
export const sendPhlebotomistActivationEmail = async (
  email: string,
  fullName: string
): Promise<void> => {
  const subject = `✅ Your Account Has Been Activated`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Account Activated!</h1>
          <p>You're Back Online</p>
        </div>
        <div class="content">
          <h2>Hello ${fullName}! 👋</h2>
          
          <div class="success-box">
            <strong>Good News!</strong> Your account has been activated by our admin team.
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #10b981;">What This Means:</h3>
            <p>✅ You can now <strong>accept new assignments</strong></p>
            <p>✅ Labs can <strong>assign you to sample collections</strong></p>
            <p>✅ Your profile is <strong>active in the system</strong></p>
            <p>✅ All features are fully operational</p>
          </div>
          
          <p>You can now start receiving and managing sample collection assignments through your dashboard.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/phlebotomist" class="button">Go to Dashboard</a>
          </div>
          
          <p>Thank you for being part of Lab2Home!</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// ============================================
// PHLEBOTOMIST DEACTIVATION EMAIL
// ============================================
export const sendPhlebotomistDeactivationEmail = async (
  email: string,
  fullName: string
): Promise<void> => {
  const subject = `Account Temporarily Deactivated`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Account Deactivated</h1>
          <p>Temporary Status Change</p>
        </div>
        <div class="content">
          <h2>Hello ${fullName},</h2>
          
          <div class="warning-box">
            <strong>Notice:</strong> Your account has been temporarily deactivated by our admin team.
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #f59e0b;">What This Means:</h3>
            <p>❌ You <strong>cannot accept new assignments</strong></p>
            <p>❌ Labs <strong>cannot assign you to new collections</strong></p>
            <p>✅ You can still <strong>access your dashboard</strong></p>
            <p>✅ You can still <strong>view existing assignments</strong></p>
            <p>✅ You can still <strong>complete ongoing work</strong></p>
          </div>
          
          <p><strong>What You Should Do:</strong></p>
          <ul>
            <li>Contact our admin team to understand the reason</li>
            <li>Address any outstanding issues</li>
            <li>Continue managing your existing assignments</li>
            <li>Wait for reactivation notification</li>
          </ul>
          
          <p>If you have questions or concerns about this deactivation, please contact our support team at <a href="mailto:support@lab2home.com">support@lab2home.com</a>.</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// ============================================
// ADMIN NOTIFICATION - New Phlebotomist Registration
// ============================================
export const sendAdminPhlebotomistNotification = async (
  adminEmail: string,
  phlebotomistName: string,
  phlebotomistEmail: string,
  phlebotomistPhone: string,
  qualification: string
): Promise<void> => {
  const subject = `🩺 New Phlebotomist Registration - ${phlebotomistName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-grid { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: bold; width: 150px; color: #667eea; }
        .info-value { flex: 1; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🩺 New Phlebotomist Registration</h1>
          <p>Action Required</p>
        </div>
        <div class="content">
          <div class="alert-box">
            <strong>⚠️ Pending Approval</strong><br>
            A new phlebotomist has registered and requires your approval to start accepting assignments.
          </div>
          
          <h2>Phlebotomist Details:</h2>
          <div class="info-grid">
            <div class="info-row">
              <div class="info-label">Full Name:</div>
              <div class="info-value">${phlebotomistName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Email:</div>
              <div class="info-value">${phlebotomistEmail}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Phone:</div>
              <div class="info-value">${phlebotomistPhone}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Qualification:</div>
              <div class="info-value">${qualification}</div>
            </div>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Login to your admin dashboard</li>
            <li>Navigate to "Manage Phlebotomists"</li>
            <li>Review the phlebotomist's traffic license and details</li>
            <li>Approve or reject the registration</li>
          </ol>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/admin/phlebotomists" class="button">Review Registration</a>
          </div>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            <strong>Note:</strong> The phlebotomist will not be able to accept assignments until you approve their registration.
          </p>
          
          <div class="footer">
            <p>© 2025 Lab2Home Admin Portal</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: adminEmail, subject, html });
};

// ============================================
// PATIENT ACTIVATION EMAIL
// ============================================
export const sendPatientActivationEmail = async (
  email: string,
  fullName: string
): Promise<void> => {
  const subject = `✅ Your Account Has Been Activated`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Account Activated!</h1>
          <p>Welcome Back</p>
        </div>
        <div class="content">
          <h2>Hello ${fullName}! 👋</h2>
          
          <div class="success-box">
            <strong>Good News!</strong> Your account has been activated by our admin team.
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #10b981;">You Can Now:</h3>
            <p>✅ <strong>Book Lab Tests</strong> - Schedule tests at your convenience</p>
            <p>✅ <strong>View Reports</strong> - Access your test results online</p>
            <p>✅ <strong>Track Bookings</strong> - Monitor your test status in real-time</p>
            <p>✅ <strong>Manage Profile</strong> - Update your information anytime</p>
          </div>
          
          <p>Your account is now fully operational and you have access to all Lab2Home services.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/patient" class="button">Go to Dashboard</a>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// ============================================
// PATIENT DEACTIVATION EMAIL
// ============================================
export const sendPatientDeactivationEmail = async (
  email: string,
  fullName: string
): Promise<void> => {
  const subject = `Account Temporarily Deactivated`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Account Deactivated</h1>
          <p>Temporary Status Change</p>
        </div>
        <div class="content">
          <h2>Hello ${fullName},</h2>
          
          <div class="warning-box">
            <strong>Notice:</strong> Your account has been temporarily deactivated by our admin team.
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #f59e0b;">What This Means:</h3>
            <p>❌ You <strong>cannot book new tests</strong></p>
            <p>❌ You <strong>cannot access services</strong></p>
            <p>✅ Your <strong>existing data is safe</strong></p>
            <p>✅ You can <strong>contact support</strong> for assistance</p>
          </div>
          
          <p><strong>What You Should Do:</strong></p>
          <ul>
            <li>Contact our support team to understand the reason</li>
            <li>Address any outstanding issues if applicable</li>
            <li>Wait for account reactivation</li>
          </ul>
          
          <p>If you have questions or concerns about this deactivation, please contact our support team at <a href="mailto:support@lab2home.com">support@lab2home.com</a>.</p>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// ============================================
// ORDER CONFIRMATION EMAIL
// ============================================
export const sendOrderConfirmationEmail = async (
  email: string,
  patientName: string,
  orderNumber: string,
  items: any[],
  total: number,
  shippingAddress: string
): Promise<void> => {
  const subject = `Order Confirmed! 🛒 #${orderNumber} - Lab2Home`;

  const itemsHtml = items.map(item => `
    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
      <span style="color: #333;">${item.productName} (x${item.quantity})</span>
      <span style="font-weight: bold;">Rs.${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .total-row { display: flex; justify-content: space-between; padding: 15px 0 0 0; margin-top: 10px; border-top: 2px solid #eee; font-weight: bold; font-size: 1.1em; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .address-box { margin-top: 20px; font-size: 0.9em; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛒 Order Confirmed!</h1>
          <p>Order #${orderNumber}</p>
        </div>
        <div class="content">
          <h2>Hello ${patientName}! 👋</h2>
          
          <div class="success-box">
            <strong>Thank you for your order!</strong> We have received your order and are processing it.
          </div>
          
          <div class="order-details">
            <h3 style="margin-top: 0; color: #667eea;">Order Summary</h3>
            ${itemsHtml}
            <div class="total-row">
              <span>Total Amount</span>
              <span style="color: #667eea;">Rs.${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="address-box">
            <strong>Shipping to:</strong><br>
            ${shippingAddress}
          </div>
          
          <p style="margin-top: 30px;">You will receive another email when your order is dispatched.</p>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/orders" 
               style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">
              Track Order
            </a>
          </div>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// ============================================
// ORDER STATUS UPDATE EMAIL
// ============================================
export const sendOrderStatusUpdateEmail = async (
  email: string,
  patientName: string,
  orderNumber: string,
  status: string,
  courierService?: string,
  trackingNumber?: string
): Promise<void> => {
  const statusConfig: any = {
    confirmed: { title: 'Order Confirmed', color: '#3b82f6', message: 'Your order has been confirmed and is being prepared.' },
    dispatched: { title: 'Order Dispatched', color: '#8b5cf6', message: 'Your order is on its way!' },
    delivered: { title: 'Order Delivered', color: '#10b981', message: 'Your order has been delivered successfully.' },
    cancelled: { title: 'Order Cancelled', color: '#ef4444', message: 'Your order has been cancelled.' }
  };

  const config = statusConfig[status] || { title: 'Status Updated', color: '#667eea', message: `Order status changed to ${status}` };
  const subject = `${config.title} - Order #${orderNumber}`;

  let trackingHtml = '';
  if (status === 'dispatched' && courierService && trackingNumber) {
    trackingHtml = `
      <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <h4 style="margin: 0 0 10px 0; color: #666;">Tracking Details</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="color: #666;">Courier:</span>
          <strong>${courierService}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #666;">Tracking Number:</span>
          <strong style="color: #667eea; letter-spacing: 1px;">${trackingNumber}</strong>
        </div>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${config.color} 0%, #1f2937 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-badge { display: inline-block; padding: 8px 16px; background: ${config.color}; color: white; border-radius: 20px; font-weight: bold; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${config.title}</h1>
          <p>Order #${orderNumber}</p>
        </div>
        <div class="content">
          <h2>Hello ${patientName}! 👋</h2>
          
          <p>${config.message}</p>
          
          <div style="text-align: center;">
            <span class="status-badge">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
          
          ${trackingHtml}
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/orders" 
               style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">
              View Order Details
            </a>
          </div>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// ============================================
// ADMIN - NEW ORDER RECEIVED EMAIL
// ============================================
export const sendAdminNewOrderEmail = async (
  email: string,
  adminName: string,
  orderNumber: string,
  patientName: string,
  total: number,
  itemsCount: number
): Promise<void> => {
  const subject = `🔔 New Order Received! #${orderNumber}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert-box { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .info-label { font-weight: bold; color: #666; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 New Order Alert</h1>
          <p>Order #${orderNumber}</p>
        </div>
        <div class="content">
          <h2>Hello ${adminName || 'Admin'}! 👋</h2>
          
          <div class="alert-box">
            <strong>Action Required:</strong> A new order has been placed by a patient.
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #0284c7;">Order Overview</h3>
            <div class="info-row">
              <span class="info-label">Patient:</span>
              <span>${patientName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Items:</span>
              <span>${itemsCount} Items</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="info-label">Total Amount:</span>
              <span style="font-weight: bold; color: #0284c7;">Rs.${total.toFixed(2)}</span>
            </div>
          </div>
          
          <p>Please login to the admin dashboard to review and process this order.</p>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/marketplace" 
               style="display: inline-block; padding: 12px 30px; background: #0f172a; color: white; text-decoration: none; border-radius: 5px;">
              Manage Orders
            </a>
          </div>
          
          <div class="footer">
            <p>© 2025 Lab2Home. All rights reserved.</p>
            <p>Admin Notification System</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};
