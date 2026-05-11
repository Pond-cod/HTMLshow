import { NextRequest, NextResponse } from "next/server";
import { getFileContent } from "@/lib/google/drive";
import { getHtmlContentById } from "@/lib/google/sheets";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing ID", { status: 400 });
  }

  try {
    // Try to fetch HTML from Google Sheets first
    let htmlContent = await getHtmlContentById(id);
    
    // Fallback to Google Drive if not found in sheets
    if (!htmlContent) {
      console.log(`Proxy HTML for ${id} not found in Sheets, falling back to Drive`);
      try {
        htmlContent = await getFileContent(id);
      } catch (driveError: any) {
        console.warn(`Drive fallback failed for ${id}: ${driveError.message}`);
        htmlContent = null;
      }
    }

    if (!htmlContent) {
      return new NextResponse(`
        <div style="font-family: sans-serif; padding: 40px; text-align: center; color: #888;">
          <h2>Content Not Found</h2>
          <p>The HTML for this project is missing or could not be loaded.</p>
        </div>
      `, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // Detect if the htmlContent is just a raw URL (e.g. user pasted a link into the code editor)
    const trimmedContent = htmlContent.trim();
    if (/^https?:\/\/[^\s]+$/.test(trimmedContent)) {
      return NextResponse.redirect(new URL(trimmedContent));
    }

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        // Additional security headers since we are rendering generic HTML
        "Content-Security-Policy": "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
        "X-Content-Type-Options": "nosniff"
      },
    });
  } catch (error: any) {
    return new NextResponse(`Error fetching HTML content: ${error.message || ''}`, { status: 500 });
  }
}
