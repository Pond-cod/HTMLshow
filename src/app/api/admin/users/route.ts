import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, addUser, deleteUser, updateUser } from "@/lib/google/sheets";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

async function isAdmin() {
  const session = await getSession();
  return session?.role === 'admin';
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await getAllUsers();
  return NextResponse.json(users.map(u => ({ username: u.username, role: u.role })));
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const data = await request.json();
    // Hash the password before saving
    if (data.password) {
      data.password = await hashPassword(data.password);
    }
    const ok = await addUser(data);
    return NextResponse.json({ success: ok });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { oldUsername, username, role, password } = await request.json();
    // Hash the new password if one was provided
    const hashedPassword = password ? await hashPassword(password) : undefined;
    const ok = await updateUser(oldUsername || username, { username, role, password: hashedPassword });
    return NextResponse.json({ success: ok });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { username } = await request.json();
    const ok = await deleteUser(username);
    return NextResponse.json({ success: ok });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
