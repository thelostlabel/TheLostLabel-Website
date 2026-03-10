import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";

import { changePasswordBodySchema } from "@/lib/auth-schemas";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasMinimumPasswordLength, MIN_PASSWORD_LENGTH } from "@/lib/security";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsedBody = changePasswordBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const { currentPassword, newPassword } = parsedBody.data;

    if (!currentPassword || !newPassword) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    if (!hasMinimumPasswordLength(newPassword)) {
      return new Response(JSON.stringify({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` }), { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    if (!user.password) {
      return new Response(JSON.stringify({ error: "No password set for this account. Possibly social login." }), { status: 400 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Current password is incorrect" }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return new Response(JSON.stringify({ message: "Password updated successfully" }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to change password" }), { status: 500 });
  }
}
