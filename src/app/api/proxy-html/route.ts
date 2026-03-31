import { NextRequest, NextResponse } from "next/server";
import { getFileContent } from "@/lib/google/drive";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing ID", { status: 400 });
  }

  try {
    const htmlContent = await getFileContent(id);
    
    if (!htmlContent) {
      return new NextResponse("File not found or empty", { status: 404 });
    }

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Additional security headers since we are rendering generic HTML
        "Content-Security-Policy": "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
        "X-Content-Type-Options": "nosniff"
      },
    });
  } catch (error: any) {
    return new NextResponse(`Error fetching HTML content from Drive: ${error.message || ''}`, { status: 500 });
  }
}
