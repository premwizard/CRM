import nodemailer from "nodemailer";

export interface EmailAttachment {
  filename: string;
  content?: Buffer;
  path?: string;
  contentType?: string;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  status: "SENT" | "FAILED";
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<SendEmailResult>;
}

/**
 * Development / Mock Email Provider for testing & safe dev mode
 */
export class DevEmailProvider implements EmailProvider {
  async send(options: EmailOptions): Promise<SendEmailResult> {
    const recipients = Array.isArray(options.to) ? options.to.join(", ") : options.to;
    console.log(`[DevEmailProvider] Simulated Email Sent to: ${recipients} | Subject: "${options.subject}"`);
    
    // Simulate minor network latency
    await new Promise((resolve) => setTimeout(resolve, 50));

    const uniqueId = Math.random().toString(36).substring(2, 12);
    return {
      success: true,
      status: "SENT",
      messageId: `dev_msg_${uniqueId}`,
    };
  }
}

/**
 * Production / Staging SMTP Email Provider using Nodemailer
 */
export class SmtpEmailProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.EMAIL_SMTP_HOST || "localhost";
    const port = parseInt(process.env.EMAIL_SMTP_PORT || "587", 10);
    const user = process.env.EMAIL_SMTP_USER || "";
    const pass = process.env.EMAIL_SMTP_PASS || "";

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    });
  }

  async send(options: EmailOptions): Promise<SendEmailResult> {
    try {
      const from = process.env.EMAIL_FROM || "noreply@iccrm.io";
      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        text: options.isHtml ? undefined : options.body,
        html: options.isHtml ? options.body : undefined,
        attachments: options.attachments,
      });

      return {
        success: true,
        status: "SENT",
        messageId: info.messageId,
      };
    } catch (err) {
      return {
        success: false,
        status: "FAILED",
        error: err instanceof Error ? err.message : "SMTP dispatch failed",
      };
    }
  }
}

/**
 * Email Service Facade
 */
export class EmailService {
  private provider: EmailProvider;

  constructor() {
    const providerType = (process.env.EMAIL_PROVIDER || "dev").toLowerCase();

    if (providerType === "smtp") {
      this.provider = new SmtpEmailProvider();
    } else {
      this.provider = new DevEmailProvider();
    }
  }

  public validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  }

  public async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    // 1. Recipient Email Validation
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
    for (const addr of toAddresses) {
      if (!this.validateEmail(addr)) {
        return {
          success: false,
          status: "FAILED",
          error: `Invalid recipient email address: "${addr}"`,
        };
      }
    }

    if (!options.subject || !options.subject.trim()) {
      return {
        success: false,
        status: "FAILED",
        error: "Email subject is required",
      };
    }

    if (!options.body || !options.body.trim()) {
      return {
        success: false,
        status: "FAILED",
        error: "Email message body is required",
      };
    }

    // 2. Dispatch via active provider
    return this.provider.send(options);
  }
}

export const emailService = new EmailService();
