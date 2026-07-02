"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, PlayCircle, Maximize2, Minimize2, Download } from "lucide-react";
import Image from "next/image";
import { cleanImageUrl } from "@/lib/utils";
import { Project } from "@/types/project";
import { downloadProjectCode } from "@/lib/download";

export default function ProjectViewClient({ project }: { project: Project }) {
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [proj, setProj] = useState<Project>(project);

  const handleDownload = async (projectId: string, driveId: string, title: string) => {
    await downloadProjectCode(projectId, driveId, title, (newCount) => {
      setProj(prev => ({ ...prev, download_count: newCount }));
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden">
      {/* Header */}
      <header 
        className={`absolute top-0 w-full bg-gray-950/90 backdrop-blur-md border-b border-gray-800 z-50 text-white p-4 flex items-center transition-all duration-300 ${
          isHeaderHidden ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
      >
        <Link href="/" className="mr-4 hover:bg-gray-800 p-2 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-base sm:text-xl font-bold truncate mr-2 max-w-[35%] sm:max-w-[45%]">{proj.title}</h1>
        
        {proj.last_updated && (
          <div className="text-xs sm:text-sm text-gray-400 shrink-0 ml-auto mr-4 max-w-[25%] sm:max-w-[35%] truncate">
            <span className="hidden sm:inline">Updated: </span>{new Date(proj.last_updated).toLocaleDateString()}
          </div>
        )}

        {/* Fullscreen Toggle Button */}
        <button
          onClick={() => setIsHeaderHidden(true)}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 hover:from-yellow-300 hover:via-amber-300 hover:to-orange-400 text-slate-950 rounded-full border-2 border-yellow-300/40 hover:border-yellow-200 transition-all duration-300 hover:scale-110 active:scale-[0.95] shadow-[0_0_15px_rgba(251,191,36,0.5)] hover:shadow-[0_0_25px_rgba(245,158,11,0.8)] flex items-center justify-center shrink-0"
          title="Hide Header (Fullscreen)"
        >
          <Maximize2 size={20} strokeWidth={3} />
        </button>
      </header>

      {/* Floating Restore Button when header is hidden */}
      <button
        onClick={() => setIsHeaderHidden(false)}
        className={`fixed top-4 right-4 z-50 p-3 bg-gray-950/80 hover:bg-gray-950 border border-gray-800 text-yellow-400 hover:text-yellow-300 rounded-full transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 flex items-center justify-center ${
          isHeaderHidden ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none"
        } duration-300`}
        title="Show Header"
      >
        <Minimize2 size={20} />
      </button>

      <main 
        className={`flex-1 w-full flex flex-col overflow-y-auto transition-all duration-300 ${
          isHeaderHidden ? "mt-0 h-screen" : "mt-[73px]"
        }`}
      >
        {/* Highlight Resources Bar */}
        {(proj.manual_url || proj.learning_url || proj.other_url || (proj.html_drive_id && !proj.html_drive_id.startsWith('http'))) && (
          <div className="flex flex-wrap items-center gap-4 p-4 border-b border-white/5 bg-gray-900/80 backdrop-blur-md shrink-0">
            {proj.manual_url && (
              <a
                href={proj.manual_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-yellow-500/30 bg-gray-800/80 p-2 pr-4 transition-all hover:border-yellow-400 hover:bg-gray-800 shadow-md hover:shadow-yellow-500/20"
              >
                {proj.manual_image_url ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gray-950">
                    <Image src={cleanImageUrl(proj.manual_image_url)} alt={proj.manual_text || "Manual"} fill sizes="40px" className="object-cover transition-transform group-hover:scale-110" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-500">
                    <BookOpen size={20} />
                  </div>
                )}
                <span className="font-semibold text-gray-200 group-hover:text-yellow-400 text-sm">
                  {proj.manual_text || "คู่มือการใช้งาน"}
                </span>
              </a>
            )}

            {proj.html_drive_id && !proj.html_drive_id.startsWith('http') && (
              <button
                onClick={() => handleDownload(proj.id, proj.html_drive_id!, proj.title)}
                className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-cyan-500/30 bg-gray-800/80 p-2 pr-4 transition-all hover:border-cyan-400 hover:bg-gray-800 shadow-md hover:shadow-cyan-500/20 active:scale-[0.97]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                  <Download size={20} />
                </div>
                <span className="font-semibold text-gray-200 group-hover:text-cyan-400 text-sm">
                  ดาวน์โหลด Code {proj.download_count !== undefined && proj.download_count > 0 ? `(${proj.download_count})` : ""}
                </span>
              </button>
            )}

            {proj.learning_url && (
              <a
                href={proj.learning_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-blue-500/30 bg-gray-800/80 p-2 pr-4 transition-all hover:border-blue-400 hover:bg-gray-800 shadow-md hover:shadow-blue-500/20"
              >
                {proj.learning_image_url ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gray-950">
                    <Image src={cleanImageUrl(proj.learning_image_url)} alt={proj.learning_text || "Learning"} fill sizes="40px" className="object-cover transition-transform group-hover:scale-110" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500">
                    <PlayCircle size={20} />
                  </div>
                )}
                <span className="font-semibold text-gray-200 group-hover:text-blue-400 text-sm">
                  {proj.learning_text || "สื่อการเรียน"}
                </span>
              </a>
            )}
          </div>
        )}

        {/* iframe */}
        {proj.html_drive_id ? (
          <iframe
            src={proj.html_drive_id.startsWith('http') ? proj.html_drive_id : `/api/proxy-html?id=${proj.html_drive_id}`}
            title={proj.title}
            className="w-full min-h-[750px] sm:min-h-[850px] border-0 bg-white flex-1"
            scrolling="yes"
            style={{ overflow: "auto", WebkitOverflowScrolling: "touch" }}
            {...(!proj.html_drive_id.startsWith('http') ? { sandbox: "allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-top-navigation-by-user-activation" } : {})}
          />
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-500">
            No HTML content available for this project.
          </div>
        )}
      </main>
    </div>
  );
}
