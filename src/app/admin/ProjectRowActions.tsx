"use client";

import { useState } from "react";
import { Eye, EyeOff, Trash2, Edit, Check, XCircle, ArrowUp, ArrowDown, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProjectRowActions({ project, userRole, isFirst = false, isLast = false }: { project: any, userRole: string, isFirst?: boolean, isLast?: boolean }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleFeatured = async () => {
    setIsUpdating(true);
    const newFeaturedState = !project.is_featured;
    
    const featuredPromise = async () => {
      const res = await fetch("/api/admin/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: project.id,
          is_featured: newFeaturedState,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update featured status");
      }
      return res.json();
    };

    toast.promise(featuredPromise(), {
      loading: newFeaturedState ? "กำลังปักหมุดโปรเจกต์เด่น..." : "กำลังยกเลิกโปรเจกต์เด่น...",
      success: () => {
        setIsUpdating(false);
        router.refresh();
        return newFeaturedState ? "ตั้งเป็นโปรเจกต์เด่นเรียบร้อย (นำเสนอขึ้นก่อน)" : "ยกเลิกการตั้งเป็นโปรเจกต์เด่นแล้ว";
      },
      error: (err) => {
        setIsUpdating(false);
        return err.message || "เกิดข้อผิดพลาดในการอัปเดต";
      }
    });
  };

  const handleReorder = async (direction: "up" | "down") => {
    setIsUpdating(true);
    
    const reorderPromise = async () => {
      const res = await fetch("/api/admin/projects/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: project.id,
          direction,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to move project ${direction}`);
      }
      return res.json();
    };

    toast.promise(reorderPromise(), {
      loading: `Moving project ${direction}...`,
      success: () => {
        setIsUpdating(false);
        router.refresh();
        return `Project moved ${direction} successfully`;
      },
      error: (err) => {
        setIsUpdating(false);
        return err.message || "Failed to move project";
      }
    });
  };

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    
    const updatePromise = async () => {
      const res = await fetch("/api/admin/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: project.id,
          status: newStatus,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update project status");
      }
      return res.json();
    };

    toast.promise(updatePromise(), {
      loading: "Updating status...",
      success: () => {
        setIsUpdating(false);
        router.refresh();
        return `Project status updated to ${newStatus}`;
      },
      error: (err) => {
        setIsUpdating(false);
        return err.message || "Failed to update project status";
      }
    });
  };

  const deleteProject = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    setIsUpdating(true);
    
    const deletePromise = async () => {
      const res = await fetch("/api/admin/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete project");
      }
      return res.json();
    };

    toast.promise(deletePromise(), {
      loading: "Deleting project...",
      success: () => {
        setIsUpdating(false);
        router.refresh();
        return "Project deleted successfully.";
      },
      error: (err) => {
        setIsUpdating(false);
        return err.message || "Failed to delete project";
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

      {/* Featured Star Toggle */}
      <button
        onClick={toggleFeatured}
        disabled={isUpdating}
        className={`p-2 rounded-xl transition-all hover:scale-110 disabled:opacity-50 ${
          project.is_featured 
            ? "text-yellow-400 bg-yellow-400/15 hover:bg-yellow-400/25 shadow-[0_0_12px_rgba(250,204,21,0.25)] border border-yellow-400/30" 
            : "text-slate-500 hover:text-yellow-400 hover:bg-yellow-400/10"
        }`}
        title={project.is_featured ? "ยกเลิกการตั้งเป็นโปรเจกต์เด่น" : "ตั้งเป็นโปรเจกต์เด่น (นำเสนอขึ้นก่อน)"}
      >
        <Star size={18} className={project.is_featured ? "fill-yellow-400" : ""} />
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
