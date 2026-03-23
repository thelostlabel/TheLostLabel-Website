import { config } from "dotenv";

import prisma from "../lib/prisma";
import { sendMail } from "../lib/mail";
import { generateVerificationEmail } from "../lib/mail-templates";
import { generateOpaqueToken, hashOpaqueToken, normalizeEmail } from "../lib/security";

config({ path: ".env" });

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_DELAY_MS = 250;

type ResultRow = {
  email: string;
  status: "sent" | "failed" | "skipped";
  reason?: string;
};

async function main() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const users = await prisma.user.findMany({
    where: {
      emailVerified: null,
      status: { in: ["pending", "approved"] },
      NOT: {
        email: {
          endsWith: "@system.local",
          mode: "insensitive",
        },
      },
    },
    select: {
      id: true,
      email: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`Targets: ${users.length}`);

  const results: ResultRow[] = [];

  for (const user of users) {
    const email = normalizeEmail(user.email);

    if (!EMAIL_PATTERN.test(email)) {
      results.push({ email, status: "skipped", reason: "invalid_email_format" });
      console.log(`[skipped] ${email} (invalid_email_format)`);
      continue;
    }

    try {
      const verificationToken = generateOpaqueToken();
      const verificationTokenExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: hashOpaqueToken(verificationToken),
          verificationTokenExpiry,
        },
      });

      const verificationLink = `${baseUrl}/auth/verify-email?token=${verificationToken}`;

      await sendMail({
        to: email,
        subject: "Confirm your collective identity | LOST.",
        html: generateVerificationEmail(verificationLink),
      });

      results.push({ email, status: "sent" });
      console.log(`[sent] ${email}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      results.push({ email, status: "failed", reason });
      console.log(`[failed] ${email} (${reason})`);
    }

    await new Promise((resolve) => setTimeout(resolve, RESEND_DELAY_MS));
  }

  const sent = results.filter((row) => row.status === "sent").length;
  const failed = results.filter((row) => row.status === "failed").length;
  const skipped = results.filter((row) => row.status === "skipped").length;

  console.log("");
  console.log(`Summary: sent=${sent} failed=${failed} skipped=${skipped} total=${results.length}`);

  if (failed > 0) {
    console.log("Failed emails:");
    for (const row of results.filter((item) => item.status === "failed")) {
      console.log(`- ${row.email} :: ${row.reason}`);
    }
  }
}

main()
  .catch((error) => {
    console.error("Bulk resend script failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
