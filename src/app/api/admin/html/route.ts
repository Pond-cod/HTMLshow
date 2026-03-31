import { NextRequest, NextResponse } from "next/server";
import { getFileContent, updateFileContent } from "@/lib/google/drive";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, message: "Missing ID" }, { status: 400 });
  }

  try {
    const content = await getFileContent(id);
    return new NextResponse(content, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: `Error fetching internal HTML: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, content } = await request.json();
    if (!id || typeof content !== "string") {
      return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
    }

    const ok = await updateFileContent(id, content);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: `Error updating internal HTML: ${error.message}` }, { status: 500 });
  }
}
