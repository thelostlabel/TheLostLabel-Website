import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Strip tracking params before hitting oEmbed
  let cleanUrl = url;
  try {
    const parsed = new URL(url);
    cleanUrl = parsed.origin + parsed.pathname;
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!cleanUrl.includes("soundcloud.com")) {
    return NextResponse.json({ error: "Not a SoundCloud URL" }, { status: 400 });
  }

  try {
    const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json&maxwidth=800`;
    const res = await fetch(oembedUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 }, // cache 1 hour
    });

    if (!res.ok) {
      return NextResponse.json({ error: "SoundCloud oEmbed failed" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
