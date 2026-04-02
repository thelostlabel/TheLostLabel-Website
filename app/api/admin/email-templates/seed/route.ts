import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { seedDefaultTemplates } from "@/lib/email-template-service";

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        await seedDefaultTemplates();
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
        console.error("Email templates seed error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
