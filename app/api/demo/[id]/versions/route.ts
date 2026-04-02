import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canViewAllDemos } from "@/lib/permissions";
import { createDemoVersionSnapshot, getDemoVersionHistory } from "@/lib/demo-version-service";
import { resolveArtistContextForUser } from "@/lib/artist-identity";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const demo = await prisma.demo.findUnique({ where: { id }, select: { id: true, artistId: true, artistProfileId: true } });
    if (!demo) return new Response(JSON.stringify({ error: "Demo not found" }), { status: 404 });

    const isAdmin = canViewAllDemos(session.user);
    const artistContext = await resolveArtistContextForUser(session.user.id);
    const isOwner = demo.artistId === session.user.id || (artistContext.artistId && demo.artistProfileId === artistContext.artistId);

    if (!isAdmin && !isOwner) {
      return new Response("Forbidden", { status: 403 });
    }

    const versions = await getDemoVersionHistory(id);
    return new Response(JSON.stringify(versions), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const demo = await prisma.demo.findUnique({
      where: { id },
      select: { id: true, artistId: true, artistProfileId: true },
    });
    if (!demo) return new Response(JSON.stringify({ error: "Demo not found" }), { status: 404 });

    const artistContext = await resolveArtistContextForUser(session.user.id);
    const isOwner = demo.artistId === session.user.id || (artistContext.artistId && demo.artistProfileId === artistContext.artistId);

    if (!isOwner) {
      return new Response(JSON.stringify({ error: "Only the demo owner can create revisions" }), { status: 403 });
    }

    // Snapshot current state
    await createDemoVersionSnapshot(id);

    // Apply optional field changes from request body
    const body = await req.json().catch(() => ({}));
    const updateData: Record<string, string> = {};
    if (typeof body.title === "string" && body.title.trim()) updateData.title = body.title.trim();
    if (typeof body.genre === "string") updateData.genre = body.genre.trim();
    if (typeof body.message === "string") updateData.message = body.message.trim();

    if (Object.keys(updateData).length > 0) {
      await prisma.demo.update({ where: { id }, data: updateData });
    }

    const versions = await getDemoVersionHistory(id);
    return new Response(JSON.stringify(versions), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
