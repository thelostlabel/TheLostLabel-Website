import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
        const { releaseId, title, demoId, artistId, userId, primaryArtistName, primaryArtistEmail, artistShare, labelShare, notes, status, pdfUrl, splits, featuredArtists } = body;

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

                artistShare: !isNaN(parseFloat(artistShare)) ? parseFloat(artistShare) : 0.7,
                labelShare: !isNaN(parseFloat(labelShare)) ? parseFloat(labelShare) : 0.3,
                notes,
                status: status || 'active',
                pdfUrl,
                featuredArtists: featuredArtists ? JSON.stringify(featuredArtists) : null,
                splits: splits ? {
                    create: splits.map(s => ({
                        name: s.name,
                        email: s.email || null,
                        percentage: !isNaN(parseFloat(s.percentage)) ? parseFloat(s.percentage) : 0,
                        userId: s.userId || null,
                        artistId: s.artistId || null
                    }))
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
        const { id, title, artistShare, labelShare, notes, status, pdfUrl, splits, featuredArtists } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: "Missing contract ID" }), { status: 400 });
        }

        // We only allow updating specific fields to avoid breaking relations easily
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (artistShare !== undefined) updateData.artistShare = parseFloat(artistShare);
        if (labelShare !== undefined) updateData.labelShare = parseFloat(labelShare);
        if (notes !== undefined) updateData.notes = notes;
        if (status !== undefined) updateData.status = status;
        if (pdfUrl !== undefined) updateData.pdfUrl = pdfUrl;
        if (featuredArtists !== undefined) updateData.featuredArtists = featuredArtists ? JSON.stringify(featuredArtists) : null;

        // If splits provided, replace them
        if (splits && Array.isArray(splits)) {
            updateData.splits = {
                deleteMany: {}, // Remove old splits
                create: splits.map(s => ({
                    name: s.name,
                    email: s.email || null,
                    percentage: parsePercentage(s.percentage),
                    userId: s.userId || null,
                    artistId: s.artistId || null
                }))
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

// Helper for safe percentage parsing
function parsePercentage(val) {
    const p = parseFloat(val);
    return isNaN(p) ? 0 : p;
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
