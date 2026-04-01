import { NextResponse } from "next/server";
import { 
  updateSiteSettings, 
  getSiteSettings, 
  getPendingSettings, 
  createPendingSettings, 
  approveSettings, 
  rejectSettings 
} from "@/lib/google/settings";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    if (action === "pending") {
      const pending = await getPendingSettings();
      return NextResponse.json(pending || { updates: null });
    }

    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const session = await getSession();
  
  if (!session || !['admin', 'approver'].includes(session.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (action === "approve") {
      await approveSettings();
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true, message: "Settings approved and applied." });
    } else if (action === "reject") {
      await rejectSettings();
      return NextResponse.json({ success: true, message: "Pending settings rejected." });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    if (session.role === 'adminuser') {
      // Create pending request
      await createPendingSettings(body, session.username as string);
      return NextResponse.json({ success: true, message: "Settings submitted for review.", pending: true });
    } else {
      // Direct update for admin/approver
      await updateSiteSettings(body);
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true, message: "Settings updated successfully." });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

