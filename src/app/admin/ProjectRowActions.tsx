"use client";

import { useState } from "react";
import { Eye, EyeOff, Trash2, Edit, Check, XCircle, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProjectRowActions({ project, userRole, isFirst = false, isLast = false }: { project: any, userRole: string, isFirst?: boolean, isLast?: boolean }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleReorder = async (direction: "up" | "down") => {
    setIsUpdating(true);
    const promise = fetch("/api/admin/projects/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: project.id,
        direction,
      }),
    });

    toast.promise(promise, {
      loading: `Moving project ${direction}...`,
      success: () => {
        setIsUpdating(false);
        router.refresh();
        return `Project moved ${direction} successfully`;
      },
      error: () => {
        setIsUpdating(false);
        return "Failed to move project";
      }
    });
  };

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    const promise = fetch("/api/admin/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: project.id,
        status: newStatus,
      }),
    });

    toast.promise(promise, {
      loading: "Updating status...",
      success: () => {
        setIsUpdating(false);
        router.refresh();
        return `Project status updated to ${newStatus}`;
      },
      error: () => {
        setIsUpdating(false);
        return "Failed to update project status";
      }
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
      error: () => {
        setIsUpdating(false);
        return "Failed to delete project";
      }
    });
  };

  const isPending = project.status === 'pending';
  const canApprove = (userRole === 'admin' || userRole === 'approver') && isPending;
  const canToggle = (userRole === 'admin' || userRole === 'approver') && !isPending;
  const canEdit = userRole !== 'approver';
  const canDelete = userRole === 'admin';

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Reordering Controls */}
      <button
        onClick={() => handleReorder("up")}
        disabled={isUpdating || isFirst}
        className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-xl transition-all hover:scale-110 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:scale-100"
        title="Move Up"
      >
        <ArrowUp size={18} />
      </button>
      <button
        onClick={() => handleReorder("down")}
        disabled={isUpdating || isLast}
        className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-xl transition-all hover:scale-110 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:scale-100"
        title="Move Down"
      >
        <ArrowDown size={18} />
      </button>

      {canEdit && (
        <Link 
          href={`/admin/edit/${project.id}`}
          className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-xl transition-all hover:scale-110"
          title="Edit"
        >
          <Edit size={18} />
        </Link>
      )}

      {canApprove && (
        <>
          <button
            onClick={() => updateStatus('published')}
            disabled={isUpdating}
            className="p-2 text-green-500 hover:bg-green-500/10 rounded-xl transition-all hover:scale-110 disabled:opacity-50"
            title="Approve & Publish"
          >
            <Check size={18} />
          </button>
          <button
            onClick={() => updateStatus('draft')}
            disabled={isUpdating}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all hover:scale-110 disabled:opacity-50"
            title="Reject to Draft"
          >
            <XCircle size={18} />
          </button>
        </>
      )}

      {canToggle && (
        <button
          onClick={() => updateStatus(project.status === "published" ? "draft" : "published")}
          disabled={isUpdating}
          className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-400/10 rounded-xl transition-all hover:scale-110 disabled:opacity-50"
          title={project.status === "published" ? "Unpublish" : "Publish"}
        >
          {project.status === "published" ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}

      {canDelete && (
        <button
          onClick={deleteProject}
          disabled={isUpdating}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all hover:scale-110 disabled:opacity-50"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
}
