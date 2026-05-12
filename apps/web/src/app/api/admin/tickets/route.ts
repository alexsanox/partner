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
  const { ticketId, action, message } = body;

  if (!ticketId || !action) {
    return NextResponse.json({ error: "Missing ticketId or action" }, { status: 400 });
  }

  try {
    switch (action) {
      case "close": {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: "CLOSED", closedAt: new Date() },
        });
        return NextResponse.json({ success: true });
      }
      case "resolve": {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: "RESOLVED", closedAt: new Date() },
        });
        return NextResponse.json({ success: true });
      }
      case "reopen": {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: "OPEN", closedAt: null },
        });
        return NextResponse.json({ success: true });
      }
      case "in_progress": {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: "IN_PROGRESS" },
        });
        return NextResponse.json({ success: true });
      }
      case "reply": {
        if (!message) {
          return NextResponse.json({ error: "Message required" }, { status: 400 });
        }
        await prisma.ticketMessage.create({
          data: {
            ticketId,
            authorId: session.user.id,
            content: message,
            isStaff: true,
          },
        });
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: "WAITING_REPLY" },
        });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin ticket action failed:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
