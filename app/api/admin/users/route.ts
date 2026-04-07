import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getDiscordLinkByUserId, enqueueRoleSync } from "@/lib/discord-bridge-service";
import { sendMail } from "@/lib/mail";
import { generateAccountApprovalEmail } from "@/lib/mail-templates";
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
import { buildOffsetPaginationMeta, parseOffsetPagination } from "@/lib/api-pagination";
import prisma from "@/lib/prisma";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/security";
import { linkUserToArtist } from "@/lib/userArtistLink";
import type { ApiErrorResponse } from "@/types/api";
import { logAuditEvent, getClientIp, getClientUserAgent } from "@/lib/audit-log";
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
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !canViewUsers(session.user)) {
    return errorResponse(401, "Unauthorized");
  }

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parseOffsetPagination(searchParams, { defaultLimit: 50, maxLimit: 100 });
    const where = {
      email: {
        not: DELETED_USER_EMAIL,
      },
    } satisfies Prisma.UserWhereInput;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: USER_LIST_SELECT,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: buildOffsetPaginationMeta(total, page, limit),
    });
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
        const loginLink = `${process.env.NEXTAUTH_URL}/auth/login`;
        let verificationLink: string | null = null;

        if (!updatedUser.emailVerified) {
          const verificationToken = generateOpaqueToken();
          const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

          await prisma.user.update({
            where: { id: userId },
            data: {
              verificationToken: hashOpaqueToken(verificationToken),
              verificationTokenExpiry,
            },
          });

          verificationLink = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`;
        }

        await sendMail({
          to: updatedUser.email,
          subject: "Your Account Has Been Approved | LOST.",
          html: generateAccountApprovalEmail(loginLink, verificationLink),
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

    logAuditEvent({
      userId: session.user.id,
      action: "update",
      entity: "user",
      entityId: userId,
      details: JSON.stringify({
        changes: Object.keys(updateData),
        ...(role !== undefined ? { newRole: role } : {}),
        ...(status !== undefined ? { newStatus: status } : {}),
      }),
      ipAddress: getClientIp(req) || undefined,
      userAgent: getClientUserAgent(req) || undefined,
    });

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

    logAuditEvent({
      userId: session.user.id,
      action: "delete",
      entity: "user",
      entityId: userId,
      details: JSON.stringify({ email: existingUser.email }),
      ipAddress: getClientIp(req) || undefined,
      userAgent: getClientUserAgent(req) || undefined,
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
