import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
                            role: 'artist'
                        }
                    });

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.stageName,
                        role: user.role,
                        permissions: user.permissions
                    };
                } else {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email }
                    });

                    if (!user) {
                        throw new Error("INVALID EMAIL OR PASSWORD");
                    }

                    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                    if (!isPasswordValid) {
                        throw new Error("INVALID EMAIL OR PASSWORD");
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.stageName,
                        role: user.role,
                        permissions: user.permissions,
                        spotifyUrl: user.spotifyUrl,
                        stageName: user.stageName
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
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.spotifyUrl = token.spotifyUrl;
                session.user.stageName = token.stageName || token.name;

                // Parse permissions into a usable object
                try {
                    session.user.permissions = token.permissions ? JSON.parse(token.permissions) : {};
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
