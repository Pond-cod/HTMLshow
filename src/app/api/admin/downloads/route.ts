import { NextRequest, NextResponse } from "next/server";
import { getAllDownloads } from "@/lib/google/sheets";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const downloads = await getAllDownloads();
    // Sort downloads by timestamp descending (newest first)
    const sortedDownloads = downloads.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    return NextResponse.json(sortedDownloads);
  } catch (error: any) {
    console.error("Error fetching downloads:", error);
    return NextResponse.json({ error: "Failed to fetch downloads" }, { status: 500 });
  }
}
