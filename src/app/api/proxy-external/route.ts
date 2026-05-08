import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing URL parameter", { status: 400 });
  }

  try {
    // Validate URL
    const parsedUrl = new URL(url);
    
    // Fetch the external page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,th;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return new NextResponse(
        `<div style="font-family: sans-serif; padding: 40px; text-align: center; color: #888;">
          <h2>Could not load external content</h2>
          <p>Status: ${response.status} ${response.statusText}</p>
        </div>`,
        { status: response.status, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    let html = await response.text();

    // Get the base URL for resolving relative paths
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

    // Add a <base> tag so relative resources load correctly from the original domain
    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head><base href="${baseUrl}/" />`);
    } else if (html.includes("<HEAD>")) {
      html = html.replace("<HEAD>", `<HEAD><base href="${baseUrl}/" />`);
    } else {
      // If no <head> tag, prepend base tag
      html = `<base href="${baseUrl}/" />\n${html}`;
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "Content-Security-Policy": "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    return new NextResponse(
      `<div style="font-family: sans-serif; padding: 40px; text-align: center; color: #888;">
        <h2>Error loading external content</h2>
        <p>${error.message || "Unknown error"}</p>
      </div>`,
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
