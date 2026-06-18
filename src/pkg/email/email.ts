import nodemailer from 'nodemailer';

export class Mailer {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly user: string,
    private readonly pass: string,
    private readonly from: string,
    private readonly fromName: string,
  ) {
    this.transporter = nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
    });
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"${this.fromName}" <${this.from}>`,
      to,
      subject,
      html,
    });
  }

  async sendVerification(to: string, name: string, verifyUrl: string): Promise<void> {
    const html = `
      <h2>Hi ${name},</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't register, ignore this email.</p>
    `;
    await this.send(to, 'Verify Your Email', html);
  }

  async sendPasswordReset(to: string, name: string, resetUrl: string, expireMinutes: number): Promise<void> {
    const html = `
      <h2>Hi ${name},</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in ${expireMinutes} minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    `;
    await this.send(to, 'Reset Your Password', html);
  }
}
