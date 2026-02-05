import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
    const session = await getServerSession(authOptions);

    // Only Admin or A&R can upload contracts
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return new Response(JSON.stringify({ error: "Only PDF files are allowed" }), { status: 400 });
        }

        // Create uploads directory if not exists
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'contracts');
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFilename = `${timestamp}_${randomStr}_${safeFilename}`;
        const filepath = join(uploadsDir, uniqueFilename);

        // Write file
        const bytes = await file.arrayBuffer();
        await writeFile(filepath, Buffer.from(bytes));

        return new Response(JSON.stringify({
            success: true,
            pdfUrl: `/uploads/contracts/${uniqueFilename}`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Contract Upload Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
