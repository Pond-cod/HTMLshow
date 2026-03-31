"use client";

import { useState } from "react";
import { Eye, EyeOff, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProjectRowActions({ project }: { project: any }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleStatus = async () => {
    setIsUpdating(true);
    const promise = fetch("/api/admin/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: project.id,
        status: project.status === "published" ? "draft" : "published",
      }),
    });

    toast.promise(promise, {
      loading: "Updating status...",
      success: () => {
        setIsUpdating(false);
        router.refresh(); // Refresh the server component
        return `Project status updated to ${project.status === "published" ? "Draft" : "Published"}`;
      },
      error: "Failed to update project status"
    });
  };

  const deleteProject = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    setIsUpdating(true);
    const promise = fetch("/api/admin/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: project.id }),
    });

    toast.promise(promise, {
      loading: "Deleting project...",
      success: () => {
        setIsUpdating(false);
        router.refresh();
        return "Project deleted successfully.";
      },
      error: "Failed to delete project"
    });
  };

  return (
    <div className="flex items-center justify-end gap-3">
      <Link 
        href={`/admin/edit/${project.id}`}
        className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-xl transition-all hover:scale-110"
        title="Edit"
      >
        <Edit size={18} />
      </Link>
      <button
        onClick={toggleStatus}
        disabled={isUpdating}
        className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-400/10 rounded-xl transition-all hover:scale-110 disabled:opacity-50"
        title={project.status === "published" ? "Unpublish" : "Publish"}
      >
        {project.status === "published" ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
      <button
        onClick={deleteProject}
        disabled={isUpdating}
        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all hover:scale-110 disabled:opacity-50"
        title="Delete"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
