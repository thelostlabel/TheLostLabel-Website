import { NextResponse } from "next/server";

import { getSyncJob } from "@/lib/sync-jobs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const job = await getSyncJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job }, { status: 200 });
}
