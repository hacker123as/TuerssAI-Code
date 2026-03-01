import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.zoho.eu";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_SECURE = process.env.SMTP_SECURE !== "false";
const SMTP_USER = process.env.SMTP_USER || "no.reply@tuerss.com";
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "TuerSS <no.reply@tuerss.com>";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

export type SendMailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(options: SendMailOptions): Promise<{ ok: boolean; error?: string }> {
  const transport = getTransporter();
  if (!transport) {
    return { ok: false, error: "SMTP not configured (set SMTP_PASS in environment)" };
  }
  try {
    await transport.sendMail({
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html ?? options.text.replace(/\n/g, "<br>"),
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Send email error:", e);
    return { ok: false, error: message };
  }
}

/** Send verification code email (e.g. for login or signup). */
export async function sendVerificationCode(to: string, code: string): Promise<{ ok: boolean; error?: string }> {
  return sendEmail({
    to,
    subject: "Your TuerSS verification code",
    text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes. If you didn't request this, you can ignore this email.\n\n— TuerSS`,
  });
}
