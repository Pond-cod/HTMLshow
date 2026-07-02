"use client";

import { useState, useEffect } from "react";

export default function HeroStats({
  projectCount,
  totalDownloads,
}: {
  projectCount: number;
  totalDownloads: number;
}) {
  const [localDownloads, setLocalDownloads] = useState(totalDownloads);

  useEffect(() => {
    setLocalDownloads(totalDownloads);
  }, [totalDownloads]);

  useEffect(() => {
    const handleDownloadEvent = () => {
      setLocalDownloads((prev) => prev + 1);
    };
    window.addEventListener("project-downloaded", handleDownloadEvent);
    return () => window.removeEventListener("project-downloaded", handleDownloadEvent);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mt-10 w-full relative z-10 px-4">
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 text-center transition-all duration-300 hover:border-yellow-400/20 shadow-md">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">ผลงานทั้งหมด</span>
        <span className="text-xl sm:text-2xl font-black text-cyan-400">
          {projectCount}{" "}
          <span className="text-xs sm:text-sm font-medium text-slate-400 font-normal">รายการ</span>
        </span>
      </div>
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 text-center transition-all duration-300 hover:border-yellow-400/20 shadow-md">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">ยอดดาวน์โหลดรวม</span>
        <span className="text-xl sm:text-2xl font-black text-emerald-400">
          {localDownloads}{" "}
          <span className="text-xs sm:text-sm font-medium text-slate-400 font-normal">ครั้ง</span>
        </span>
      </div>
    </div>
  );
}
