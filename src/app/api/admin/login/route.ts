import { NextRequest, NextResponse } from "next/server";
import { setLoginSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      await setLoginSession();
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
