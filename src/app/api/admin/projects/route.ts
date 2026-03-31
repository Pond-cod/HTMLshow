import { NextRequest, NextResponse } from "next/server";
import { addProject, updateProject, deleteProject } from "@/lib/google/sheets";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const newProject = await addProject(data);
    return NextResponse.json({ success: true, project: newProject });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error creating project" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, message: "Missing ID" }, { status: 400 });
    }
    const ok = await updateProject(id, data);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { success: false, message: "Error updating project" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, message: "Missing ID" }, { status: 400 });
    }
    const ok = await deleteProject(id);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { success: false, message: "Error deleting project" },
      { status: 500 }
    );
  }
}
