import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  try {
    const response = await auth.api.impersonateUser({
      body: { userId },
      headers: await headers(),
    });
    return NextResponse.json(response);
  } catch (e) {
    console.error("[impersonate] failed:", e);
    return NextResponse.json({ error: "Impersonation failed" }, { status: 500 });
  }
}
