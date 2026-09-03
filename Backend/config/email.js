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
  },

  // Prevent signup from hanging indefinitely
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
});
  } else {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM in Backend/.env to send real emails.");
  }

  return transporter;
};

/**
 * Format FROM address cleanly with display name and configured email
 */
const getFromAddress = () => {
  const configuredFrom = (process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();
  if (!configuredFrom) {
    return '"EduNovaAI" <support@edunova.ai>';
  }
  if (configuredFrom.includes("<") && configuredFrom.includes(">")) {
    return configuredFrom;
  }
  return `"EduNovaAI" <${configuredFrom}>`;
};

/**
 * Check if recipient email belongs to a dummy or test domain
 */
const isDummyEmail = (email) => {
  if (!email || typeof email !== "string") return true;
  const domain = email.split("@")[1]?.toLowerCase() || "";
  return (
    domain === "example.com" ||
    domain === "example.org" ||
    domain === "example.net" ||
    domain === "test.com" ||
    domain === "edunova.ai"
  );
};

/**
 * Send Password Reset Email to Student
 * 
 * @param {string} toEmail - Student recipient email
 * @param {string} resetUrl - Password reset URL containing token
 * @param {string} studentName - Student's name
 */
export const sendPasswordResetEmail = async (toEmail, resetUrl, studentName = "Student") => {
  const fromAddress = getFromAddress();
  const replyToAddress = process.env.SMTP_USER || fromAddress;

  console.log(`📨 [Password Reset Request] Recipient: ${toEmail}`);
  console.log(`📤 [Sending Email] FROM: ${fromAddress} | TO: ${toEmail}`);

  if (process.env.NODE_ENV === "test" || isDummyEmail(toEmail)) {
    console.log(`🧪 [Test / Dummy Recipient] Skipped live SMTP delivery for: ${toEmail}`);
    return { success: true, messageId: `<mock-reset-${Date.now()}@edunova.local>`, previewUrl: resetUrl };
  }

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    replyTo: replyToAddress,
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
    
    console.log(`✅ [Password Reset Sent] Message ID: ${info.messageId || "Delivered"}`);
    console.log(`📬 [SMTP Response]: ${info.response || "250 OK"}`);
    console.log(`📥 [Accepted Recipients]: ${JSON.stringify(info.accepted || [])}`);
    if (info.rejected && info.rejected.length > 0) {
      console.warn(`⚠️ [Rejected Recipients]: ${JSON.stringify(info.rejected)}`);
    }

    return { success: true, messageId: info.messageId || "Delivered", previewUrl: nodemailer.getTestMessageUrl(info) || resetUrl };
  } catch (sendError) {
    console.error(`❌ [Password Reset Failed] Recipient: ${toEmail} | Code: ${sendError.code || "UNKNOWN"} | Error: ${sendError.message}`);
    throw new Error("Password reset email could not be sent. Please verify the SMTP settings.");
  }
};

export const verifyEmailTransport = async () => {
  try {
    const mailer = await getTransporter();
    await mailer.verify();

    console.log("✅ SMTP connection verified successfully.");
    return true;
  } catch (error) {
    console.error(`❌ SMTP connection failed: ${error.message} (Code: ${error.code || "UNKNOWN"})`);
    return false;
  }
};

export default {
  sendPasswordResetEmail,
  verifyEmailTransport
};

