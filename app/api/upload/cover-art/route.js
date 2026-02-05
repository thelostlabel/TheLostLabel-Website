import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file');
        const releaseId = formData.get('releaseId');

        if (!file || !releaseId) {
            return new Response("Missing file or releaseId", { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = join(process.cwd(), 'public', 'uploads', 'covers');
        await mkdir(uploadDir, { recursive: true });

        const filename = `${releaseId}_${Date.now()}_${file.name}`;
        const path = join(uploadDir, filename);
        await writeFile(path, buffer);

        const imageUrl = `/uploads/covers/${filename}`;

        await prisma.release.update({
            where: { id: releaseId },
            data: { image: imageUrl }
        });

        return new Response(JSON.stringify({ success: true, url: imageUrl }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
