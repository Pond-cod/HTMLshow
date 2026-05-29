import { NextRequest, NextResponse } from "next/server";
import { reorderProject } from "@/lib/google/sheets";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id, direction } = await request.json();
    if (!id || !direction) {
      return NextResponse.json({ success: false, message: "Missing id or direction" }, { status: 400 });
    }

    if (direction !== "up" && direction !== "down") {
      return NextResponse.json({ success: false, message: "Invalid direction" }, { status: 400 });
    }

    const ok = await reorderProject(id, direction);
    if (ok) {
      revalidatePath("/", "layout");
    }
    
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    console.error("Error reordering project:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error reordering project" },
      { status: 500 }
    );
  }
}
