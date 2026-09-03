import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

let transporter = null;

/**
 * Initialize or get Nodemailer Transporter
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort) || 587,
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  } else {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM in Backend/.env to send real emails.");
  }

  return transporter;
};

/**
 * Send Password Reset Email to Student
 * 
 * @param {string} toEmail - Student recipient email
 * @param {string} resetUrl - Password reset URL containing token
 * @param {string} studentName - Student's name
 */
export const sendPasswordResetEmail = async (toEmail, resetUrl, studentName = "Student") => {
  const fromAddress = process.env.SMTP_FROM || '"EduNovaAI Support" <support@edunova.ai>';

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: "Reset your EduNovaAI password",
    text: `Hello ${studentName},\n\nYou requested a password reset for your EduNovaAI account.\n\nPlease click the link below to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour.\nIf you did not request this reset, you can safely ignore this email.\n\nBest regards,\nThe EduNovaAI Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #1E293B; margin: 0; padding: 20px; }
          .card { max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 800; color: #2563EB; letter-spacing: -0.5px; }
          .title { font-size: 20px; font-weight: 700; color: #0F172A; margin: 16px 0 8px; }
          .btn { display: inline-block; background-color: #2563EB; color: #FFFFFF !important; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; margin: 20px 0; }
          .footer { font-size: 12px; color: #64748B; margin-top: 24px; border-top: 1px solid #F1F5F9; padding-top: 16px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">EduNovaAI</div>
            <div class="title">Reset Your Password</div>
          </div>
          <p>Hello ${studentName},</p>
          <p>We received a request to reset the password for your EduNovaAI student account. Click the button below to choose a new password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          </div>
          <p style="font-size: 13px; color: #64748B; word-break: break-all;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #2563EB;">${resetUrl}</a>
          </p>
          <p style="font-size: 13px; color: #64748B;">This link is valid for 1 hour. If you didn't request this reset, you can safely ignore this email.</p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} EduNovaAI. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const mailer = await getTransporter();
    const info = await mailer.sendMail(mailOptions);
    
    if (nodemailer.getTestMessageUrl(info)) {
      console.log("📨 [Password Reset Email Preview URL]:", nodemailer.getTestMessageUrl(info));
    } else {
      console.log("📨 [Password Reset Email Sent]:", info.messageId || "Delivered");
    }

    return { success: true, messageId: info.messageId || "Delivered", previewUrl: nodemailer.getTestMessageUrl(info) || resetUrl };
  } catch (sendError) {
    console.error("⚠️ Password reset email delivery failed:", sendError.message);
    throw new Error("Password reset email could not be sent. Please verify the SMTP settings.");
  }
};


export const sendVerificationCodeEmail = async (toEmail, code, studentName = "Student") => {
  const fromAddress = process.env.SMTP_FROM || '"EduNovaAI" <support@edunova.ai>';
  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: "Your EduNovaAI verification code",
    text: `Hello ${studentName},\n\nYour EduNovaAI verification code is ${code}. It expires in 10 minutes.\n\nIf you did not create this account, you can ignore this email.\n\nThe EduNovaAI Team`,
    html: `<!DOCTYPE html><html><body style="margin:0;background:#f8fbff;font-family:Arial,sans-serif;color:#0f172a;padding:28px"><div style="max-width:520px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:32px"><div style="font-size:22px;font-weight:800;color:#4f46e5">EduNovaAI</div><h2>Verify your email</h2><p>Hello ${studentName},</p><p>Use this code to verify your EduNovaAI account:</p><div style="font-size:34px;font-weight:800;letter-spacing:10px;text-align:center;padding:18px;background:#f5f7ff;border-radius:14px;color:#4f46e5">${code}</div><p style="color:#64748b;font-size:13px">This code expires in 10 minutes.</p></div></body></html>`
  };
  const mailer = await getTransporter();
  const info = await mailer.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  console.log("📨 [Verification Email]", info.messageId || "Delivered", previewUrl || "");
  return { success: true, messageId: info.messageId || "Delivered", previewUrl };
};

export default {
  sendPasswordResetEmail,
  sendVerificationCodeEmail
};
