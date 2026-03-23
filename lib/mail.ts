import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
};

type MailLogStatus = "sent" | "failed";
let canWriteMailLogs = true;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.turkticaret.net",
  port: Number.parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.SMTP_PORT === "465" || !process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function truncateText(value: string | undefined, max = 2000): string | null {
  if (!value) return null;
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function getErrorDetails(error: unknown): { message: string; code: string | null; response: string | null } {
  if (error instanceof Error) {
    const errorWithMeta = error as Error & {
      code?: string | number;
      response?: string;
    };
    return {
      message: error.message,
      code: errorWithMeta.code != null ? String(errorWithMeta.code) : null,
      response: truncateText(errorWithMeta.response),
    };
  }

  return {
    message: String(error),
    code: null,
    response: null,
  };
}

async function recordMailDeliveryLog(input: {
  toEmail: string;
  subject: string;
  status: MailLogStatus;
  fromEmail?: string | null;
  providerMessageId?: string | null;
  providerResponse?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  sentAt?: Date | null;
}) {
  if (!canWriteMailLogs) {
    return;
  }

  try {
    await prisma.emailDeliveryLog.create({
      data: {
        toEmail: input.toEmail,
        fromEmail: input.fromEmail ?? null,
        subject: input.subject,
        status: input.status,
        provider: "smtp",
        providerMessageId: input.providerMessageId ?? null,
        providerResponse: truncateText(input.providerResponse ?? undefined, 4000),
        errorMessage: truncateText(input.errorMessage ?? undefined),
        errorCode: input.errorCode ?? null,
        sentAt: input.sentAt ?? null,
      },
    });
  } catch (logError) {
    const logErrorCode =
      typeof logError === "object" &&
      logError &&
      "code" in logError &&
      typeof (logError as { code?: unknown }).code === "string"
        ? (logError as { code: string }).code
        : null;

    // Prisma P2021 = table does not exist. Disable further writes to avoid log spam until migration is applied.
    if (logErrorCode === "P2021") {
      canWriteMailLogs = false;
      console.warn("Email delivery logging is disabled because EmailDeliveryLog table does not exist.");
      return;
    }

    console.error("Error writing email delivery log:", logError);
  }
}

export async function sendMail({ to, subject, html }: SendMailInput) {
  const fromEmail = process.env.SMTP_USER ?? null;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const err = new Error("SMTP_USER or SMTP_PASS not set");
    await recordMailDeliveryLog({
      toEmail: to,
      fromEmail,
      subject,
      status: "failed",
      errorMessage: err.message,
      errorCode: "SMTP_CONFIG_MISSING",
    });
    console.error("Error sending email:", err.message);
    throw err;
  }

  try {
    const info = await transporter.sendMail({
      from: `"The Lost Label" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    await recordMailDeliveryLog({
      toEmail: to,
      fromEmail,
      subject,
      status: "sent",
      providerMessageId: info.messageId ?? null,
      providerResponse: typeof info.response === "string" ? info.response : null,
      sentAt: new Date(),
    });
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    const { message, code, response } = getErrorDetails(error);
    await recordMailDeliveryLog({
      toEmail: to,
      fromEmail,
      subject,
      status: "failed",
      errorMessage: message,
      errorCode: code,
      providerResponse: response,
    });
    console.error("Error sending email:", error);
    throw error;
  }
}
