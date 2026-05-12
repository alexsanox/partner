import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return null;
  }
  return session;
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { userId, action } = body;

  if (!userId || !action) {
    return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
  }

  try {
    switch (action) {
      case "toggleRole": {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (user.id === session.user.id) {
          return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
        }
        const newRole = user.role === "admin" ? "user" : "admin";
        await prisma.user.update({ where: { id: userId }, data: { role: newRole } });
        return NextResponse.json({ success: true, role: newRole });
      }
      case "deleteUser": {
        if (userId === session.user.id) {
          return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
        }
        await prisma.user.delete({ where: { id: userId } });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin user action failed:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
