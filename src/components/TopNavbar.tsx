"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Rocket, LayoutGrid, Mail, LogIn } from "lucide-react";

export default function TopNavbar({ settings }: { settings: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 transition-all duration-300 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.2)] group-hover:shadow-[0_0_25px_rgba(250,204,21,0.4)] transition-all">
              <Rocket className="text-slate-950 w-5 h-5 font-bold" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">
              DeeDev<span className="text-yellow-400">IOT</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm font-bold text-slate-300 hover:text-yellow-400 transition-colors flex items-center gap-2">
              <LayoutGrid size={16} /> Showcase
            </Link>
            {settings?.facebook_url && (
              <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-300 hover:text-yellow-400 transition-colors">
                Facebook
              </a>
            )}
            {settings?.contact_email && (
              <a href={`mailto:${settings.contact_email}`} className="text-sm font-bold text-slate-300 hover:text-yellow-400 transition-colors flex items-center gap-2">
                <Mail size={16} /> Contact Us
              </a>
            )}
            
            <Link 
              href="/admin" 
              className="ml-4 bg-slate-800 hover:bg-slate-700 text-slate-100 px-5 py-2.5 rounded-full font-bold text-sm border border-slate-700 transition-all hover:border-yellow-400/50 flex items-center gap-2"
            >
              <LogIn size={16} />
              Portal Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-slate-300 hover:text-yellow-400 focus:outline-none p-2"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`md:hidden absolute top-20 w-full bg-slate-900 border-b border-slate-800 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="px-4 py-6 space-y-4 shadow-2xl">
          <Link 
            href="/" 
            onClick={() => setIsOpen(false)}
            className="block text-lg font-bold text-slate-300 hover:text-yellow-400 px-4 py-2"
          >
            Showcase Projects
          </Link>
          {settings?.facebook_url && (
            <a 
              href={settings.facebook_url} 
              target="_blank" 
              rel="noreferrer" 
              className="block text-lg font-bold text-slate-300 hover:text-yellow-400 px-4 py-2"
            >
              Facebook Fanpage
            </a>
          )}
          {settings?.contact_email && (
             <a 
                href={`mailto:${settings.contact_email}`} 
                className="block text-lg font-bold text-slate-300 hover:text-yellow-400 px-4 py-2"
              >
                Contact Us
              </a>
          )}
          
          <div className="pt-4 border-t border-slate-800">
            <Link 
              href="/admin" 
              onClick={() => setIsOpen(false)}
              className="w-full flex justify-center items-center gap-2 bg-yellow-400 text-slate-950 px-5 py-4 rounded-xl font-extrabold text-lg mt-2 shadow-[0_0_15px_rgba(250,204,21,0.2)]"
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
