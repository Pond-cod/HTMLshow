"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Home, Settings2, Menu, X, Users } from "lucide-react";
import LogoutButton from "@/app/admin/LogoutButton";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUserRole(data.role);
        }
      });
  }, []);

  const navLinks = [
    { name: "Projects", href: "/admin", icon: <LayoutDashboard size={20} />, show: true },
    { name: "Global Config", href: "/admin/settings", icon: <Settings2 size={20} />, show: !!userRole },
    { name: "User Management", href: "/admin/users", icon: <Users size={20} />, show: userRole === 'admin' },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 z-50 relative sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
            <LayoutDashboard className="text-slate-950 w-4 h-4 font-bold" />
          </div>
          <span className="text-lg font-bold text-slate-50 tracking-tight">CMS Admin</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-400 hover:text-yellow-400 focus:outline-none">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col shadow-2xl z-50 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="hidden md:flex items-center gap-3 mb-10 mt-2">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
            <LayoutDashboard className="text-slate-950 w-5 h-5 font-bold" />
          </div>
          <span className="text-xl font-bold text-slate-50 tracking-tight">CMS Admin</span>
        </div>
        
        <div className="flex flex-col flex-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Manage</p>
          <nav className="space-y-2 mb-8 relative">
            {navLinks.filter(link => link.show).map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.name}
                  href={link.href} 
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                    isActive 
                      ? "bg-slate-800/80 text-yellow-400 shadow-[inset_2px_0_0_0_#facc15]" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <div className="group-hover:scale-110 transition-transform">
                    {link.icon}
                  </div>
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">External</p>
          <nav className="space-y-2">
            <Link 
              href="/" 
              className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 text-slate-400 font-medium transition-colors hover:text-slate-200"
            >
              <Home size={20} className="group-hover:scale-110 transition-transform" />
              Public View
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
