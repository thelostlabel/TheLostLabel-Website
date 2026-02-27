import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendMail } from '@/lib/mail';
import { generateVerificationEmail } from '@/lib/mail-templates';
import { extractSpotifyArtistId, findBestSpotifyArtistMatch } from '@/lib/spotify';
import { scrapeSpotifyStats } from '@/lib/scraper';

export async function POST(req) {
    try {
        const body = await req.json();
        const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
        const stageName = typeof body?.stageName === 'string' ? body.stageName.trim() : '';
        const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body?.password === 'string' ? body.password : '';

        // 1. Check System Settings
        const settings = await prisma.systemSettings.findFirst({ where: { id: "default" } });
        if (settings && settings.config) {
            let config = {};
            try {
                config = JSON.parse(settings.config);
            } catch (parseError) {
                console.warn('Invalid system settings JSON in signup route:', parseError?.message || parseError);
            }
            if (config.registrationsOpen === false) {
                return NextResponse.json({ error: "Registrations are currently closed" }, { status: 403 });
            }
        }

        // 2. Validate Input
        if (!email || !password || !fullName || !stageName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }

        // 3. Check Existing User
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
        }

        // 4. Check for Existing Artist to Link
        const existingArtist = await prisma.artist.findFirst({
            where: {
                OR: [
                    { name: { equals: stageName, mode: 'insensitive' } },
                    { email: { equals: email, mode: 'insensitive' } }
                ],
                userId: null // Only link if not already linked
            }
        });

        // 5. Try Spotify match by stage name for auto-link/profile enrichment
        let spotifyMatch = null;
        try {
            spotifyMatch = await findBestSpotifyArtistMatch(stageName);
        } catch (spotifyError) {
            console.warn('Spotify match failed during signup:', spotifyError?.message || spotifyError);
        }

        let scrapedSpotifyStats = null;
        if (spotifyMatch?.spotifyUrl && !existingArtist?.monthlyListeners) {
            try {
                scrapedSpotifyStats = await scrapeSpotifyStats(spotifyMatch.spotifyUrl);
            } catch (scrapeError) {
                console.warn('Spotify listener scrape failed during signup:', scrapeError?.message || scrapeError);
            }
        }

        const spotifyArtistId = extractSpotifyArtistId(spotifyMatch?.spotifyUrl || '');

        // 6. Create User with Verification Token
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Expiry 24 hours from now
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
                    role: 'artist',
                    status: 'pending',
                    verificationToken,
                    verificationTokenExpiry,
                    spotifyUrl: matchedSpotifyUrl,
                    monthlyListeners: matchedMonthlyListeners
                }
            });

            let artistToLink = null;
            if (existingArtist?.id) {
                artistToLink = await tx.artist.findFirst({
                    where: {
                        id: existingArtist.id,
                        userId: null
                    }
                });
            }
            if (!artistToLink && spotifyArtistId) {
                artistToLink = await tx.artist.findFirst({
                    where: {
                        userId: null,
                        spotifyUrl: { contains: spotifyArtistId }
                    }
                });
            }

            const artistPayload = {
                spotifyUrl: spotifyMatch?.spotifyUrl || artistToLink?.spotifyUrl || null,
                image: artistToLink?.image || spotifyMatch?.image || scrapedSpotifyStats?.imageUrl || null,
                monthlyListeners: artistToLink?.monthlyListeners ?? scrapedSpotifyStats?.monthlyListeners ?? 0,
                followers: artistToLink?.followers ?? spotifyMatch?.followers ?? 0,
                popularity: artistToLink?.popularity ?? spotifyMatch?.popularity ?? 0,
                name: artistToLink?.name || spotifyMatch?.name || stageName,
                email
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
                        email
                    }
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
                        popularity: artistPayload.popularity ?? 0
                    }
                });
            }

            return createdUser;
        });

        // 5. Send Verification Email
        const verificationLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;

        await sendMail({
            to: email,
            subject: 'Confirm your collective identity | LOST.',
            html: generateVerificationEmail(verificationLink)
        });

        return NextResponse.json({ success: true, userId: user.id }, { status: 201 });

    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
