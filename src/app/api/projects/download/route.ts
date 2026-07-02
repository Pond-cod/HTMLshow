import { NextRequest, NextResponse } from "next/server";
import { incrementProjectDownloads } from "@/lib/google/sheets";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, message: "Missing project ID" }, { status: 400 });
    }

    const count = await incrementProjectDownloads(id);
    
    // Invalidate main landing page and project page caches
    revalidatePath("/", "layout");
    revalidatePath(`/project/${id}`);
    
    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error("Error incrementing project downloads:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
