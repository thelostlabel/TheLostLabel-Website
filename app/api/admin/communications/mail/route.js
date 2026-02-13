import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generateBroadcastEmail } from "@/lib/mail-templates";

export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { subject, html, recipientIds, sendToAll, includeSender = true } = await req.json();

        if (!subject || !html) {
            return new Response(JSON.stringify({ error: "Missing subject or message content" }), { status: 400 });
        }

        let recipients = [];
        let userRecipients = [];

        if (sendToAll) {
            recipients = await prisma.artist.findMany({
                include: { user: { select: { email: true } } }
            });
        } else if (recipientIds && Array.isArray(recipientIds)) {
            recipients = await prisma.artist.findMany({
                where: { id: { in: recipientIds } },
                include: { user: { select: { email: true } } }
            });

            // Also allow selecting raw user IDs
            userRecipients = await prisma.user.findMany({
                where: { id: { in: recipientIds } },
                select: { email: true, stageName: true, fullName: true }
            });
        }

        // Filter and normalize recipients
        const targetList = recipients
            .map((a) => ({
                email: a.email || a.user?.email,
                name: a.name || a.user?.stageName || a.user?.fullName || "Artist"
            }))
            .filter((r) => !!r.email);

        for (const u of userRecipients) {
            if (u.email) {
                targetList.push({
                    email: u.email,
                    name: u.stageName || u.fullName || "Artist"
                });
            }
        }

        // Optionally include sender in distribution copy
        if (includeSender && session.user.email) {
            targetList.push({
                email: session.user.email,
                name: session.user.stageName || session.user.name || "Admin"
            });
        }

        // Deduplicate by email
        const uniqueTargets = Array.from(
            new Map(targetList.map((t) => [t.email.toLowerCase(), t])).values()
        );

        if (uniqueTargets.length === 0) {
            return new Response(JSON.stringify({ error: "No valid recipients with emails found" }), { status: 404 });
        }

        let successCount = 0;
        let failureCount = 0;

        // Send emails sequentially or in batches
        for (const recipient of uniqueTargets) {
            try {
                const personalized = html.replace(/\{\{\s*name\s*\}\}/gi, recipient.name || "Artist");
                await sendMail({
                    to: recipient.email,
                    subject: subject,
                    html: generateBroadcastEmail(recipient.name || "Artist", subject, personalized.replace(/\n/g, '<br>'))
                });
                successCount++;
            } catch (error) {
                console.error(`Failed to send email to ${recipient.email}:`, error);
                failureCount++;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            totalSent: uniqueTargets.length,
            successCount,
            failureCount
        }), { status: 200 });

    } catch (error) {
        console.error("[API Communiciations] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
