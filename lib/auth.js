import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { linkUserToArtist } from "@/lib/userArtistLink";

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
            async authorize(credentials) {
                if (credentials.type === "register") {
                    // Check if registrations are open
                    const settings = await prisma.systemSettings.findFirst({ where: { id: "default" } });
                    if (settings && settings.config) {
                        const config = JSON.parse(settings.config);
                        if (config.registrationsOpen === false) {
                            throw new Error("REGISTRATIONS CLOSED");
                        }
                    }

                    const existingUser = await prisma.user.findUnique({
                        where: { email: credentials.email }
                    });

                    if (existingUser) {
                        throw new Error("USER ALREADY EXISTS");
                    }

                    const hashedPassword = await bcrypt.hash(credentials.password, 10);

                    const user = await prisma.user.create({
                        data: {
                            email: credentials.email,
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
                        where: { email: credentials.email },
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
                        throw new Error("INVALID EMAIL OR PASSWORD");
                    }

                    // Check if account is approved
                    if (user.status !== 'approved' && user.role !== 'admin') {
                        throw new Error("ACCOUNT PENDING APPROVAL");
                    }

                    // Check if email is verified
                    if (!user.emailVerified) {
                        throw new Error("EMAIL NOT VERIFIED");
                    }

                    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                    if (!isPasswordValid) {
                        throw new Error("INVALID EMAIL OR PASSWORD");
                    }

                    // Safety net: ensure approved artist accounts are linked before session starts
                    if (user.role === 'artist' && user.status === 'approved' && !user.artist?.id) {
                        await linkUserToArtist(user.id);
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.stageName || user.artist?.name,
                        role: user.role,
                        permissions: user.permissions,
                        spotifyUrl: user.spotifyUrl || user.artist?.spotifyUrl,
                        stageName: user.stageName || user.artist?.name,
                        status: user.status,
                        image: user.artist?.image || null
                    };
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
            if (trigger === "update" && session?.user) {
                // Allow updating session data from client
                return { ...token, ...session.user };
            }
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.permissions = user.permissions;
                token.spotifyUrl = user.spotifyUrl;
                token.stageName = user.stageName;
                token.status = user.status;
                token.image = user.image || token.image || null;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.spotifyUrl = token.spotifyUrl;
                session.user.stageName = token.stageName || token.name;
                session.user.status = token.status;
                session.user.image = token.image || session.user.image || null;

                // Parse permissions into a usable object
                try {
                    if (!token.permissions) {
                        session.user.permissions = {};
                    } else if (typeof token.permissions === "string") {
                        session.user.permissions = JSON.parse(token.permissions);
                    } else {
                        session.user.permissions = token.permissions;
                    }
                } catch (e) {
                    session.user.permissions = {};
                }
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
