import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    user: session.user,
    role: session.role
  });
}
