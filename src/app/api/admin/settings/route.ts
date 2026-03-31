import { NextResponse } from "next/server";
import { updateSiteSettings, getSiteSettings } from "@/lib/google/settings";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const success = await updateSiteSettings(body);
    
    if (success) {
      return NextResponse.json({ success: true, message: "Settings updated successfully." });
    } else {
      return NextResponse.json({ error: "Failed to update settings in Google Sheets." }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
