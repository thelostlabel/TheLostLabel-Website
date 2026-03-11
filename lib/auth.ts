import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { type SessionClaims, type AuthCredentials, type AppRole, type AppUserStatus } from "@/lib/auth-types";
import { parsePermissions } from "@/lib/permissions";
import rateLimit from "@/lib/rate-limit";
import {
  buildRateLimitKey,
  hasMinimumPasswordLength,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  passesRateLimit,
} from "@/lib/security";
import { normalizeSystemSettingsConfig, parseSystemSettingsConfig } from "@/lib/system-settings";
import { linkUserToArtist } from "@/lib/userArtistLink";

const DUMMY_PASSWORD_HASH = bcrypt.hashSync("lost-invalid-password", 10);
const TOKEN_SECURITY_VERSION = 1;

const ARTIST_SESSION_SELECT = {
  id: true,
  name: true,
  image: true,
  spotifyUrl: true,
} satisfies Prisma.ArtistSelect;

const loginRateLimiter = rateLimit({
  interval: 15 * 60 * 1000,
  uniqueTokenPerInterval: 5000,
});

const registerRateLimiter = rateLimit({
  interval: 60 * 60 * 1000,
  uniqueTokenPerInterval: 3000,
});

type UserWithArtist = Prisma.UserGetPayload<{
  include: {
    artist: {
      select: typeof ARTIST_SESSION_SELECT;
    };
  };
}>;

function buildSessionClaims(user: UserWithArtist | null): SessionClaims | null {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.stageName || user.artist?.name || user.email,
    role: user.role,
    permissions: user.permissions ?? null,
    spotifyUrl: user.spotifyUrl || user.artist?.spotifyUrl || null,
    stageName: user.stageName || user.artist?.name || null,
    status: user.status,
    image: user.artist?.image || null,
  };
}

function applyClaimsToToken(token: JWT, claims: SessionClaims): JWT {
  token.email = claims.email;
  token.name = claims.name;
  token.role = claims.role;
  token.id = claims.id;
  token.permissions = claims.permissions;
  token.spotifyUrl = claims.spotifyUrl;
  token.stageName = claims.stageName;
  token.status = claims.status;
  token.image = claims.image;
  token.secureVersion = TOKEN_SECURITY_VERSION;

  return token;
}

async function loadAuthoritativeUserClaims(userId?: string | null): Promise<SessionClaims | null> {
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      artist: {
        select: ARTIST_SESSION_SELECT,
      },
    },
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
      async authorize(rawCredentials, req) {
        try {
          const credentials = (rawCredentials ?? {}) as AuthCredentials;
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

          if (credentials?.type === "register") {
            const settings = await prisma.systemSettings.findFirst({ where: { id: "default" } });
            const config = normalizeSystemSettingsConfig(parseSystemSettingsConfig(settings?.config ?? null));
            if (config.registrationsOpen === false) {
              throw new Error("REGISTRATIONS CLOSED");
            }

            if (!hasMinimumPasswordLength(password)) {
              throw new Error(`PASSWORD MUST BE AT LEAST ${MIN_PASSWORD_LENGTH} CHARACTERS`);
            }

            const existingUser = await prisma.user.findUnique({
              where: { email },
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
                role: "artist",
                status: "pending",
              },
            });

            return {
              id: user.id,
              email: user.email,
              name: user.stageName || user.email,
              role: user.role,
              status: user.status,
              permissions: user.permissions ?? null,
              spotifyUrl: user.spotifyUrl ?? null,
              stageName: user.stageName ?? null,
              image: null,
            };
          }

          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              artist: {
                select: ARTIST_SESSION_SELECT,
              },
            },
          });

          if (!user) {
            await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
            throw new Error("INVALID EMAIL OR PASSWORD");
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            throw new Error("INVALID EMAIL OR PASSWORD");
          }

          if (!user.emailVerified) {
            throw new Error("EMAIL NOT VERIFIED");
          }

          if (user.status !== "approved" && user.role !== "admin") {
            throw new Error("ACCOUNT PENDING APPROVAL");
          }

          if (user.role === "artist" && user.status === "approved" && !user.artist?.id) {
            await linkUserToArtist(user.id);
          }

          return buildSessionClaims(user);
        } catch (error) {
          console.error("NextAuth authorize error:", error instanceof Error ? error.message : error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (trigger === "update") {
        const refreshed = await loadAuthoritativeUserClaims(token.id);
        if (refreshed) {
          return applyClaimsToToken(token, refreshed);
        }
        token.secureVersion = TOKEN_SECURITY_VERSION;
        return token;
      }

      if (user) {
        const authUser = user as Partial<SessionClaims> & {
          id?: string;
          email?: string | null;
          name?: string | null;
          image?: string | null;
          role?: AppRole;
          status?: AppUserStatus;
        };

        return applyClaimsToToken(token, {
          id: authUser.id ?? "",
          email: authUser.email ?? "",
          name: authUser.name ?? null,
          role: authUser.role ?? "artist",
          permissions: authUser.permissions ?? null,
          spotifyUrl: authUser.spotifyUrl ?? null,
          stageName: authUser.stageName ?? null,
          status: authUser.status ?? "pending",
          image: authUser.image ?? null,
        });
      }

      if (token.id && token.secureVersion !== TOKEN_SECURITY_VERSION) {
        const refreshed = await loadAuthoritativeUserClaims(token.id);
        if (refreshed) {
          return applyClaimsToToken(token, refreshed);
        }
        token.secureVersion = TOKEN_SECURITY_VERSION;
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.secureVersion = token.secureVersion;
        session.user.role = token.role ?? "artist";
        session.user.id = token.id ?? "";
        session.user.spotifyUrl = token.spotifyUrl ?? null;
        session.user.stageName = token.stageName || token.name || null;
        session.user.status = token.status ?? "pending";
        session.user.image = token.image || session.user.image || null;
        session.user.email = token.email || session.user.email || "";
        session.user.name = token.name || session.user.name || null;
        session.user.permissions = parsePermissions(token.permissions);
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  url: process.env.NEXTAUTH_URL || "http://localhost:3000",
} satisfies NextAuthOptions & { url?: string };
