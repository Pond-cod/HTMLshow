import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/google/drive";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
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
