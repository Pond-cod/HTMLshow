"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, ExternalLink, BookOpen, PlayCircle, Maximize2, Link2, Download } from "lucide-react";
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
}

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [mounted, setMounted] = useState(false);

  const handleDownload = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/proxy-html?id=${id}`);
      if (res.ok) {
        const htmlText = await res.text();
        const blob = new Blob([htmlText], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title || "project"}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("Failed to download code.");
      }
    } catch (error) {
      console.error("Error downloading code:", error);
      alert("Error downloading code.");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent scrolling + handle Escape key when modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProject(null);
    };
    if (selectedProject) {
      document.body.style.overflow = "hidden";
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedProject]);

  if (projects.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20 sm:py-24 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl w-full"
      >
        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
          <X size={28} className="text-slate-600" />
        </div>
        <p className="text-lg sm:text-xl text-slate-400 font-medium">No projects published yet.</p>
        <p className="text-sm mt-3 text-slate-500 px-4">Check back later or access the Admin Panel to add content.</p>
      </motion.div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 relative z-10">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
          whileHover={{ y: -6, scale: 1.015 }}
          className="group relative"
        >
          {/* Glowing shadow behind the card on hover */}
          <div className="absolute -inset-0.5 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-2xl sm:rounded-3xl blur opacity-0 group-hover:opacity-25 transition duration-700"></div>
          
          <div 
            onClick={() => setSelectedProject(project)}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedProject(project)}
            role="button"
            tabIndex={0}
            className="w-full text-left relative flex flex-col h-full overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900/90 backdrop-blur-md border border-slate-800/80 transition-all duration-500 group-hover:border-yellow-400/40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400/50 active:scale-[0.98]"
          >
            <div className="aspect-[16/10] w-full relative overflow-hidden bg-slate-950">
              {project.thumbnail_url ? (
                <Image
                  src={cleanImageUrl(project.thumbnail_url)}
                  alt={project.title}
                  fill
                  priority={index < 6}
                  className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700 font-medium bg-gradient-to-br from-slate-950 to-slate-900">
                  <span className="opacity-40 tracking-widest uppercase text-[10px] sm:text-xs">No Cover</span>
                </div>
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-85 group-hover:opacity-70 transition-opacity duration-500" />
              
              {/* Expand icon on hover */}
              <div className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Maximize2 size={14} className="text-white/80" />
              </div>
            </div>
            
            <div className="absolute bottom-0 w-full p-4 sm:p-6 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-white truncate drop-shadow-lg tracking-tight">
                {project.title}
              </h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span>View Project</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      </div>

      {/* Full-Screen Modal rendered via React Portal to completely escape parent z-index stacking contexts */}
      {mounted && createPortal(
        <AnimatePresence>
          {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedProject(null); }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-lg p-0 sm:p-4 md:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ delay: 0.1, duration: 0.4, type: "spring", bounce: 0.2 }}
              className="relative w-full h-full sm:h-[92vh] sm:max-h-[900px] max-w-7xl bg-slate-900 sm:rounded-2xl md:rounded-3xl shadow-2xl border-0 sm:border border-slate-800 flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 border-b border-white/5 bg-slate-900/80 backdrop-blur-md shrink-0">
                <div className="min-w-0 flex-1 mr-3">
                  <h2 className="text-base sm:text-lg md:text-2xl font-bold text-white tracking-tight truncate">{selectedProject.title}</h2>
                  {selectedProject.last_updated && (
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                      Updated: {new Date(selectedProject.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {selectedProject.html_drive_id && (
                    <a 
                      href={`/project/${selectedProject.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 rounded-xl font-bold shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:shadow-[0_0_25px_rgba(250,204,21,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 text-xs border border-yellow-500/20"
                      title="เปิดเว็บนี้"
                    >
                      <ExternalLink size={14} strokeWidth={2.5} />
                      <span className="hidden sm:inline">เปิดเว็บนี้</span>
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="p-2 sm:p-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl sm:rounded-full transition-colors focus:outline-none active:scale-90"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Highlight Resources Bar */}
              {(selectedProject.manual_url || selectedProject.learning_url || selectedProject.other_url || (selectedProject.html_drive_id && !selectedProject.html_drive_id.startsWith('http'))) && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-white/5 bg-slate-900/80 backdrop-blur-md shrink-0">
                  {selectedProject.manual_url && (
                    <a
                      href={selectedProject.manual_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/res relative flex items-center gap-2 sm:gap-3 overflow-hidden rounded-xl border border-yellow-500/30 bg-slate-800/80 p-1.5 sm:p-2 pr-3 sm:pr-4 transition-all hover:border-yellow-400 hover:bg-slate-800 shadow-md hover:shadow-yellow-500/20 active:scale-[0.97]"
                    >
                      {selectedProject.manual_image_url ? (
                        <div className="relative h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-lg bg-slate-950 shrink-0">
                          <Image src={cleanImageUrl(selectedProject.manual_image_url)} alt={selectedProject.manual_text || "Manual"} fill sizes="40px" className="object-cover transition-transform group-hover/res:scale-110" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-500 shrink-0">
                          <BookOpen size={16} className="sm:w-5 sm:h-5" />
                        </div>
                      )}
                      <span className="font-semibold text-slate-200 group-hover/res:text-yellow-400 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                        {selectedProject.manual_text || "คู่มือการใช้งาน"}
                      </span>
                    </a>
                  )}

                  {selectedProject.html_drive_id && !selectedProject.html_drive_id.startsWith('http') && (
                    <button
                      onClick={() => handleDownload(selectedProject.html_drive_id!, selectedProject.title)}
                      className="group/res relative flex items-center gap-2 sm:gap-3 overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-800/80 p-1.5 sm:p-2 pr-3 sm:pr-4 transition-all hover:border-cyan-400 hover:bg-slate-800 shadow-md hover:shadow-cyan-500/20 active:scale-[0.97]"
                    >
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                        <Download size={16} className="sm:w-5 sm:h-5" />
                      </div>
                      <span className="font-semibold text-slate-200 group-hover/res:text-cyan-400 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                        ดาวน์โหลด Code
                      </span>
                    </button>
                  )}

                  {selectedProject.learning_url && (
                    <a
                      href={selectedProject.learning_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/res relative flex items-center gap-2 sm:gap-3 overflow-hidden rounded-xl border border-blue-500/30 bg-slate-800/80 p-1.5 sm:p-2 pr-3 sm:pr-4 transition-all hover:border-blue-400 hover:bg-slate-800 shadow-md hover:shadow-blue-500/20 active:scale-[0.97]"
                    >
                      {selectedProject.learning_image_url ? (
                        <div className="relative h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-lg bg-slate-950 shrink-0">
                          <Image src={cleanImageUrl(selectedProject.learning_image_url)} alt={selectedProject.learning_text || "Learning"} fill sizes="40px" className="object-cover transition-transform group-hover/res:scale-110" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500 shrink-0">
                          <PlayCircle size={16} className="sm:w-5 sm:h-5" />
                        </div>
                      )}
                      <span className="font-semibold text-slate-200 group-hover/res:text-blue-400 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                        {selectedProject.learning_text || "สื่อการเรียน"}
                      </span>
                    </a>
                  )}

                  {selectedProject.other_url && (
                    <a
                      href={selectedProject.other_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/res relative flex items-center gap-2 sm:gap-3 overflow-hidden rounded-xl border border-emerald-500/30 bg-slate-800/80 p-1.5 sm:p-2 pr-3 sm:pr-4 transition-all hover:border-emerald-400 hover:bg-slate-800 shadow-md hover:shadow-emerald-500/20 active:scale-[0.97]"
                    >
                      {selectedProject.other_image_url ? (
                        <div className="relative h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-lg bg-slate-950 shrink-0">
                          <Image src={cleanImageUrl(selectedProject.other_image_url)} alt={selectedProject.other_text || "Other"} fill sizes="40px" className="object-cover transition-transform group-hover/res:scale-110" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500 shrink-0">
                          <Link2 size={16} className="sm:w-5 sm:h-5" />
                        </div>
                      )}
                      <span className="font-semibold text-slate-200 group-hover/res:text-emerald-400 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                        {selectedProject.other_text || "ข้อมูลเพิ่มเติม"}
                      </span>
                    </a>
                  )}
                </div>
              )}

              {/* Modal Content (Iframe) */}
              <div className="flex-1 bg-slate-950 relative w-full overflow-y-auto min-h-0">
                {selectedProject.html_drive_id ? (
                  <iframe
                    src={selectedProject.html_drive_id.startsWith('http') ? selectedProject.html_drive_id : `/api/proxy-html?id=${selectedProject.html_drive_id}`}
                    title={selectedProject.title}
                    className="w-full min-h-[750px] sm:min-h-[850px] border-0 bg-white"
                    scrolling="yes"
                    style={{ overflow: "auto", WebkitOverflowScrolling: "touch" }}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-top-navigation-by-user-activation"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-950 p-8 text-center">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-800">
                      <X size={28} className="text-slate-600" />
                    </div>
                    <p className="text-lg font-medium text-slate-300">No Content Available</p>
                    <p className="text-sm mt-2">This project does not have an associated HTML render file.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
}
