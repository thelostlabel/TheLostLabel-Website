import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse/lib/pdf-parse.js');

const MAX_PDF_BYTES = 25 * 1024 * 1024;

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
        if (file.size > MAX_PDF_BYTES) {
            return new Response(JSON.stringify({ error: "PDF too large (max 25MB)." }), { status: 400 });
        }

        // Create uploads directory if not exists
        const uploadsDir = join(process.cwd(), 'private', 'uploads', 'contracts');
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

        // 5. Build parsed text response
        let parsedText = "";
        let guessedArtistShare = 0.50; // default 50/50 instead of 70/30
        let guessedLabelShare = 0.50;

        try {
            // pdf-parse works with Buffer
            const pdfData = await pdf(Buffer.from(bytes));
            parsedText = pdfData.text || "";

            // Try "Revenue Share: X% Artist / Y% Label" first (our contract format)
            const revenueShareMatch = parsedText.match(/Revenue Share:\s*(\d+)%\s*Artist\s*\/\s*(\d+)%\s*Label/i);
            if (revenueShareMatch) {
                guessedArtistShare = parseInt(revenueShareMatch[1], 10) / 100;
                guessedLabelShare = parseInt(revenueShareMatch[2], 10) / 100;
            } else {
                // Fallback: generic percentage extraction
                const artistShareMatch = parsedText.match(/(?:artist|contributor)(?:\s+share)?\D*(\d{2,3})\s*%/i);
                const labelShareMatch = parsedText.match(/(?:label|company)(?:\s+share)?\D*(\d{2,3})\s*%/i);

                if (artistShareMatch && artistShareMatch[1]) {
                    const foundShare = parseInt(artistShareMatch[1], 10);
                    if (foundShare > 0 && foundShare <= 100) {
                        guessedArtistShare = foundShare / 100;
                        guessedLabelShare = 1 - guessedArtistShare;
                    }
                } else if (labelShareMatch && labelShareMatch[1]) {
                    const foundLabelShare = parseInt(labelShareMatch[1], 10);
                    if (foundLabelShare > 0 && foundLabelShare <= 100) {
                        guessedLabelShare = foundLabelShare / 100;
                        guessedArtistShare = 1 - guessedLabelShare;
                    }
                }
            }
        } catch (parseError) {
            console.warn("Failed to parse PDF text:", parseError);
        }

        return new Response(JSON.stringify({
            success: true,
            pdfUrl: `private/uploads/contracts/${uniqueFilename}`,
            parsedMetadata: {
                artistShare: guessedArtistShare,
                labelShare: guessedLabelShare,
                extractedTextLength: parsedText.length,
                parsedText // Return full text for frontend processing
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Contract Upload Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
