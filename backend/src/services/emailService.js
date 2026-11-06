const nodemailer = require('nodemailer');
const env = require('../config/env');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        }
      });
    }
  }

  async sendMail({ to, subject, html, text }) {
    // In development and test environments, always print email content to console
    if (env.NODE_ENV !== 'production') {
      console.log('--------------------------------------------------');
      console.log(`[EMAIL DISPATCH] To: ${to}`);
      console.log(`[EMAIL DISPATCH] Subject: ${subject}`);
      console.log(`[EMAIL DISPATCH] Body:\n${text || html}`);
      console.log('--------------------------------------------------');
    }

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: env.EMAIL_FROM,
          to,
          subject,
          text,
          html
        });
      } catch (err) {
        console.warn(`[EmailService] Failed to send via SMTP transport: ${err.message}`);
      }
    }
  }

  async sendVerificationEmail(email, token) {
    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
    const subject = 'Verify your ChiefNet Account';
    const text = `Welcome to ChiefNet! Please verify your email by clicking the link below (valid for 24 hours):\n${verifyUrl}\n\nIf you did not create this account, please ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Welcome to ChiefNet</h2>
        <p>Please verify your email address to activate all platform features like subscriptions and meal reservations.</p>
        <p><a href="${verifyUrl}" style="display:inline-block; padding: 10px 20px; background-color: #f97316; color: #fff; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
        <p>Or paste this link into your browser:</p>
        <p><code>${verifyUrl}</code></p>
        <p>This link expires in 24 hours.</p>
      </div>
    `;
    await this.sendMail({ to: email, subject, text, html });
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
    const subject = 'ChiefNet Password Reset Request';
    const text = `You requested a password reset. Please use the link below to set a new password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>ChiefNet Password Reset</h2>
        <p>You requested a password reset for your account. Click the button below to proceed:</p>
        <p><a href="${resetUrl}" style="display:inline-block; padding: 10px 20px; background-color: #f97316; color: #fff; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
        <p>Or paste this link into your browser:</p>
        <p><code>${resetUrl}</code></p>
        <p>This link is valid for 1 hour and single-use only.</p>
      </div>
    `;
    await this.sendMail({ to: email, subject, text, html });
  }

  async sendSubscriptionExpiryReminder(email, daysLeft = 2) {
    const subject = `Your ChiefNet Subscription is Expiring in ${daysLeft} days`;
    const text = `Your meal subscription will expire in ${daysLeft} days. Please coordinate with your home chef if you wish to renew your meal plan.`;
    await this.sendMail({ to: email, subject, text, html: `<p>${text}</p>` });
  }
}

const emailService = new EmailService();

module.exports = emailService;
