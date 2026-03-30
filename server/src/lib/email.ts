/**
 * Email service using Nodemailer
 * Supports multiple email providers and templates
 */

import nodemailer from "nodemailer";
import { env } from "../config/env";

/** Escape HTML special characters to prevent XSS in email templates (I-9). */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Validate that a URL uses http(s):// to prevent javascript: injection in hrefs. */
function safeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : "#";
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

interface PasswordResetEmailData {
  name: string;
  resetUrl: string;
  expiresIn: string;
}

interface WelcomeEmailData {
  name: string;
  verifyUrl?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  private initialize() {
    // Skip if email not configured
    if (!env.SMTP_HOST || !env.SMTP_PORT) {
      console.log("⚠️  Email service not configured");
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE, // true for 465, false for other ports
        auth: env.SMTP_USER && env.SMTP_PASSWORD ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        } : undefined,
      });

      console.log("✅ Email service initialized");
    } catch (error) {
      console.error("❌ Email service initialization failed:", error);
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn("Email service not configured, skipping email send");
      // In development, log the email instead
      if (env.NODE_ENV === "development") {
        console.log("📧 [DEV] Email would be sent:", {
          to: options.to,
          subject: options.subject,
          text: options.text,
        });
      }
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: options.from || env.SMTP_FROM || "noreply@example.com",
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log("✅ Email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("❌ Email send failed:", error);
      return false;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    to: string,
    data: WelcomeEmailData
  ): Promise<boolean> {
    const subject = "Welcome to Our App! 🎉";

    const text = `
Hi ${data.name}!

Welcome to our app! We're excited to have you on board.

${
  data.verifyUrl
    ? `Please verify your email address by clicking the link below:
${data.verifyUrl}

This link will expire in 24 hours.`
    : ""
}

Best regards,
The Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Our App! 🎉</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${escapeHtml(data.name)}</strong>!</p>
      <p>Welcome to our app! We're excited to have you on board.</p>
      ${
        data.verifyUrl
          ? `
      <p>Please verify your email address by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="${safeUrl(data.verifyUrl)}" class="button">Verify Email</a>
      </div>
      <p style="font-size: 14px; color: #666;">This link will expire in 24 hours.</p>
      <p style="font-size: 12px; color: #999;">If you didn't create an account, please ignore this email.</p>
      `
          : ""
      }
      <p>Best regards,<br>The Team</p>
    </div>
    <div class="footer">
      <p>This email was sent from an automated system. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({ to, subject, text, html });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    data: PasswordResetEmailData
  ): Promise<boolean> {
    const subject = "Reset Your Password 🔒";

    const text = `
Hi ${data.name},

We received a request to reset your password. Click the link below to create a new password:

${data.resetUrl}

This link will expire in ${data.expiresIn}.

If you didn't request a password reset, please ignore this email or contact support if you have concerns.

Best regards,
The Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; border-radius: 4px; }
    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${escapeHtml(data.name)}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <div style="text-align: center;">
        <a href="${safeUrl(data.resetUrl)}" class="button">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #666;">This link will expire in <strong>${escapeHtml(data.expiresIn)}</strong>.</p>
      <div class="warning">
        <p style="margin: 0; font-size: 14px;">
          <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </p>
      </div>
      <p>Best regards,<br>The Team</p>
    </div>
    <div class="footer">
      <p>This email was sent from an automated system. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({ to, subject, text, html });
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(
    to: string,
    data: { name: string; verificationUrl: string }
  ): Promise<boolean> {
    const subject = "Verify Your Email Address ✉️";

    const text = `
Hi ${data.name},

Please verify your email address by clicking the link below:

${data.verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✉️ Verify Your Email</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${escapeHtml(data.name)}</strong>,</p>
      <p>Please verify your email address by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="${safeUrl(data.verificationUrl)}" class="button">Verify Email</a>
      </div>
      <p style="font-size: 14px; color: #666;">This link will expire in <strong>24 hours</strong>.</p>
      <p style="font-size: 12px; color: #999;">If you didn't create an account, please ignore this email.</p>
      <p>Best regards,<br>The Team</p>
    </div>
    <div class="footer">
      <p>This email was sent from an automated system. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({ to, subject, text, html });
  }

  /**
   * Verify transporter connection
   */
  async verify(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log("✅ Email transporter verified");
      return true;
    } catch (error) {
      console.error("❌ Email transporter verification failed:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
