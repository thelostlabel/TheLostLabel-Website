import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ApiErrorResponse } from "@/types/api";
import type { ContractProfilePatchInput } from "@/types/profile";

const contractProfilePatchSchema = z.object({
  legalName: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
}).strict();

function errorResponse(status: number, error: string) {
  return NextResponse.json({ error } satisfies ApiErrorResponse, { status });
}

function normalizeOptionalString(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return errorResponse(401, "Unauthorized");
  }

  try {
    const body = await req.json().catch(() => null);
    const parsedBody = contractProfilePatchSchema.safeParse(body);
    if (!parsedBody.success) {
      return errorResponse(400, "Invalid profile payload");
    }

    const data = parsedBody.data as ContractProfilePatchInput;
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        legalName: normalizeOptionalString(data.legalName),
        phoneNumber: normalizeOptionalString(data.phoneNumber),
        address: normalizeOptionalString(data.address),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return errorResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}
