"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Rocket, LayoutGrid, Mail, LogIn, Eye, Facebook, ChevronRight } from "lucide-react";

export default function TopNavbar({ 
  settings,
  projectCount = 0,
  totalDownloads = 0
}: { 
  settings: any;
  projectCount?: number;
  totalDownloads?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewCount, setViewCount] = useState<string>(settings?.site_views || "0");
  const [scrolled, setScrolled] = useState(false);
  const [localDownloads, setLocalDownloads] = useState(totalDownloads);

  useEffect(() => {
    setLocalDownloads(totalDownloads);
  }, [totalDownloads]);

  useEffect(() => {
    const handleDownloadEvent = () => {
      setLocalDownloads(prev => prev + 1);
    };
    window.addEventListener("project-downloaded", handleDownloadEvent);
    return () => window.removeEventListener("project-downloaded", handleDownloadEvent);
  }, []);

  useEffect(() => {
    const hasTracked = sessionStorage.getItem("view_tracked");
    if (!hasTracked) {
      sessionStorage.setItem("view_tracked", "1");
      fetch("/api/views", { method: "POST" })
        .then(res => res.json())
        .then(data => {
          if(data.success && data.count) {
             setViewCount(data.count);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setIsOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-slate-950/95 backdrop-blur-2xl shadow-2xl shadow-black/30 border-b border-white/5' : 'bg-slate-950/60 backdrop-blur-xl border-b border-white/[0.02]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.25)] group-hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all group-hover:scale-105">
              <Rocket className="text-slate-950 w-4 h-4 sm:w-5 sm:h-5 font-bold" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tighter">
              DeeDev<span className="text-yellow-400">IOT</span>
            </span>
          </Link>

          {/* Center: Counters */}
          <div className="hidden lg:flex items-center gap-3.5 bg-slate-900/60 border border-slate-700/50 px-4 py-1.5 rounded-full shadow-[inset_0_0_15px_rgba(250,204,21,0.05)] backdrop-blur-md">
            {/* View Counter */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">คนเข้าดู</span>
              <span className="text-xs font-black text-yellow-400 bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800/80">{viewCount}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">คน</span>
            </div>

            <div className="w-px h-3 bg-slate-800"></div>

            {/* Projects Counter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ผลงาน</span>
              <span className="text-xs font-black text-cyan-400 bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800/80">{projectCount}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รายการ</span>
            </div>

            <div className="w-px h-3 bg-slate-800"></div>

            {/* Downloads Counter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ดาวน์โหลด</span>
              <span className="text-xs font-black text-emerald-400 bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800/80">{localDownloads}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ครั้ง</span>
            </div>
          </div>

          {/* Desktop Links — uses relative z-10 to stay above any overlaps */}
          <div className="hidden md:flex items-center gap-1 relative z-10">
            <Link href="/#projects" className="text-sm font-bold text-slate-300 hover:text-yellow-400 transition-all px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-2">
              <LayoutGrid size={15} /> Showcase
            </Link>
            {settings?.facebook_url && (
              <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-300 hover:text-yellow-400 transition-all px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-2">
                <Facebook size={15} /> Facebook
              </a>
            )}
            {settings?.contact_email && (
              <a href="#contact" className="text-sm font-bold text-slate-300 hover:text-yellow-400 transition-all px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-2">
                <Mail size={15} /> Contact Us
              </a>
            )}
            
            <Link 
              href="/admin" 
              className="ml-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 px-5 py-2 rounded-full font-bold text-sm transition-all hover:shadow-[0_0_25px_rgba(250,204,21,0.4)] hover:scale-105 flex items-center gap-2"
            >
              <LogIn size={15} />
              Portal Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            {/* Mobile view counter - compact */}
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/50 px-2.5 py-1 rounded-full text-xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              <span className="font-bold text-yellow-400">{viewCount}</span>
              <span className="text-slate-500 font-medium">คน</span>
            </div>
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-slate-300 hover:text-yellow-400 focus:outline-none p-2 rounded-xl hover:bg-white/5 transition-all"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-400 ease-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ transitionProperty: 'max-height, opacity' }}
      >
        <div className="px-4 py-5 bg-slate-950/98 backdrop-blur-2xl border-t border-white/5 space-y-1">
          {/* Mobile stats panel */}
          <div className="grid grid-cols-2 gap-2 pb-4 mb-2 border-b border-white/5">
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">ผลงานทั้งหมด</span>
              <span className="text-sm font-black text-cyan-400 mt-0.5 block">{projectCount} รายการ</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">ดาวน์โหลดรวม</span>
              <span className="text-sm font-black text-emerald-400 mt-0.5 block">{localDownloads} ครั้ง</span>
            </div>
          </div>
          <Link 
            href="/#projects" 
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between text-base font-bold text-slate-200 hover:text-yellow-400 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-all active:scale-[0.98]"
          >
            <span className="flex items-center gap-3"><LayoutGrid size={18} /> Showcase Projects</span>
            <ChevronRight size={16} className="text-slate-600" />
          </Link>
          {settings?.facebook_url && (
            <a 
              href={settings.facebook_url} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center justify-between text-base font-bold text-slate-200 hover:text-yellow-400 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-all active:scale-[0.98]"
            >
              <span className="flex items-center gap-3"><Facebook size={18} /> Facebook Fanpage</span>
              <ChevronRight size={16} className="text-slate-600" />
            </a>
          )}
          {settings?.contact_email && (
            <a 
              href="#contact" 
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between text-base font-bold text-slate-200 hover:text-yellow-400 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-all active:scale-[0.98]"
            >
              <span className="flex items-center gap-3"><Mail size={18} /> ติดต่อเรา</span>
              <ChevronRight size={16} className="text-slate-600" />
            </a>
          )}
          
          <div className="pt-3 mt-2 border-t border-white/5">
            <Link 
              href="/admin" 
              onClick={() => setIsOpen(false)}
              className="w-full flex justify-center items-center gap-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 px-5 py-4 rounded-2xl font-extrabold text-base shadow-[0_0_25px_rgba(250,204,21,0.2)] active:scale-[0.97] transition-all"
            >
              <LogIn size={20} />
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
