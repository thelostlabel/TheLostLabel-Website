import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { signupBodySchema } from "@/lib/auth-schemas";
import prisma from "@/lib/prisma";
import rateLimit from "@/lib/rate-limit";
import {
  buildRateLimitKey,
  generateOpaqueToken,
  hashOpaqueToken,
  hasMinimumPasswordLength,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  passesRateLimit,
} from "@/lib/security";
import { sendMail } from "@/lib/mail";
import { generateVerificationEmail } from "@/lib/mail-templates";
import { extractSpotifyArtistId, findBestSpotifyArtistMatch } from "@/lib/spotify";
import { scrapeSpotifyStats } from "@/lib/scraper";

const signupRateLimiter = rateLimit({
  interval: 30 * 60 * 1000,
  uniqueTokenPerInterval: 4000,
});

type RegistrationSettingsConfig = {
  registrationsOpen?: boolean;
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsedBody = signupBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const fullName = parsedBody.data.fullName.trim();
    const stageName = parsedBody.data.stageName.trim();
    const email = normalizeEmail(parsedBody.data.email);
    const password = parsedBody.data.password;

    const allowed = await passesRateLimit(signupRateLimiter, 6, buildRateLimitKey(req, "signup", email));
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const settings = await prisma.systemSettings.findFirst({ where: { id: "default" } });
    if (settings?.config) {
      let config: RegistrationSettingsConfig = {};
      try {
        config = JSON.parse(settings.config) as RegistrationSettingsConfig;
      } catch (parseError) {
        console.warn("Invalid system settings JSON in signup route:", parseError instanceof Error ? parseError.message : parseError);
      }
      if (config.registrationsOpen === false) {
        return NextResponse.json({ error: "Registrations are currently closed" }, { status: 403 });
      }
    }

    if (!email || !password || !fullName || !stageName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!hasMinimumPasswordLength(password)) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    const existingArtist = await prisma.artist.findFirst({
      where: {
        OR: [{ name: { equals: stageName, mode: "insensitive" } }, { email: { equals: email, mode: "insensitive" } }],
        userId: null,
      },
    });

    let spotifyMatch: Awaited<ReturnType<typeof findBestSpotifyArtistMatch>> | null = null;
    try {
      spotifyMatch = await findBestSpotifyArtistMatch(stageName);
    } catch (spotifyError) {
      console.warn("Spotify match failed during signup:", spotifyError instanceof Error ? spotifyError.message : spotifyError);
    }

    let scrapedSpotifyStats: Awaited<ReturnType<typeof scrapeSpotifyStats>> | null = null;
    if (spotifyMatch?.spotifyUrl && !existingArtist?.monthlyListeners) {
      try {
        scrapedSpotifyStats = await scrapeSpotifyStats(spotifyMatch.spotifyUrl);
      } catch (scrapeError) {
        console.warn("Spotify listener scrape failed during signup:", scrapeError instanceof Error ? scrapeError.message : scrapeError);
      }
    }

    const spotifyArtistId = extractSpotifyArtistId(spotifyMatch?.spotifyUrl || "");

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateOpaqueToken();
    const verificationTokenHash = hashOpaqueToken(verificationToken);
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.$transaction(async (tx) => {
      const matchedSpotifyUrl = spotifyMatch?.spotifyUrl || existingArtist?.spotifyUrl || null;
      const matchedMonthlyListeners = existingArtist?.monthlyListeners ?? scrapedSpotifyStats?.monthlyListeners ?? null;

      const createdUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          stageName,
          role: "artist",
          status: "pending",
          verificationToken: verificationTokenHash,
          verificationTokenExpiry,
          spotifyUrl: matchedSpotifyUrl,
          monthlyListeners: matchedMonthlyListeners,
        },
      });

      let artistToLink = null;
      if (existingArtist?.id) {
        artistToLink = await tx.artist.findFirst({
          where: {
            id: existingArtist.id,
            userId: null,
          },
        });
      }
      if (!artistToLink && spotifyArtistId) {
        artistToLink = await tx.artist.findFirst({
          where: {
            userId: null,
            spotifyUrl: { contains: spotifyArtistId },
          },
        });
      }

      const artistPayload = {
        spotifyUrl: spotifyMatch?.spotifyUrl || artistToLink?.spotifyUrl || null,
        image: artistToLink?.image || spotifyMatch?.image || scrapedSpotifyStats?.imageUrl || null,
        monthlyListeners: artistToLink?.monthlyListeners ?? scrapedSpotifyStats?.monthlyListeners ?? 0,
        followers: artistToLink?.followers ?? spotifyMatch?.followers ?? 0,
        popularity: artistToLink?.popularity ?? spotifyMatch?.popularity ?? 0,
        name: artistToLink?.name || spotifyMatch?.name || stageName,
        email,
      };

      if (artistToLink) {
        await tx.artist.update({
          where: { id: artistToLink.id },
          data: {
            userId: createdUser.id,
            ...(artistPayload.spotifyUrl ? { spotifyUrl: artistPayload.spotifyUrl } : {}),
            ...(artistPayload.image ? { image: artistPayload.image } : {}),
            ...(artistPayload.monthlyListeners !== null ? { monthlyListeners: artistPayload.monthlyListeners } : {}),
            ...(artistPayload.followers !== null ? { followers: artistPayload.followers } : {}),
            ...(artistPayload.popularity !== null ? { popularity: artistPayload.popularity } : {}),
            ...(artistPayload.name ? { name: artistPayload.name } : {}),
            email,
          },
        });
      } else {
        await tx.artist.create({
          data: {
            userId: createdUser.id,
            name: artistPayload.name || stageName,
            email,
            spotifyUrl: artistPayload.spotifyUrl,
            image: artistPayload.image,
            monthlyListeners: artistPayload.monthlyListeners ?? 0,
            followers: artistPayload.followers ?? 0,
            popularity: artistPayload.popularity ?? 0,
          },
        });
      }

      return createdUser;
    });

    const verificationLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/verify-email?token=${verificationToken}`;

    await sendMail({
      to: email,
      subject: "Confirm your collective identity | LOST.",
      html: generateVerificationEmail(verificationLink),
    });

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
