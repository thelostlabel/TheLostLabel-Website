import {
  getPublicSettings,
  PUBLIC_SETTINGS_REVALIDATE_SECONDS,
} from "@/lib/public-settings";

export async function GET() {
  try {
    const payload = await getPublicSettings();

    return Response.json(payload, {
      headers: {
        "Cache-Control": `public, s-maxage=${PUBLIC_SETTINGS_REVALIDATE_SECONDS}, stale-while-revalidate=${PUBLIC_SETTINGS_REVALIDATE_SECONDS * 2}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
