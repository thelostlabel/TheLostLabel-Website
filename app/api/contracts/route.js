import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { embedContractMetaInNotes, extractContractMetaAndNotes } from "@/lib/contract-template";

function normalizeShare(value, defaultValue) {
    if (value === undefined || value === null || value === "") return defaultValue;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;

    // Accept both 0.7 and 70 style inputs.
    const normalized = parsed > 1 && parsed <= 100 ? parsed / 100 : parsed;
    if (normalized < 0 || normalized > 1) return null;
    return normalized;
}

function normalizeSplitPercentage(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;

    // Accept both 25 and 0.25 style inputs.
    const normalized = parsed <= 1 ? parsed * 100 : parsed;
    if (normalized < 0 || normalized > 100) return null;
    return normalized;
}

function validateAndNormalizeSplits(splits) {
    if (!splits) return { normalized: null };
    if (!Array.isArray(splits)) return { error: "Splits must be an array." };

    const normalized = [];
    for (const split of splits) {
        const percentage = normalizeSplitPercentage(split.percentage);
        if (!split?.name || percentage === null) {
            return { error: "Each split requires a valid name and percentage (0-100)." };
        }
        normalized.push({
            name: split.name,
            email: split.email || null,
            percentage,
            userId: split.userId || null,
            artistId: split.artistId || null
        });
    }

    const totalSplit = normalized.reduce((sum, split) => sum + split.percentage, 0);
    if (totalSplit > 100.0001) {
        return { error: "Split percentages cannot exceed 100%." };
    }
    return { normalized };
}

// GET: Fetch contracts
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { role, id: userId } = session.user;
        let contracts;

        const includeOptions = {
            user: {
                select: { id: true, email: true, stageName: true, fullName: true }
            },
            release: true,
            artist: true,
            splits: {
                include: {
                    user: { select: { id: true, stageName: true } }
                }
            },
            _count: {
                select: { earnings: true }
            }
        };

        if (role === 'admin' || role === 'a&r') {
            // Admin/A&R can see all contracts
            contracts = await prisma.contract.findMany({
                include: includeOptions,
                orderBy: { createdAt: 'desc' }
            });
        } else {
            // Artists can see their own contracts AND contracts where they are a split contributor
            // Also include contracts linked via their Artist profile or email
            contracts = await prisma.contract.findMany({
                where: {
                    OR: [
                        { userId }, // Directly linked to User
                        { primaryArtistEmail: session.user.email }, // Linked via Email
                        { artist: { userId } }, // Linked via Artist Profile User ID
                        { artist: { email: session.user.email } }, // Linked via Artist Profile Email
                        { splits: { some: { userId } } }, // Collaborator via User ID
                        { splits: { some: { email: session.user.email } } }, // Collaborator via Email (Direct match)
                        { splits: { some: { user: { email: session.user.email } } } } // Collaborator via Email (Linked User)
                    ]
                },
                include: {
                    ...includeOptions,
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        return new Response(JSON.stringify({ contracts }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// POST: Create a new contract (Admin only)
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    try {
        const body = await req.json();
        const { releaseId, title, demoId, artistId, userId, primaryArtistName, primaryArtistEmail, artistShare, labelShare, notes, status, pdfUrl, splits, featuredArtists, contractDetails } = body;

        const normalizedArtistShare = normalizeShare(artistShare, 0.7);
        const normalizedLabelShare = normalizeShare(labelShare, 0.3);
        if (normalizedArtistShare === null || normalizedLabelShare === null) {
            return new Response(JSON.stringify({ error: "artistShare/labelShare must be between 0-1 or 0-100." }), { status: 400 });
        }
        if (Math.abs((normalizedArtistShare + normalizedLabelShare) - 1) > 0.0001) {
            return new Response(JSON.stringify({ error: "artistShare + labelShare must equal 1 (or 100%)." }), { status: 400 });
        }

        const splitValidation = validateAndNormalizeSplits(splits);
        if (splitValidation.error) {
            return new Response(JSON.stringify({ error: splitValidation.error }), { status: 400 });
        }

        const storedNotes = embedContractMetaInNotes(notes, contractDetails);

        // Validation: Needs (Artist ID OR PrimaryName) AND (ReleaseID OR Title OR DemoID)
        if ((!artistId && !primaryArtistName && !userId) || (!releaseId && !title && !demoId)) {
            return new Response(JSON.stringify({ error: "Missing required fields (Artist and Release/Title/Demo)" }), { status: 400 });
        }

        // Check availability
        let whereClause = {};
        if (releaseId) {
            whereClause = { releaseId };
            // If we have an artistId, check that. Fallback to userId
            if (artistId) whereClause.artistId = artistId;
            else if (userId) whereClause.userId = userId;
        } else if (title) {
            whereClause = { title };
            if (artistId) whereClause.artistId = artistId;
            else if (userId) whereClause.userId = userId;
        }

        // Check if contract already exists for this artist/release combo
        if ((artistId || userId) && releaseId) {
            const existing = await prisma.contract.findFirst({
                where: whereClause
            });
            if (existing) {
                return new Response(JSON.stringify({ error: "Contract already exists for this artist and release" }), { status: 400 });
            }
        }

        // Validating Demo Uniqueness explicitly
        if (demoId) {
            const existingDemoContract = await prisma.contract.findUnique({
                where: { demoId }
            });
            if (existingDemoContract) {
                return new Response(JSON.stringify({ error: "A contract already exists for this demo." }), { status: 400 });
            }
        }

        // Create the contract
        const contract = await prisma.contract.create({
            data: {
                releaseId: releaseId || null,
                title: title || null,
                demoId: demoId || null,
                artistId: artistId || null, // Link to Profile
                userId: userId || null,     // Fallback Link to User

                // Fallback text fields if no profile is used (though we should encourage profile creation)
                primaryArtistName: primaryArtistName || null,
                primaryArtistEmail: primaryArtistEmail || null,

                artistShare: normalizedArtistShare,
                labelShare: normalizedLabelShare,
                notes: storedNotes,
                status: status || 'active',
                pdfUrl,
                featuredArtists: featuredArtists ? JSON.stringify(featuredArtists) : null,
                splits: splitValidation.normalized ? {
                    create: splitValidation.normalized
                } : undefined
            },
            include: {
                user: { select: { id: true, email: true, stageName: true } },
                artist: true,
                release: true,
                splits: { include: { artist: true, user: true } } // Include artist/user details in response
            }
        });

        // Update Demo Status if this contract is linked to a Demo
        if (demoId) {
            await prisma.demo.update({
                where: { id: demoId },
                data: { status: 'contract_sent' }
            });
        }

        // Email notification removed as per user request

        return new Response(JSON.stringify(contract), { status: 201 });
    } catch (error) {
        console.error("Contract Create Error:", error);
        // Specialized error for Unique Constraint Violation (P2002)
        if (error.code === 'P2002') {
            return new Response(JSON.stringify({ error: "A contract with these unique details (Demo or Release) already exists." }), { status: 400 });
        }
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
// PATCH: Update a contract (Admin only)
export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, title, artistShare, labelShare, notes, status, pdfUrl, splits, featuredArtists, contractDetails } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: "Missing contract ID" }), { status: 400 });
        }

        const existingContract = await prisma.contract.findUnique({
            where: { id },
            select: { artistShare: true, labelShare: true, notes: true }
        });
        if (!existingContract) {
            return new Response(JSON.stringify({ error: "Contract not found" }), { status: 404 });
        }

        const normalizedArtistShare = normalizeShare(artistShare, existingContract.artistShare);
        const normalizedLabelShare = normalizeShare(labelShare, existingContract.labelShare);
        if (normalizedArtistShare === null || normalizedLabelShare === null) {
            return new Response(JSON.stringify({ error: "artistShare/labelShare must be between 0-1 or 0-100." }), { status: 400 });
        }
        if (Math.abs((normalizedArtistShare + normalizedLabelShare) - 1) > 0.0001) {
            return new Response(JSON.stringify({ error: "artistShare + labelShare must equal 1 (or 100%)." }), { status: 400 });
        }

        const splitValidation = validateAndNormalizeSplits(splits);
        if (splitValidation.error) {
            return new Response(JSON.stringify({ error: splitValidation.error }), { status: 400 });
        }

        // We only allow updating specific fields to avoid breaking relations easily
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (artistShare !== undefined) updateData.artistShare = normalizedArtistShare;
        if (labelShare !== undefined) updateData.labelShare = normalizedLabelShare;
        if (notes !== undefined || contractDetails !== undefined) {
            const { details: existingDetails } = extractContractMetaAndNotes(existingContract.notes || "");
            updateData.notes = embedContractMetaInNotes(
                notes !== undefined ? notes : extractContractMetaAndNotes(existingContract.notes || "").userNotes,
                contractDetails !== undefined ? { ...existingDetails, ...contractDetails } : existingDetails
            );
        }
        if (status !== undefined) updateData.status = status;
        if (pdfUrl !== undefined) updateData.pdfUrl = pdfUrl;
        if (featuredArtists !== undefined) updateData.featuredArtists = featuredArtists ? JSON.stringify(featuredArtists) : null;

        // If splits provided, replace them
        if (splits && Array.isArray(splits)) {
            updateData.splits = {
                deleteMany: {}, // Remove old splits
                create: splitValidation.normalized
            };
        }

        const contract = await prisma.contract.update({
            where: { id },
            data: updateData,
            include: {
                user: { select: { id: true, email: true, stageName: true } },
                artist: true,
                release: true,
                splits: { include: { artist: true, user: true } }
            }
        });

        return new Response(JSON.stringify(contract), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// DELETE: Remove a contract (Admin only)
export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'a&r')) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: "Missing contract ID" }), { status: 400 });
        }

        await prisma.contract.delete({
            where: { id }
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
