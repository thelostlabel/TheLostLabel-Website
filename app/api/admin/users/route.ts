import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getDiscordLinkByUserId, enqueueRoleSync } from "@/lib/discord-bridge-service";
import { sendMail } from "@/lib/mail";
import {
  canDeleteUsers,
  canEditUsers,
  canManageUserPermissions,
  canManageUserRoles,
  canManageUserStatus,
  canViewUsers,
  parsePermissions,
  stringifyPermissions,
} from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { linkUserToArtist } from "@/lib/userArtistLink";
import type { ApiErrorResponse } from "@/types/api";
import type { AdminUserUpdateInput } from "@/types/admin";

const ADMIN_USER_ROLE_VALUES = ["artist", "a&r", "admin"] as const;
const ADMIN_USER_STATUS_VALUES = ["pending", "approved", "rejected"] as const;

const USER_LIST_SELECT = {
  id: true,
  email: true,
  fullName: true,
  stageName: true,
  spotifyUrl: true,
  monthlyListeners: true,
  role: true,
  status: true,
  permissions: true,
  emailVerified: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const adminUserUpdateSchema = z.object({
  userId: z.string().min(1),
  email: z.string().optional(),
  fullName: z.string().nullable().optional(),
  stageName: z.string().nullable().optional(),
  spotifyUrl: z.string().nullable().optional(),
  role: z.enum(ADMIN_USER_ROLE_VALUES).optional(),
  status: z.enum(ADMIN_USER_STATUS_VALUES).optional(),
  permissions: z.union([z.string(), z.record(z.string(), z.boolean()), z.null()]).optional(),
}).strict();

type BasicUserSnapshot = {
  id: string;
  email: string;
  role: string;
  status: string;
};

const DELETED_USER_EMAIL = "deleted-user@system.local";
const DELETED_USER_STAGE_NAME = "DELETED USER";

function errorResponse(status: number, error: string) {
  return NextResponse.json({ error } satisfies ApiErrorResponse, { status });
}

function normalizeOptionalString(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeEmail(value: string | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value.trim().toLowerCase();
  return trimmed || undefined;
}

async function getBasicUserSnapshot(userId: string): Promise<BasicUserSnapshot | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
    },
  });
}

// GET: Fetch all users (Admin only)
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !canViewUsers(session.user)) {
    return errorResponse(401, "Unauthorized");
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        email: {
          not: DELETED_USER_EMAIL,
        },
      },
      orderBy: { createdAt: "desc" },
      select: USER_LIST_SELECT,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Fetch Users Error:", error);
    return errorResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}

// PATCH: Update user details (Admin only)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return errorResponse(401, "Unauthorized");
  }

  try {
    const body = await req.json().catch(() => null);
    const parsedBody = adminUserUpdateSchema.safeParse(body);
    if (!parsedBody.success) {
      return errorResponse(400, "Invalid request body");
    }

    const { userId, email, fullName, stageName, spotifyUrl, role, status, permissions } = parsedBody.data as AdminUserUpdateInput;
    const canEditProfile = canEditUsers(session.user);
    const canManageStatus = canManageUserStatus(session.user);
    const canManageRoles = canManageUserRoles(session.user);
    const canManagePermissions = canManageUserPermissions(session.user);

    const oldUser = await getBasicUserSnapshot(userId);
    if (!oldUser) {
      return errorResponse(404, "User not found");
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (email !== undefined || fullName !== undefined || stageName !== undefined || spotifyUrl !== undefined) {
      if (!canEditProfile) {
        return errorResponse(403, "You do not have permission to edit user profiles.");
      }

      if (email !== undefined) updateData.email = normalizeEmail(email);
      if (fullName !== undefined) updateData.fullName = normalizeOptionalString(fullName);
      if (stageName !== undefined) updateData.stageName = normalizeOptionalString(stageName);
      if (spotifyUrl !== undefined) updateData.spotifyUrl = normalizeOptionalString(spotifyUrl);
    }

    if (status !== undefined) {
      if (!canManageStatus) {
        return errorResponse(403, "You do not have permission to change account status.");
      }

      updateData.status = status;
    }

    if (role !== undefined) {
      if (!canManageRoles) {
        return errorResponse(403, "You do not have permission to change roles.");
      }

      updateData.role = role;
    }

    if (permissions !== undefined) {
      if (!canManagePermissions) {
        return errorResponse(403, "You do not have permission to edit permissions.");
      }

      updateData.permissions = stringifyPermissions(parsePermissions(permissions));
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse(400, "No allowed changes provided");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: USER_LIST_SELECT,
    });

    if ((role !== undefined && oldUser.role !== updatedUser.role) || (status !== undefined && oldUser.status !== updatedUser.status)) {
      try {
        const discordLink = await getDiscordLinkByUserId(userId);
        if (discordLink?.discord_user_id) {
          await enqueueRoleSync({
            userId,
            discordUserId: discordLink.discord_user_id,
            role: updatedUser.role,
            guildId: discordLink.guild_id || null,
          });
        }
      } catch (roleSyncError) {
        console.error("[Users PATCH] Failed to enqueue role sync:", roleSyncError);
      }
    }

    if (status === "approved" && oldUser.status !== "approved") {
      try {
        await linkUserToArtist(userId);
      } catch (linkError) {
        console.error("[Users PATCH] Artist linking failed during approval:", linkError);
      }

      try {
        await sendMail({
          to: updatedUser.email,
          subject: "Your Account Has Been Approved | LOST.",
          html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0d10; color: #fff; padding: 32px; border-radius: 12px; border: 1px solid #1b1f24;">
                  <h1 style="color: #9ef01a; letter-spacing: 1px; margin: 0 0 16px 0;">Your Account Has Been Approved</h1>
                  <p style="font-size: 16px; line-height: 1.6;">
                      Your application to join LOST. has been approved. You can now sign in and start using your dashboard.
                  </p>
                  <div style="margin-top: 24px;">
                      <a href="${process.env.NEXTAUTH_URL}/auth/login" style="background: #ffffff; color: #111; padding: 12px 20px; text-decoration: none; font-weight: 700; border-radius: 8px; display: inline-block;">Sign In to Dashboard</a>
                  </div>
                  <p style="margin-top: 28px; color: #97a0ab; font-size: 12px;">
                      If this was not you, please contact our support team immediately.
                  </p>
              </div>
          `,
        });
      } catch (mailError) {
        console.error("[Users PATCH] Approval email failed:", mailError);
      }
    }

    if (updatedUser.status === "approved") {
      try {
        await linkUserToArtist(userId);
      } catch (linkError) {
        console.error("[Users PATCH] Artist relink failed:", linkError);
      }
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update User Error:", error);
    return errorResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}

// DELETE: Delete user (Admin only)
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !canDeleteUsers(session.user)) {
    return errorResponse(401, "Unauthorized");
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return errorResponse(400, "Missing user id");
    }

    if (userId === session.user.id) {
      return errorResponse(400, "Cannot delete yourself");
    }

    const existingUser = await getBasicUserSnapshot(userId);
    if (!existingUser) {
      return errorResponse(404, "User not found");
    }

    if (existingUser.email === DELETED_USER_EMAIL) {
      return errorResponse(400, "Cannot delete the system deleted-user placeholder");
    }

    await prisma.$transaction(async (tx) => {
      const deletedUserPlaceholder = await tx.user.upsert({
        where: { email: DELETED_USER_EMAIL },
        update: {
          stageName: DELETED_USER_STAGE_NAME,
          fullName: "Deleted User",
          role: "admin",
          status: "rejected",
          permissions: "{}",
        },
        create: {
          email: DELETED_USER_EMAIL,
          password: randomUUID(),
          fullName: "Deleted User",
          stageName: DELETED_USER_STAGE_NAME,
          role: "admin",
          status: "rejected",
          permissions: "{}",
        },
      });

      await tx.changeRequestComment.deleteMany({
        where: { userId },
      });

      await tx.changeRequest.updateMany({
        where: { assignedToId: userId },
        data: { assignedToId: null },
      });

      await tx.artist.updateMany({
        where: { userId },
        data: { userId: null },
      });

      await tx.contract.updateMany({
        where: { userId },
        data: { userId: null },
      });

      await tx.royaltySplit.updateMany({
        where: { userId },
        data: { userId: null },
      });

      await tx.balanceAdjustment.updateMany({
        where: { userId },
        data: { userId: null },
      });

      await tx.payment.updateMany({
        where: { userId },
        data: { userId: deletedUserPlaceholder.id },
      });

      await tx.balanceAdjustment.updateMany({
        where: { createdById: userId },
        data: { createdById: deletedUserPlaceholder.id },
      });

      await tx.$executeRaw`DELETE FROM "discord_account_links" WHERE "user_id" = ${userId}`;

      await tx.user.delete({
        where: { id: userId },
      });
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Delete User Error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return errorResponse(404, "User not found");
      }

      if (error.code === "P2003") {
        return errorResponse(409, "Cannot delete this user because related records still exist. Remove or reassign them first.");
      }
    }

    return errorResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}
