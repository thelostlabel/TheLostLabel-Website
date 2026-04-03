import nodemailer from "nodemailer";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.turkticaret.net",
  port: Number.parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.SMTP_PORT === "465" || !process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({ to, subject, html }: SendMailInput) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const err = new Error("SMTP_USER or SMTP_PASS not set");
    console.error("Error sending email:", err.message);
    throw err;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.NEXT_PUBLIC_SITE_FULL_NAME || 'The Lost Label'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
