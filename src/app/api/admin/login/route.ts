import { NextRequest, NextResponse } from "next/server";
import { setLoginSession } from "@/lib/auth";
import { getAllUsers } from "@/lib/google/sheets";
import { verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    // Auto-create initial sheet or fetch existing users
    const users = await getAllUsers();
    // Find user by username first, then verify password (supports both hashed and legacy plain-text)
    const userRecord = users.find(u => u.username === username);
    if (userRecord && await verifyPassword(password, userRecord.password)) {
      await setLoginSession(userRecord);
      return NextResponse.json({ success: true, role: userRecord.role });
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
