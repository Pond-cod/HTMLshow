import { getPublishedProjects } from "@/lib/google/sheets";
import { getSiteSettings } from "@/lib/google/settings";
import ProjectGrid from "./ProjectGrid";
import TopNavbar from "@/components/TopNavbar";
import Footer from "@/components/Footer";
import { Sparkles, Zap, Globe, ChevronDown } from "lucide-react";

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

export default async function Home() {
  const [projects, settings] = await Promise.all([
    getPublishedProjects(),
    getSiteSettings()
  ]);

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-50 selection:bg-yellow-400 selection:text-slate-950"
      style={{ fontFamily: settings.site_font === 'custom' && settings.custom_font_id ? 'CustomUserFont, sans-serif' : (settings.site_font ? `var(--font-${settings.site_font}), sans-serif` : undefined) }}
    >
      {settings.site_font === 'custom' && settings.custom_font_id && (
        <style dangerouslySetInnerHTML={{__html: `
          @font-face {
            font-family: 'CustomUserFont';
            src: url('/api/proxy-font?id=${settings.custom_font_id}') format('${(settings.custom_font_name || '').endsWith(".otf") ? "opentype" : "truetype"}');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
        `}} />
      )}
      <TopNavbar settings={settings} />

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[min(800px,100vw)] h-[600px] bg-blue-600/15 blur-[120px] rounded-full mix-blend-screen animate-pulse"></div>
          <div className="absolute top-[15%] left-[20%] w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-screen"></div>
          <div className="absolute top-[10%] right-[15%] w-[250px] h-[250px] bg-yellow-500/8 blur-[100px] rounded-full mix-blend-screen"></div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        </div>

        <div className="flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 lg:pt-44 pb-8 sm:pb-12">
          {/* Badge */}
          <header className="text-center relative z-10 w-full max-w-4xl mx-auto mb-12 sm:mb-16 lg:mb-20">
            {settings.hero_badge && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase mb-6 sm:mb-8 shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:shadow-[0_0_30px_rgba(234,179,8,0.25)] transition-all cursor-default">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{settings.hero_badge}</span>
              </div>
            )}
            
            {/* Hero Title */}
            <h1 
              className="font-extrabold tracking-[-0.03em] mb-5 sm:mb-6 leading-[1.1] drop-shadow-lg"
              style={{ 
                fontSize: settings.hero_title_size ? `clamp(2rem, 7vw, ${settings.hero_title_size}px)` : undefined,
                color: settings.hero_title_color || undefined
              }}
              dangerouslySetInnerHTML={{ __html: settings.hero_title || 'Default Title' }}
            />
            
            {settings.hero_subtitle && (
              <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-light leading-relaxed px-2">
                {settings.hero_subtitle}
              </p>
            )}

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-8 sm:mt-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-400">
                <Zap className="w-3 h-3 text-yellow-400" /> IoT Solutions
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-400">
                <Globe className="w-3 h-3 text-blue-400" /> Web Applications
              </div>
            </div>
          </header>

          {/* CTA */}
          {settings.cta_text && (
            <div className="text-center z-10 mb-10 sm:mb-14 lg:mb-16">
              <style suppressHydrationWarning>{`
                @keyframes ctaColorSwitch {
                  0%, 100% { 
                    color: ${settings.cta_color || '#ef4444'}; 
                    text-shadow: 0 0 20px ${settings.cta_color || '#ef4444'}50; 
                  }
                  50% { 
                    color: #fbbf24; 
                    text-shadow: 0 0 30px rgba(251, 191, 36, 0.7); 
                  }
                }
                .cta-animated-text {
                  animation: ctaColorSwitch 2.5s infinite ease-in-out;
                }
              `}</style>
              <a href="#projects" className="inline-flex items-center gap-2 group">
                <p 
                  className="cta-animated-text font-bold tracking-wider"
                  style={{ fontSize: `clamp(14px, 3vw, ${settings.cta_size || '18'}px)` }}
                >
                  {settings.cta_text}
                </p>
                <ChevronDown className="w-5 h-5 text-yellow-400 animate-bounce" />
              </a>
            </div>
          )}

          {/* Project Grid */}
          <div id="projects" className="w-full max-w-7xl mx-auto z-10 scroll-mt-24">
            <ProjectGrid projects={projects} />
          </div>

        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
