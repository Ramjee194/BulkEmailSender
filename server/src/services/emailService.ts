import nodemailer from "nodemailer";
import { logService } from "./logService.js";
import { FileService } from "./fileService.js";
import type { EmailConfig, Contact, EmailJob } from "../types.js";

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  createTransport(config: EmailConfig) {
    // Smart fix: Port 587 should not use secure (SSL), but STARTTLS
    const isSecure = config.port === 465 ? true : config.port === 587 ? false : config.secure;
    
    console.log(`Creating transport for ${config.host}:${config.port} (secure: ${isSecure})`);

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: isSecure,
      auth: config.auth,
      // For TLS on 587
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendSingleEmail(mailOptions: any): Promise<any> {
    if (!this.transporter) {
      throw new Error("Email transporter not configured");
    }
    return await this.transporter.sendMail(mailOptions);
  }

  async sendBulkEmails(job: EmailJob): Promise<void> {
    if (!this.transporter) {
      throw new Error("Email transporter not configured");
    }

    console.log(`Starting bulk email send for ${job.contacts.length} contacts`);

    for (let i = 0; i < job.contacts.length; i++) {
      const contact = job.contacts[i];

      try {
        const personalizedContent = FileService.replacePlaceholders(
          job.htmlContent,
          contact
        );
        const personalizedSubject = FileService.replacePlaceholders(
          job.subject,
          contact
        );

        const mailOptions = {
          from: `${job.fromName} <${job.fromEmail}>`,
          to: contact.Email,
          subject: personalizedSubject,
          html: personalizedContent,
        };

        await this.transporter.sendMail(mailOptions);
        
        await logService.logEmail({
          recipient: contact.Email,
          subject: personalizedSubject,
          status: "sent",
          timestamp: new Date().toISOString(),
        });

        // Small delay to prevent rate limiting
        if (job.emailDelay && job.emailDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, job.emailDelay * 1000));
        }
      } catch (error) {
        console.error(`Failed to send email to ${contact.Email}:`, error);
        
        await logService.logEmail({
          recipient: contact.Email,
          subject: job.subject,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  async testConnection(config: EmailConfig): Promise<boolean> {
    try {
      const isSecure = config.port === 465 ? true : config.port === 587 ? false : config.secure;
      
      console.log(`Testing SMTP connection: ${config.host}:${config.port} (secure: ${isSecure})`);

      const testTransporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: isSecure,
        auth: config.auth,
        tls: {
          rejectUnauthorized: false
        }
      });

      await testTransporter.verify();
      return true;
    } catch (error) {
      console.error("SMTP connection test failed:", error);
      return false;
    }
  }

  async sendBulkWithNotifications(
    jobDetails: EmailJob,
    notificationSettings: { enabled: boolean; email: string }
  ): Promise<void> {
    const jobStats = {
      total: jobDetails.contacts.length,
      sent: 0,
      failed: 0,
    };

    try {
      this.createTransport(jobDetails.configUsed);
      
      for (let i = 0; i < jobDetails.contacts.length; i++) {
        const contact = jobDetails.contacts[i];
        
        try {
          const personalizedContent = FileService.replacePlaceholders(
            jobDetails.htmlContent,
            contact
          );
          const personalizedSubject = FileService.replacePlaceholders(
            jobDetails.subject,
            contact
          );

          await this.sendSingleEmail({
            from: `${jobDetails.fromName} <${jobDetails.fromEmail}>`,
            to: contact.Email,
            subject: personalizedSubject,
            html: personalizedContent,
          });

          jobStats.sent++;
          await logService.logEmail({
            recipient: contact.Email,
            subject: personalizedSubject,
            status: "sent",
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          jobStats.failed++;
          await logService.logEmail({
            recipient: contact.Email,
            subject: jobDetails.subject,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
          });
        }

        if (jobDetails.emailDelay) {
          await new Promise(r => setTimeout(r, jobDetails.emailDelay! * 1000));
        }
      }

      if (notificationSettings.enabled) {
        await this.sendCompletionNotification(notificationSettings.email, jobStats, jobDetails);
      }
    } catch (error) {
      console.error("Critical bulk send error:", error);
    }
  }

  private async sendCompletionNotification(
    recipient: string,
    stats: any,
    job: any
  ) {
    try {
      const { notificationService } = await import("./notificationService.js");
      await notificationService.sendJobCompletionNotification(
        recipient,
        stats,
        job,
        job.configUsed
      );
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }
}

export const emailService = new EmailService();
