import { NextResponse } from "next/server";
import { updateSiteSettings, getSiteSettings } from "@/lib/google/settings";
import * as fs from 'fs';
import * as path from 'path';

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
    await updateSiteSettings(body);
    
    return NextResponse.json({ success: true, message: "Settings updated successfully." });
  } catch (error: any) {
    fs.writeFileSync(path.join(process.cwd(), 'sheets-error.log'), error.message || String(error));
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
