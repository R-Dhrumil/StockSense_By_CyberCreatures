import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

const emailUser = env.EMAIL_USER || env.SMTP_USER;
const emailPass = env.EMAIL_PASS || env.SMTP_PASS;

if (emailUser && emailPass) {
  if (env.EMAIL_SERVICE) {
    // Built-in service mode (e.g. 'gmail', 'google', 'SendGrid')
    transporter = nodemailer.createTransport({
      service: env.EMAIL_SERVICE,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  } else if (env.SMTP_HOST) {
    // Custom SMTP server mode
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT) || 587,
      secure: env.SMTP_SECURE === 'true',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }
}

/**
 * Send email utility for hackathon notifications & alerts
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.html] - HTML content
 * @param {string} [options.text] - Plain text content fallback
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  // For Gmail or if FROM_EMAIL is omitted, guarantee sender matches the authenticated emailUser
  const resolvedFromEmail = (env.EMAIL_SERVICE === 'gmail' && emailUser)
    ? emailUser
    : (env.FROM_EMAIL || emailUser || 'noreply@hackathon.com');
  const resolvedFromName = env.FROM_NAME || 'Team CyberCreatures';

  const mailOptions = {
    from: `"${resolvedFromName}" <${resolvedFromEmail}>`,
    to,
    subject,
    text: text || html?.replace(/<[^>]*>?/gm, '') || '',
    html,
  };

  if (!transporter) {
    console.log('📧 [Email Service Log] Email credentials (EMAIL_USER / EMAIL_PASS) not configured in .env. Mock email logged:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${text || html}\n`);
    return { mock: true, success: true };
  }

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email successfully sent to ${to} [ID: ${info.messageId}]`);
  return info;
};
