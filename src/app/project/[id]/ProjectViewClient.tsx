"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, PlayCircle, Maximize2, Minimize2 } from "lucide-react";
import Image from "next/image";
import { cleanImageUrl } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  thumbnail_url?: string;
  html_drive_id?: string;
  last_updated?: string;
  manual_text?: string;
  manual_image_url?: string;
  manual_url?: string;
  learning_text?: string;
  learning_image_url?: string;
  learning_url?: string;
  other_text?: string;
  other_image_url?: string;
  other_url?: string;
  status: string;
}

export default function ProjectViewClient({ project }: { project: Project }) {
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

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
        <h1 className="text-base sm:text-xl font-bold truncate mr-2">{project.title}</h1>
        
        {project.last_updated && (
          <div className="text-xs sm:text-sm text-gray-400 shrink-0 ml-auto mr-4">
            <span className="hidden sm:inline">Updated: </span>{new Date(project.last_updated).toLocaleDateString()}
          </div>
        )}

        {/* Fullscreen Toggle Button */}
        <button
          onClick={() => setIsHeaderHidden(true)}
          className={`p-2 hover:bg-gray-800 text-gray-300 hover:text-white rounded-full transition-all flex items-center justify-center shrink-0 ${
            project.last_updated ? "" : "ml-auto"
          }`}
          title="Hide Header (Fullscreen)"
        >
          <Maximize2 size={20} />
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
        {(project.manual_url || project.learning_url || project.other_url) && (
          <div className="flex flex-wrap items-center gap-4 p-4 border-b border-white/5 bg-gray-900/80 backdrop-blur-md shrink-0">
            {project.manual_url && (
              <a
                href={project.manual_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-yellow-500/30 bg-gray-800/80 p-2 pr-4 transition-all hover:border-yellow-400 hover:bg-gray-800 shadow-md hover:shadow-yellow-500/20"
              >
                {project.manual_image_url ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gray-950">
                    <Image src={cleanImageUrl(project.manual_image_url)} alt={project.manual_text || "Manual"} fill sizes="40px" className="object-cover transition-transform group-hover:scale-110" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-500">
                    <BookOpen size={20} />
                  </div>
                )}
                <span className="font-semibold text-gray-200 group-hover:text-yellow-400 text-sm">
                  {project.manual_text || "คู่มือการใช้งาน"}
                </span>
              </a>
            )}

            {project.learning_url && (
              <a
                href={project.learning_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-blue-500/30 bg-gray-800/80 p-2 pr-4 transition-all hover:border-blue-400 hover:bg-gray-800 shadow-md hover:shadow-blue-500/20"
              >
                {project.learning_image_url ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gray-950">
                    <Image src={cleanImageUrl(project.learning_image_url)} alt={project.learning_text || "Learning"} fill sizes="40px" className="object-cover transition-transform group-hover:scale-110" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500">
                    <PlayCircle size={20} />
                  </div>
                )}
                <span className="font-semibold text-gray-200 group-hover:text-blue-400 text-sm">
                  {project.learning_text || "สื่อการเรียน"}
                </span>
              </a>
            )}
          </div>
        )}

        {/* iframe */}
        {project.html_drive_id ? (
          <iframe
            src={project.html_drive_id.startsWith('http') ? project.html_drive_id : `/api/proxy-html?id=${project.html_drive_id}`}
            title={project.title}
            className="w-full min-h-[750px] sm:min-h-[850px] border-0 bg-white flex-1"
            scrolling="yes"
            style={{ overflow: "auto", WebkitOverflowScrolling: "touch" }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-top-navigation-by-user-activation"
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
