import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { settleSideEffects } from "@/lib/async-effects";
import { getReleaseArtistWhereById } from "@/lib/release-artists";
import { normalizeSystemSettingsConfig, parseSystemSettingsConfig } from "@/lib/system-settings";
import { hasStrictPortalPermission } from "@/lib/permissions";

const ARTIST_SUPPORT_TYPES = new Set([
    "general_support",
    "metadata_correction",
    "technical_issue",
    "earnings_billing",
    "take_down",
    "marketing_request",
]);

function isSupportRequestType(type, releaseId) {
    if (!releaseId) return true;
    return ARTIST_SUPPORT_TYPES.has(type);
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

function extractSpotifyArtistId(url) {
    if (!url || typeof url !== "string") return null;
    const parts = url.split("/").filter(Boolean);
    const lastPart = parts.pop() || "";
    const id = lastPart.split("?")[0]?.trim();
    return id || null;
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await req.json();
        const { releaseId, type, details } = body;
        const normalizedType = typeof type === "string" ? type.trim().toLowerCase() : "";
        const normalizedDetails = typeof details === "string" ? details.trim() : "";
        const isSupportRequest = isSupportRequestType(normalizedType, releaseId);

        if (!normalizedType) {
            return new Response(JSON.stringify({ error: "Request type is required." }), { status: 400 });
        }
        if (normalizedType.length > 64) {
            return new Response(JSON.stringify({ error: "Request type is too long." }), { status: 400 });
        }
        if (!normalizedDetails) {
            return new Response(JSON.stringify({ error: "Request details are required." }), { status: 400 });
        }
        if (normalizedDetails.length > 5000) {
            return new Response(JSON.stringify({ error: "Request details are too long." }), { status: 400 });
        }

        if (isSupportRequest && !hasStrictPortalPermission(session.user, "view_support")) {
            return new Response(JSON.stringify({ error: "You do not have permission to open support tickets." }), { status: 403 });
        }

        if (!isSupportRequest && !hasStrictPortalPermission(session.user, "request_changes")) {
            return new Response(JSON.stringify({ error: "You do not have permission to request release changes." }), { status: 403 });
        }

        // Verify System Settings (optional: check if request type is enabled)
        const settings = await prisma.systemSettings.findFirst({ where: { id: "default" } });
        if (settings?.config) {
            const config = normalizeSystemSettingsConfig(parseSystemSettingsConfig(settings.config));
            if (normalizedType === 'cover_art' && config.allowCoverArt === false) {
                return new Response(JSON.stringify({ error: "This request type is currently disabled by admin." }), { status: 403 });
            }
        }

        const request = await prisma.changeRequest.create({
            data: {
                type: normalizedType,
                details: normalizedDetails,
                status: 'pending',
                releaseId: releaseId || null,
                userId: session.user.id
            }
        });

        const supportEmail = process.env.SUPPORT_EMAIL || 'support@thelostlabel.com';
        const safeStageName = escapeHtml(session.user.stageName || 'Artist');
        const safeDetails = escapeHtml(normalizedDetails).replace(/\n/g, '<br>');
        const safeEmail = escapeHtml(session.user.email || '');

        await settleSideEffects([
            {
                label: "artist-support-confirmation-email",
                run: () => sendMail({
                to: session.user.email,
                subject: 'Support Ticket Created Successfully - LOST.',
                html: `
                    <div style="font-family: sans-serif; color: #333;">
                        <h2>Support Ticket Created</h2>
                        <p>Hello <strong>${safeStageName}</strong>,</p>
                        <p>Your support request has been created successfully.</p>
                        <p><strong>Type:</strong> ${normalizedType.toUpperCase().replace('_', ' ')}</p>
                        <p><strong>Details:</strong> ${safeDetails}</p>
                        <p>Our support team will review it shortly. You can track status from your dashboard.</p>
                        <br>
                        <p>Best,<br>LOST. Team</p>
                    </div>
                `
                }).catch((mailError) => {
                    console.error("Artist support confirmation email failed:", mailError);
                })
            },
            {
                label: "support-mailbox-email",
                run: () => sendMail({
                    to: supportEmail,
                    subject: `New Support Ticket: ${normalizedType.toUpperCase()} from ${session.user.stageName || session.user.email}`,
                    html: `
                        <div style="font-family: sans-serif; color: #333;">
                            <h2>New Support Ticket</h2>
                            <p><strong>Artist:</strong> ${safeStageName} (${safeEmail})</p>
                            <p><strong>Type:</strong> ${normalizedType.toUpperCase().replace('_', ' ')}</p>
                            <p><strong>Details:</strong> ${safeDetails}</p>
                            <br>
                            <a href="${process.env.NEXTAUTH_URL}/dashboard?view=requests">View in Admin Panel</a>
                        </div>
                    `
                }).catch((mailError) => {
                    console.error("Support mailbox notification email failed:", mailError);
                })
            }
        ], 5000);

        return new Response(JSON.stringify(request), { status: 201 });
    } catch (e) {
        console.error("Create Request Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    if (!hasStrictPortalPermission(session.user, "view_support")) {
        return new Response(JSON.stringify({ error: "You do not have permission to access support requests." }), { status: 403 });
    }

    try {
        // 1. Get user's Spotify ID
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                spotifyUrl: true,
                artist: { select: { spotifyUrl: true } }
            }
        });

        const spotifyId = extractSpotifyArtistId(user?.artist?.spotifyUrl) || extractSpotifyArtistId(user?.spotifyUrl);

        const accessConditions = [{ userId: session.user.id }];
        const releaseArtistCondition = getReleaseArtistWhereById(spotifyId);
        if (releaseArtistCondition) {
            accessConditions.push({
                release: {
                    ...releaseArtistCondition
                }
            });
        }

        const requests = await prisma.changeRequest.findMany({
            where: {
                OR: accessConditions
            },
            orderBy: { createdAt: 'desc' },
            include: { release: true }
        });

        return new Response(JSON.stringify(requests), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
