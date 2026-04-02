import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canViewAllDemos } from "@/lib/permissions";
import { restoreDemoVersion } from "@/lib/demo-version-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id, versionId } = await params;

  if (!canViewAllDemos(session.user)) {
    return new Response(JSON.stringify({ error: "Only admins can restore versions" }), { status: 403 });
  }

  try {
    const demo = await prisma.demo.findUnique({ where: { id }, select: { id: true } });
    if (!demo) return new Response(JSON.stringify({ error: "Demo not found" }), { status: 404 });

    await restoreDemoVersion(id, versionId);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
