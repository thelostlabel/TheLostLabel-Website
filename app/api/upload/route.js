import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import rateLimit from "@/lib/rate-limit";
import { randomUUID } from 'crypto';

// Rate limiter: 20 uploads per hour
const limiter = rateLimit({
    interval: 60 * 60 * 1000,
    uniqueTokenPerInterval: 500,
});

const MAX_DEMO_BYTES = 100 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_BYTES = 25 * 1024 * 1024;

export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        await limiter.check(null, 20, session.user.id);
    } catch {
        return new Response(JSON.stringify({ error: "Upload rate limit exceeded." }), { status: 429 });
    }

    try {
        const formData = await req.formData();
        const files = formData.getAll('files');

        if (!files || files.length === 0) {
            return new Response(JSON.stringify({ error: "No files provided" }), { status: 400 });
        }

        // Create uploads directories
        const demoDir = join(process.cwd(), 'private', 'uploads', 'demos');
        const contractDir = join(process.cwd(), 'private', 'uploads', 'contracts');
        const releaseDir = join(process.cwd(), 'private', 'uploads', 'releases');
        await mkdir(demoDir, { recursive: true });
        await mkdir(contractDir, { recursive: true });
        await mkdir(releaseDir, { recursive: true });

        const uploadedFiles = [];

        for (const file of files) {
            // Strict extension checking
            const ext = file.name.split('.').pop().toLowerCase();
            const allowedExtensions = ['wav', 'jpg', 'jpeg', 'png', 'pdf'];

            if (!allowedExtensions.includes(ext)) {
                continue;
            }

            let targetDir;
            let publicPath;

            if (ext === 'wav') {
                if (file.size > MAX_DEMO_BYTES) {
                    console.warn(`Demo file too large for user ${session.user.id}: ${file.name} (${file.size} bytes)`);
                    return new Response(JSON.stringify({ error: "Demo file too large (max 100MB)." }), { status: 400 });
                }
                targetDir = demoDir;
                publicPath = 'private/uploads/demos/';
            } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
                if (file.size > MAX_IMAGE_BYTES) {
                    console.warn(`Image file too large for user ${session.user.id}: ${file.name} (${file.size} bytes)`);
                    return new Response(JSON.stringify({ error: "Image too large (max 10MB)." }), { status: 400 });
                }
                targetDir = releaseDir;
                publicPath = 'private/uploads/releases/';
            } else if (ext === 'pdf') {
                if (file.size > MAX_PDF_BYTES) {
                    console.warn(`PDF file too large for user ${session.user.id}: ${file.name} (${file.size} bytes)`);
                    return new Response(JSON.stringify({ error: "PDF too large (max 25MB)." }), { status: 400 });
                }
                targetDir = contractDir;
                publicPath = 'private/uploads/contracts/';
            } else {
                // This case should ideally be caught by allowedExtensions check, but as a fallback
                console.warn(`Unexpected file extension encountered for user ${session.user.id}: ${file.name}`);
                continue;
            }

            // Generate unique filename using randomUUID
            const uniqueId = randomUUID();
            const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueFilename = `${uniqueId}_${safeOriginalName}`;
            const filepath = join(targetDir, uniqueFilename);

            // Write file
            const bytes = await file.arrayBuffer();
            await writeFile(filepath, Buffer.from(bytes));
            console.log(`File uploaded by user ${session.user.id}: ${file.name} -> ${filepath}`);

            uploadedFiles.push({
                filename: file.name,
                filepath: `${publicPath}${uniqueFilename}`,
                filesize: file.size
            });
        }

        if (uploadedFiles.length === 0) {
            return new Response(JSON.stringify({ error: "No supported files were uploaded. Please use .wav for demos or .jpg/.png for artwork." }), { status: 400 });
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
