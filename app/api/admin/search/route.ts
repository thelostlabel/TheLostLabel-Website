import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getAuthoritativeDashboardAccessUser, getDashboardAccessError } from "@/lib/dashboard-access";
import prisma from "@/lib/prisma";

type SearchResultItem = {
  id: string;
  type: string;
  label: string;
  description?: string;
  view: string;
  recordId?: string;
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ results: [] }, { status: 401 });
  }
  const accessUser = await getAuthoritativeDashboardAccessUser(session.user.id);
  const accessError = getDashboardAccessError(accessUser);
  if (accessError) {
    return NextResponse.json({ results: [] }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results: SearchResultItem[] = [];
  const searchTerm = { contains: q, mode: "insensitive" as const };

  try {
    const [artists, users, releases, demos, contracts] = await Promise.all([
      // Artists — field is "name" not "stageName"
      prisma.artist.findMany({
        where: {
          OR: [
            { name: searchTerm },
            { email: searchTerm },
          ],
        },
        select: { id: true, name: true, email: true },
        take: 5,
      }),

      // Users — field is "fullName" not "name"
      prisma.user.findMany({
        where: {
          OR: [
            { email: searchTerm },
            { fullName: searchTerm },
            { stageName: searchTerm },
          ],
        },
        select: { id: true, email: true, fullName: true, stageName: true, role: true },
        take: 5,
      }),

      // Releases
      prisma.release.findMany({
        where: { name: searchTerm },
        select: { id: true, name: true, artistName: true },
        take: 5,
      }),

      // Demos
      prisma.demo.findMany({
        where: {
          OR: [
            { title: searchTerm },
            { artist: { email: searchTerm } },
            { artist: { stageName: searchTerm } },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          artist: { select: { stageName: true, email: true } },
        },
        take: 5,
      }),

      // Contracts
      prisma.contract.findMany({
        where: {
          OR: [
            { title: searchTerm },
            { primaryArtistName: searchTerm },
            { release: { name: searchTerm } },
          ],
        },
        select: {
          id: true,
          title: true,
          primaryArtistName: true,
          release: { select: { name: true } },
        },
        take: 5,
      }),
    ]);

    for (const a of artists) {
      results.push({
        id: a.id,
        type: "artist",
        label: a.name || "Unnamed Artist",
        description: a.email || undefined,
        view: "artists",
        recordId: a.id,
      });
    }

    for (const u of users) {
      results.push({
        id: u.id,
        type: "user",
        label: u.stageName || u.fullName || u.email,
        description: `${u.role || "user"} · ${u.email}`,
        view: "users",
        recordId: u.id,
      });
    }

    for (const r of releases) {
      results.push({
        id: r.id,
        type: "release",
        label: r.name,
        description: r.artistName || "Release",
        view: "releases",
        recordId: r.id,
      });
    }

    for (const d of demos) {
      results.push({
        id: d.id,
        type: "demo",
        label: d.title || "Untitled Demo",
        description: `${d.status} · ${d.artist?.stageName || d.artist?.email || ""}`,
        view: "submissions",
        recordId: d.id,
      });
    }

    for (const c of contracts) {
      results.push({
        id: c.id,
        type: "contract",
        label: c.title || c.release?.name || "Untitled Contract",
        description: c.primaryArtistName || undefined,
        view: "contracts",
        recordId: c.id,
      });
    }

    return NextResponse.json({ results: results.slice(0, 15) });
  } catch (error) {
    console.error("[admin/search GET]", error);
    return NextResponse.json({ results: [] });
  }
}
