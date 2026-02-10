import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { subject, html, recipientIds, sendToAll } = await req.json();

        if (!subject || !html) {
            return new Response(JSON.stringify({ error: "Missing subject or message content" }), { status: 400 });
        }

        let recipients = [];

        if (sendToAll) {
            recipients = await prisma.artist.findMany({
                include: { user: { select: { email: true } } }
            });
        } else if (recipientIds && Array.isArray(recipientIds)) {
            recipients = await prisma.artist.findMany({
                where: { id: { in: recipientIds } },
                include: { user: { select: { email: true } } }
            });
        }

        // Filter and normalize recipients
        const targetList = recipients.map(a => ({
            email: a.email || a.user?.email,
            name: a.name
        })).filter(r => r.email);

        if (targetList.length === 0) {
            return new Response(JSON.stringify({ error: "No valid recipients with emails found" }), { status: 404 });
        }

        let successCount = 0;
        let failureCount = 0;

        // Send emails sequentially or in batches
        for (const recipient of targetList) {
            try {
                await sendMail({
                    to: recipient.email,
                    subject: subject,
                    html: html.replace(/{{name}}/g, recipient.name || "Artist")
                });
                successCount++;
            } catch (error) {
                console.error(`Failed to send email to ${recipient.email}:`, error);
                failureCount++;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            totalSent: targetList.length,
            successCount,
            failureCount
        }), { status: 200 });

    } catch (error) {
        console.error("[API Communiciations] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
