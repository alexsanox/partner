import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { sendTicketReplyEmail } from "@/lib/email";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isAdmin = session.user.role === "ADMIN";

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          ticket: false,
        },
      },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(ticket);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isAdmin = session.user.role === "ADMIN";

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ticket.status === "CLOSED") {
    return NextResponse.json({ error: "Ticket is closed" }, { status: 400 });
  }

  const body = await req.json();
  const { message } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      authorId: session.user.id,
      content: message.trim(),
      isStaff: isAdmin,
    },
  });

  // Update ticket status based on who replied
  const newStatus = isAdmin ? "WAITING_REPLY" : "OPEN";
  await prisma.supportTicket.update({
    where: { id },
    data: { status: newStatus },
  });

  // Email the user when staff replies
  if (isAdmin) {
    sendTicketReplyEmail(ticket.user.email, {
      ticketId: id,
      subject: ticket.subject,
      message: message.trim(),
    }).catch((e) => console.error("[tickets] Reply email failed:", e));
  }

  return NextResponse.json({ success: true });
}
