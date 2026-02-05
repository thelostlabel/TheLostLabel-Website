import { sendDiscordNotification } from "@/lib/discord";

// POST: Test webhook notification
export async function POST(req) {
    try {
        const success = await sendDiscordNotification({
            title: "🧪 WEBHOOK TEST",
            description: "This is a test notification from the LOST Admin Panel.",
            color: 0x9B59B6, // Purple
            fields: [
                { name: "Status", value: "Connected ✅", inline: true },
                { name: "Time", value: new Date().toLocaleString(), inline: true }
            ]
        });

        return new Response(JSON.stringify({ success }), { status: success ? 200 : 500 });
    } catch (error) {
        console.error("Webhook Test Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
