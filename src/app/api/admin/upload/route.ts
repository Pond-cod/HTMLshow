import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/google/drive";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    // Limit file size to 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, message: `File too large. Maximum size is 10MB. (Current: ${(file.size / 1024 / 1024).toFixed(1)}MB)` }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // We upload to the shared folder to bypass Service Account workspace quota limits
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const result = await uploadFile(file.name, file.type, buffer, folderId);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Upload error details:", error.message || error);
    return NextResponse.json(
      { success: false, message: `Upload error: ${error.message || "Unknown error"}` }, 
      { status: 500 }
    );
  }
}
