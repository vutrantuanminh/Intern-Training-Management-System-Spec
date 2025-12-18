import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { env } from '../config/env.js';
import { sendMessage, KAFKA_TOPICS } from '../config/kafka.js';

// Email templates
interface EmailData {
    to: string;
    subject: string;
    html: string;
}

// Create SMTP transporter for development
const smtpTransporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: false,
    auth: env.smtpUser ? {
        user: env.smtpUser,
        pass: env.smtpPass,
    } : undefined,
});

// Create SES client for production
const sesClient = new SESClient({
    region: env.awsRegion,
    credentials: {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
    },
});

// Send email directly
const sendEmailDirect = async (data: EmailData): Promise<void> => {
    if (env.isProd) {
        // Use AWS SES in production
        const command = new SendEmailCommand({
            Source: env.awsSesFromEmail,
            Destination: {
                ToAddresses: [data.to],
            },
            Message: {
                Subject: { Data: data.subject },
                Body: { Html: { Data: data.html } },
            },
        });
        await sesClient.send(command);
    } else {
        // Use SMTP in development
        await smtpTransporter.sendMail({
            from: env.smtpFrom,
            to: data.to,
            subject: data.subject,
            html: data.html,
        });
    }
    console.log(`📧 Email sent to ${data.to}: ${data.subject}`);
};

// Queue email for async sending via Kafka
export const queueEmail = async (data: EmailData): Promise<void> => {
    try {
        await sendMessage(KAFKA_TOPICS.EMAIL_QUEUE, {
            type: 'email',
            data,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        // Fallback to direct send if Kafka fails
        console.warn('Kafka unavailable, sending email directly');
        await sendEmailDirect(data);
    }
};

// Direct email send (for workers)
export const sendEmail = sendEmailDirect;

// Email templates
export const emailTemplates = {
    verifyEmail: (name: string, verifyUrl: string): EmailData => ({
        to: '',
        subject: 'Verify Your Email - Training Management System',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Training Management System</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${verifyUrl}" class="button">Verify Email</a>
            </p>
            <p>Or copy this link: <a href="${verifyUrl}">${verifyUrl}</a></p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Training Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    }),

    resetPassword: (name: string, resetUrl: string): EmailData => ({
        to: '',
        subject: 'Reset Your Password - Training Management System',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>We received a request to reset your password. Click the button below to choose a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link will expire in 1 hour.</p>
            <p><strong>If you didn't request this, please ignore this email.</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Training Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    }),

    courseEnrollment: (name: string, courseName: string, courseUrl: string): EmailData => ({
        to: '',
        subject: `You've been enrolled in ${courseName} - Training Management System`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Course Enrollment</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>You have been enrolled in a new course:</p>
            <h3 style="color: #11998e;">${courseName}</h3>
            <p style="text-align: center;">
              <a href="${courseUrl}" class="button">View Course</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Training Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    }),

    courseRemoval: (name: string, courseName: string): EmailData => ({
        to: '',
        subject: `Course Removal Notice - ${courseName}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%); color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Course Removal Notice</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>You have been removed from the following course:</p>
            <h3 style="color: #e53e3e;">${courseName}</h3>
            <p>If you have any questions, please contact your supervisor.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Training Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    }),
};
