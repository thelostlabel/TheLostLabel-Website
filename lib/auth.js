import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { parsePermissions } from "@/lib/permissions";
import { linkUserToArtist } from "@/lib/userArtistLink";
import rateLimit from "@/lib/rate-limit";
import {
    buildRateLimitKey,
    hasMinimumPasswordLength,
    MIN_PASSWORD_LENGTH,
    normalizeEmail,
    passesRateLimit
} from "@/lib/security";

const DUMMY_PASSWORD_HASH = bcrypt.hashSync("lost-invalid-password", 10);
const TOKEN_SECURITY_VERSION = 1;
const loginRateLimiter = rateLimit({
    interval: 15 * 60 * 1000,
    uniqueTokenPerInterval: 5000
});
const registerRateLimiter = rateLimit({
    interval: 60 * 60 * 1000,
    uniqueTokenPerInterval: 3000
});

function buildSessionClaims(user) {
    if (!user) return null;

    return {
        id: user.id,
        email: user.email,
        name: user.stageName || user.artist?.name || user.email,
        role: user.role,
        permissions: user.permissions,
        spotifyUrl: user.spotifyUrl || user.artist?.spotifyUrl || null,
        stageName: user.stageName || user.artist?.name || null,
        status: user.status,
        image: user.artist?.image || null
    };
}

async function loadAuthoritativeUserClaims(userId) {
    if (!userId) return null;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            artist: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    spotifyUrl: true
                }
            }
        }
    });

    return buildSessionClaims(user);
}

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "LOST",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
                type: { label: "Type", type: "text" },
                fullName: { label: "Full Name", type: "text" },
                stageName: { label: "Stage Name", type: "text" },
            },
            async authorize(credentials, req) {
                try {
                    const email = normalizeEmail(credentials?.email);
                    const password = typeof credentials?.password === "string" ? credentials.password : "";
                    const isRegister = credentials?.type === "register";
                    const limiter = isRegister ? registerRateLimiter : loginRateLimiter;
                    const rateLimitKey = buildRateLimitKey(req, isRegister ? "register" : "login", email);

                    const allowed = await passesRateLimit(limiter, isRegister ? 6 : 12, rateLimitKey);
                    if (!allowed) {
                        throw new Error("TOO MANY ATTEMPTS");
                    }

                    if (!email || !password) {
                        throw new Error("INVALID EMAIL OR PASSWORD");
                    }

                    if (credentials.type === "register") {
                        // Check if registrations are open
                        const settings = await prisma.systemSettings.findFirst({ where: { id: "default" } });
                        if (settings && settings.config) {
                            const config = JSON.parse(settings.config);
                            if (config.registrationsOpen === false) {
                                throw new Error("REGISTRATIONS CLOSED");
                            }
                        }

                        if (!hasMinimumPasswordLength(password)) {
                            throw new Error(`PASSWORD MUST BE AT LEAST ${MIN_PASSWORD_LENGTH} CHARACTERS`);
                        }

                        const existingUser = await prisma.user.findUnique({
                            where: { email }
                        });

                        if (existingUser) {
                            throw new Error("USER ALREADY EXISTS");
                        }

                        const hashedPassword = await bcrypt.hash(password, 10);

                        const user = await prisma.user.create({
                            data: {
                                email,
                                password: hashedPassword,
                                fullName: credentials.fullName,
                                stageName: credentials.stageName,
                                role: 'artist',
                                status: 'pending' // New users start as pending
                            }
                        });

                        return {
                            id: user.id,
                            email: user.email,
                            name: user.stageName,
                            role: user.role,
                            status: user.status,
                            permissions: user.permissions
                        };
                    } else {
                        const user = await prisma.user.findUnique({
                            where: { email },
                            include: {
                                artist: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image: true,
                                        spotifyUrl: true
                                    }
                                }
                            }
                        });

                        if (!user) {
                            await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
                            throw new Error("INVALID EMAIL OR PASSWORD");
                        }

                        const isPasswordValid = await bcrypt.compare(password, user.password);

                        if (!isPasswordValid) {
                            throw new Error("INVALID EMAIL OR PASSWORD");
                        }

                        // These checks only run after password verification to avoid account-state enumeration.
                        if (!user.emailVerified) {
                            throw new Error("EMAIL NOT VERIFIED");
                        }

                        if (user.status !== 'approved' && user.role !== 'admin') {
                            throw new Error("ACCOUNT PENDING APPROVAL");
                        }

                        // Safety net: ensure approved artist accounts are linked before session starts
                        if (user.role === 'artist' && user.status === 'approved' && !user.artist?.id) {
                            await linkUserToArtist(user.id);
                        }

                        return buildSessionClaims(user);
                    }
                } catch (error) {
                    console.error("NextAuth authorize error:", error?.message || error);
                    throw error;
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (trigger === "update") {
                const refreshed = await loadAuthoritativeUserClaims(token.id);
                if (refreshed) {
                    token.email = refreshed.email;
                    token.name = refreshed.name;
                    token.role = refreshed.role;
                    token.id = refreshed.id;
                    token.permissions = refreshed.permissions;
                    token.spotifyUrl = refreshed.spotifyUrl;
                    token.stageName = refreshed.stageName;
                    token.status = refreshed.status;
                    token.image = refreshed.image;
                }
                token.secureVersion = TOKEN_SECURITY_VERSION;

                return token;
            }

            if (user) {
                token.email = user.email;
                token.name = user.name;
                token.role = user.role;
                token.id = user.id;
                token.permissions = user.permissions;
                token.spotifyUrl = user.spotifyUrl;
                token.stageName = user.stageName;
                token.status = user.status;
                token.image = user.image || token.image || null;
                token.secureVersion = TOKEN_SECURITY_VERSION;
                return token;
            }

            if (token?.id && token.secureVersion !== TOKEN_SECURITY_VERSION) {
                const refreshed = await loadAuthoritativeUserClaims(token.id);
                if (refreshed) {
                    token.email = refreshed.email;
                    token.name = refreshed.name;
                    token.role = refreshed.role;
                    token.id = refreshed.id;
                    token.permissions = refreshed.permissions;
                    token.spotifyUrl = refreshed.spotifyUrl;
                    token.stageName = refreshed.stageName;
                    token.status = refreshed.status;
                    token.image = refreshed.image;
                }
                token.secureVersion = TOKEN_SECURITY_VERSION;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.secureVersion = token.secureVersion;
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.spotifyUrl = token.spotifyUrl;
                session.user.stageName = token.stageName || token.name;
                session.user.status = token.status;
                session.user.image = token.image || session.user.image || null;
                session.user.email = token.email || session.user.email;

                session.user.permissions = parsePermissions(token.permissions);
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/login',
        error: '/auth/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
};
