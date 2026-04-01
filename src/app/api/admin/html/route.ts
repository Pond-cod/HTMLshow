import { NextRequest, NextResponse } from "next/server";
import { getFileContent, updateFileContent } from "@/lib/google/drive";
import { getHtmlContentById, updateHtmlContent } from "@/lib/google/sheets";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, message: "Missing ID" }, { status: 400 });
  }

  try {
    // Try to get from Google Sheets first
    let content = await getHtmlContentById(id);
    
    // Fallback to Google Drive if not found in sheets
    if (!content) {
      console.log(`HTML for ${id} not found in Sheets, falling back to Drive`);
      try {
        content = await getFileContent(id);
      } catch (driveError: any) {
        throw new Error(`Not found in Sheets, and Drive fallback failed: ${driveError.message}`);
      }
    }

    return new NextResponse(content || "", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: `Error fetching HTML: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, content } = await request.json();
    if (!id || typeof content !== "string") {
      return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
    }

    // Always update to Google Sheets now
    const ok = await updateHtmlContent(id, content);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: `Error updating HTML: ${error.message}` }, { status: 500 });
  }
}
