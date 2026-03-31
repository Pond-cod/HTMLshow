import { incrementSiteViews } from "@/lib/google/settings";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const count = await incrementSiteViews();
    return NextResponse.json({ success: true, count });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
