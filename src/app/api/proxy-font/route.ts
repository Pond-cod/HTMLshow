import { NextRequest, NextResponse } from "next/server";
import { getFileBuffer } from "@/lib/google/drive";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing ID", { status: 400 });
  }

  try {
    const buffer = await getFileBuffer(id);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "font/ttf",
        // Aggressively cache the font once requested to speed up client
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return new NextResponse(`Error fetching custom font data: ${error.message || ''}`, { status: 500 });
  }
}
