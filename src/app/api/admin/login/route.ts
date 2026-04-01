import { NextRequest, NextResponse } from "next/server";
import { setLoginSession } from "@/lib/auth";
import { getAllUsers } from "@/lib/google/sheets";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    // Auto-create initial sheet or fetch existing users
    const users = await getAllUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      await setLoginSession(user);
      return NextResponse.json({ success: true, role: user.role });
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
