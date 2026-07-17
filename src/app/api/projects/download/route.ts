import { NextRequest, NextResponse } from "next/server";
import { incrementProjectDownloads, logDownloadEvent } from "@/lib/google/sheets";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, message: "Missing project ID" }, { status: 400 });
    }

    const count = await incrementProjectDownloads(id);
    
    // Extract IP address from request headers or NextRequest
    const ipAddress = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || request.ip || "127.0.0.1";
    
    // Log the download event in the background / sheets
    await logDownloadEvent(id, ipAddress);
    
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
