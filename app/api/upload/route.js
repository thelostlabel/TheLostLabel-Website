import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const formData = await req.formData();
        const files = formData.getAll('files');

        if (!files || files.length === 0) {
            return new Response(JSON.stringify({ error: "No files provided" }), { status: 400 });
        }

        // Create uploads directory if not exists
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'demos');
        await mkdir(uploadsDir, { recursive: true });

        const uploadedFiles = [];

        for (const file of files) {
            // Validate file type
            if (!file.name.toLowerCase().endsWith('.wav')) {
                continue; // Skip non-WAV files
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(7);
            const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueFilename = `${timestamp}_${randomStr}_${safeFilename}`;
            const filepath = join(uploadsDir, uniqueFilename);

            // Write file
            const bytes = await file.arrayBuffer();
            await writeFile(filepath, Buffer.from(bytes));

            uploadedFiles.push({
                filename: file.name,
                filepath: `/uploads/demos/${uniqueFilename}`,
                filesize: file.size
            });
        }

        if (uploadedFiles.length === 0) {
            return new Response(JSON.stringify({ error: "No valid WAV files uploaded" }), { status: 400 });
        }

        return new Response(JSON.stringify({
            success: true,
            files: uploadedFiles
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Upload Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
