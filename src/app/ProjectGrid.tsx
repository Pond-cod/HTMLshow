"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, ExternalLink, BookOpen, PlayCircle } from "lucide-react";
import Image from "next/image";

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
}

const cleanImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `/api/proxy-image?id=${match[1]}`;
  }
  if (url.includes('drive.google.com/uc')) {
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `/api/proxy-image?id=${match[1]}`;
  }
  return url;
};

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedProject]);

  if (projects.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-24 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl w-full"
      >
        <p className="text-xl text-slate-400 font-medium">No projects published yet.</p>
        <p className="text-sm mt-3 text-slate-500">Check back later or access the Admin Panel to add content.</p>
      </motion.div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="group relative"
        >
          {/* Glowing yellow shadow behind the card on hover */}
          <div className="absolute -inset-0.5 bg-yellow-400 rounded-3xl blur opacity-0 group-hover:opacity-30 transition duration-700"></div>
          
          <div 
            onClick={() => setSelectedProject(project)}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedProject(project)}
            role="button"
            tabIndex={0}
            className="w-full text-left relative flex flex-col h-full overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-800/80 transition-all duration-500 group-hover:border-yellow-400/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
          >
            <div className="aspect-[16/10] w-full relative overflow-hidden bg-slate-950">
              {project.thumbnail_url ? (
                <Image
                  src={cleanImageUrl(project.thumbnail_url)}
                  alt={project.title}
                  fill
                  priority={index < 6}
                  className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700 font-medium bg-slate-950">
                  <span className="opacity-50 tracking-widest uppercase text-xs">No Cover</span>
                </div>
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-75 transition-opacity duration-500" />
            </div>
            
            <div className="absolute bottom-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
              <h2 className="text-2xl font-bold mb-3 text-white truncate drop-shadow-lg tracking-tight">
                {project.title}
              </h2>
              <div className="flex items-center gap-2 text-sm font-semibold text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span>View Project</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      </div>

      {/* Sleek Full-Screen Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-lg p-0 sm:p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ delay: 0.1, duration: 0.4, type: "spring", bounce: 0.2 }}
              className="relative w-full h-full sm:h-[90vh] max-w-7xl bg-slate-900 sm:rounded-3xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{selectedProject.title}</h2>
                  {selectedProject.last_updated && (
                    <p className="text-sm text-slate-400 mt-1">
                      Updated: {new Date(selectedProject.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  {selectedProject.html_drive_id && (
                    <a 
                      href={`/project/${selectedProject.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-yellow-400 rounded-xl font-medium transition-colors text-sm border border-slate-700"
                    >
                      <ExternalLink size={16} /> Open in New Tab
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="p-3 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors focus:outline-none"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Highlight Resources Bar */}
              {(selectedProject.manual_url || selectedProject.learning_url) && (
                <div className="flex flex-wrap items-center gap-4 p-4 border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
                  {selectedProject.manual_url && (
                    <a
                      href={selectedProject.manual_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-yellow-500/30 bg-slate-800/80 p-2 pr-4 transition-all hover:border-yellow-400 hover:bg-slate-800 shadow-md hover:shadow-yellow-500/20"
                    >
                      {selectedProject.manual_image_url ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-slate-950">
                          <Image src={cleanImageUrl(selectedProject.manual_image_url)} alt={selectedProject.manual_text || "Manual"} fill sizes="40px" className="object-cover transition-transform group-hover:scale-110" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-500">
                          <BookOpen size={20} />
                        </div>
                      )}
                      <span className="font-semibold text-slate-200 group-hover:text-yellow-400 text-sm">
                        {selectedProject.manual_text || "คู่มือการใช้งาน"}
                      </span>
                    </a>
                  )}

                  {selectedProject.learning_url && (
                    <a
                      href={selectedProject.learning_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-blue-500/30 bg-slate-800/80 p-2 pr-4 transition-all hover:border-blue-400 hover:bg-slate-800 shadow-md hover:shadow-blue-500/20"
                    >
                      {selectedProject.learning_image_url ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-slate-950">
                          <Image src={cleanImageUrl(selectedProject.learning_image_url)} alt={selectedProject.learning_text || "Learning"} fill sizes="40px" className="object-cover transition-transform group-hover:scale-110" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500">
                          <PlayCircle size={20} />
                        </div>
                      )}
                      <span className="font-semibold text-slate-200 group-hover:text-blue-400 text-sm">
                        {selectedProject.learning_text || "สื่อการเรียน"}
                      </span>
                    </a>
                  )}
                </div>
              )}

              {/* Modal Content (Iframe) */}
              <div className="flex-1 bg-slate-950 relative w-full h-full overflow-hidden">
                {selectedProject.html_drive_id ? (
                  <iframe
                    src={selectedProject.html_drive_id.startsWith('http') ? selectedProject.html_drive_id : `/api/proxy-html?id=${selectedProject.html_drive_id}`}
                    title={selectedProject.title}
                    className="w-full h-full border-0 absolute inset-0 bg-white" // background white is generally safer for standard HTML renders
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-top-navigation-by-user-activation"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-950 p-8 text-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-800">
                      <X size={32} className="text-slate-600" />
                    </div>
                    <p className="text-xl font-medium text-slate-300">No Content Available</p>
                    <p className="text-sm mt-2">This project does not have an associated HTML render file.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
