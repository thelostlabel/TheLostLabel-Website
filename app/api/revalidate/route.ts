import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { PUBLIC_SETTINGS_CACHE_TAG } from "@/lib/public-settings";

/**
 * POST /api/revalidate
 * Called by the control panel after syncing settings to this tenant's DB.
 * Requires a secret token to prevent abuse.
 */
export async function POST(req: NextRequest) {
  const { secret, tags } = await req.json();

  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const tagsToRevalidate: string[] = Array.isArray(tags) && tags.length > 0
    ? tags
    : [PUBLIC_SETTINGS_CACHE_TAG];

  for (const tag of tagsToRevalidate) {
    revalidateTag(tag);
  }

  return NextResponse.json({ ok: true, revalidated: tagsToRevalidate });
}
