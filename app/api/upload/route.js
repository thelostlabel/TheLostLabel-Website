import { mkdir, unlink } from 'fs/promises';
import { createWriteStream } from 'fs';
import { join, resolve } from 'path';
import { once } from 'events';
import { finished } from 'stream/promises';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import rateLimit from "@/lib/rate-limit";
import { randomUUID } from 'crypto';
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-errors";

const limiter = rateLimit({
    interval: 60 * 60 * 1000,
    uniqueTokenPerInterval: 500
});

const MAX_DEMO_BYTES = 100 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_BYTES = 25 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 10;
const MAX_TOTAL_BYTES = 250 * 1024 * 1024;
const SIGNATURE_SAMPLE_BYTES = 16;

const isAllowedSignature = (ext, buffer) => {
    if (!buffer || buffer.length < 12) return false;

    if (ext === 'wav') {
        return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE';
    }
    if (ext === 'pdf') {
        return buffer.toString('ascii', 0, 4) === '%PDF';
    }
    if (ext === 'png') {
        return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    }
    if (ext === 'jpg' || ext === 'jpeg') {
        return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    }
    return false;
};

const sizeErrorForExt = (ext) => {
    if (ext === 'wav') return 'Demo file too large (max 100MB).';
    if (ext === 'pdf') return 'PDF too large (max 25MB).';
    return 'Image too large (max 10MB).';
};

async function writeStreamedFile({ file, filepath, ext, maxBytes }) {
    const webStream = file.stream();
    const reader = webStream.getReader();
    const output = createWriteStream(filepath, { flags: 'wx' });

    let totalBytes = 0;
    let signatureSample = Buffer.alloc(0);
    let signatureChecked = false;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = Buffer.from(value);
            totalBytes += chunk.length;

            if (totalBytes > maxBytes) {
                throw new Error('FILE_TOO_LARGE');
            }

            if (signatureSample.length < SIGNATURE_SAMPLE_BYTES) {
                const needed = SIGNATURE_SAMPLE_BYTES - signatureSample.length;
                signatureSample = Buffer.concat([signatureSample, chunk.subarray(0, needed)]);
            }

            if (!signatureChecked && signatureSample.length >= 12) {
                if (!isAllowedSignature(ext, signatureSample)) {
                    throw new Error('INVALID_SIGNATURE');
                }
                signatureChecked = true;
            }

            if (!output.write(chunk)) {
                await once(output, 'drain');
            }
        }

        output.end();
        await finished(output);

        if (!signatureChecked && !isAllowedSignature(ext, signatureSample)) {
            throw new Error('INVALID_SIGNATURE');
        }

        return totalBytes;
    } catch (error) {
        output.destroy();
        await unlink(filepath).catch(() => { });
        throw error;
    } finally {
        reader.releaseLock();
    }
}

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
        if (files.length > MAX_FILES_PER_REQUEST) {
            return new Response(JSON.stringify({ error: `Too many files. Max ${MAX_FILES_PER_REQUEST} files per upload.` }), { status: 400 });
        }

        const totalBytes = files.reduce((sum, f) => sum + (f?.size || 0), 0);
        if (totalBytes > MAX_TOTAL_BYTES) {
            return new Response(JSON.stringify({ error: "Total upload size too large (max 250MB)." }), { status: 400 });
        }

        const storageRoot = process.env.PRIVATE_STORAGE_ROOT
            ? resolve(process.env.PRIVATE_STORAGE_ROOT)
            : join(process.cwd(), 'private');

        const demoDir = join(storageRoot, 'uploads', 'demos');
        const contractDir = join(storageRoot, 'uploads', 'contracts');
        const releaseDir = join(storageRoot, 'uploads', 'releases');

        await mkdir(demoDir, { recursive: true });
        await mkdir(contractDir, { recursive: true });
        await mkdir(releaseDir, { recursive: true });

        const uploadedFiles = [];

        for (const file of files) {
            const ext = file.name.split('.').pop().toLowerCase();
            const allowedExtensions = ['wav', 'jpg', 'jpeg', 'png', 'pdf'];

            if (!allowedExtensions.includes(ext)) {
                continue;
            }

            let targetDir;
            let publicPath;
            let maxBytes;

            if (ext === 'wav') {
                if (file.size > MAX_DEMO_BYTES) {
                    logger.warn('Demo file size exceeded', { userId: session.user.id, fileName: file.name, size: file.size });
                    return new Response(JSON.stringify({ error: 'Demo file too large (max 100MB).' }), { status: 400 });
                }
                targetDir = demoDir;
                publicPath = 'private/uploads/demos/';
                maxBytes = MAX_DEMO_BYTES;
            } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
                if (file.size > MAX_IMAGE_BYTES) {
                    logger.warn('Image file size exceeded', { userId: session.user.id, fileName: file.name, size: file.size });
                    return new Response(JSON.stringify({ error: 'Image too large (max 10MB).' }), { status: 400 });
                }
                targetDir = releaseDir;
                publicPath = 'private/uploads/releases/';
                maxBytes = MAX_IMAGE_BYTES;
            } else {
                if (file.size > MAX_PDF_BYTES) {
                    logger.warn('PDF file size exceeded', { userId: session.user.id, fileName: file.name, size: file.size });
                    return new Response(JSON.stringify({ error: 'PDF too large (max 25MB).' }), { status: 400 });
                }
                targetDir = contractDir;
                publicPath = 'private/uploads/contracts/';
                maxBytes = MAX_PDF_BYTES;
            }

            const uniqueId = randomUUID();
            const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueFilename = `${uniqueId}_${safeOriginalName}`;
            const filepath = join(targetDir, uniqueFilename);

            try {
                await writeStreamedFile({ file, filepath, ext, maxBytes });
                logger.info('File uploaded', { userId: session.user.id, fileName: file.name, filePath: filepath });

                uploadedFiles.push({
                    filename: file.name,
                    filepath: `${publicPath}${uniqueFilename}`,
                    filesize: file.size
                });
            } catch (error) {
                if (error.message === 'INVALID_SIGNATURE') {
                    logger.warn('File signature mismatch', { userId: session.user.id, fileName: file.name, ext });
                    continue;
                }

                if (error.message === 'FILE_TOO_LARGE') {
                    logger.warn('File exceeded stream size limit', { userId: session.user.id, fileName: file.name, ext });
                    return new Response(JSON.stringify({ error: sizeErrorForExt(ext) }), { status: 400 });
                }

                throw error;
            }
        }

        if (uploadedFiles.length === 0) {
            return new Response(JSON.stringify({ error: 'No supported files were uploaded. Please use .wav for demos or .jpg/.png for artwork.' }), { status: 400 });
        }

        return new Response(JSON.stringify({
            success: true,
            files: uploadedFiles
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        logger.error('Upload failed', error);
        return handleApiError(error, 'POST /api/upload');
    }
}
