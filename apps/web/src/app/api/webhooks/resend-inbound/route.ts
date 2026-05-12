import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Resend sends inbound emails as multipart/form-data POST
// Docs: https://resend.com/docs/dashboard/domains/inbound-emails

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    let to = "";
    let from = "";
    let text = "";
    let html = "";
    let subject = "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      to = body.to ?? "";
      from = body.from ?? "";
      text = body.text ?? "";
      html = body.html ?? "";
      subject = body.subject ?? "";
    } else {
      // multipart/form-data
      const form = await req.formData();
      to = String(form.get("to") ?? "");
      from = String(form.get("from") ?? "");
      text = String(form.get("text") ?? "");
      html = String(form.get("html") ?? "");
      subject = String(form.get("subject") ?? "");
    }

    // Extract ticket ID from the to address: support+ticket-{id}@domain.com
    // "to" may be like: "Support <support+ticket-abc123@example.com>" or just the address
    const toAddress = to.includes("<") ? to.split("<")[1].replace(">", "").trim() : to.trim();
    const match = toAddress.match(/\+ticket-([^@]+)@/);
    if (!match) {
      return NextResponse.json({ error: "No ticket ID in address" }, { status: 200 });
    }
    const ticketId = match[1];

    // Find the ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 200 });
    }
    if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
      return NextResponse.json({ error: "Ticket is closed" }, { status: 200 });
    }

    // Verify sender is the ticket owner (compare email)
    const senderEmail = from.includes("<")
      ? from.split("<")[1].replace(">", "").trim().toLowerCase()
      : from.trim().toLowerCase();

    if (senderEmail !== ticket.user.email.toLowerCase()) {
      return NextResponse.json({ error: "Sender mismatch" }, { status: 200 });
    }

    // Extract clean reply text — strip quoted history (lines starting with ">")
    const rawText = text || html.replace(/<[^>]+>/g, "").trim();
    const cleanMessage = rawText
      .split("\n")
      .filter((line) => !line.trimStart().startsWith(">") && line.trim() !== "")
      .join("\n")
      .trim();

    if (!cleanMessage) {
      return NextResponse.json({ error: "Empty message" }, { status: 200 });
    }

    // Create the message as the ticket owner
    await prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId: ticket.user.id,
        content: cleanMessage,
        isStaff: false,
      },
    });

    // Update ticket status back to OPEN (user replied)
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "OPEN", updatedAt: new Date() },
    });

    console.log(`[inbound] Reply from ${senderEmail} on ticket ${ticketId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[inbound] Error processing inbound email:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
