import { getPublishedProjects } from "@/lib/google/sheets";
import { getSiteSettings } from "@/lib/google/settings";
import ProjectGrid from "./ProjectGrid";
import TopNavbar from "@/components/TopNavbar";
import Footer from "@/components/Footer";
import { Sparkles } from "lucide-react";

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

export default async function Home() {
  const [projects, settings] = await Promise.all([
    getPublishedProjects(),
    getSiteSettings()
  ]);

  const projectCount = projects.length;
  const totalDownloads = projects.reduce((sum, p) => sum + (p.download_count || 0), 0);

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
      <TopNavbar settings={settings} projectCount={projectCount} totalDownloads={totalDownloads} />

      {/* Main Content & Showcase */}
      <main className="relative overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[3%] left-1/2 -translate-x-1/2 w-[min(800px,100vw)] h-[500px] bg-blue-600/15 blur-[120px] rounded-full mix-blend-screen animate-pulse"></div>
          <div className="absolute top-[10%] left-[15%] w-[250px] h-[250px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-screen"></div>
          <div className="absolute top-[8%] right-[15%] w-[250px] h-[250px] bg-yellow-500/8 blur-[100px] rounded-full mix-blend-screen"></div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        </div>

        <div className="flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-28 pb-12">
          {/* Compact Streamlined Hero Header */}
          <header className="text-center relative z-10 w-full max-w-4xl mx-auto mb-6 sm:mb-8">
            {settings.hero_badge && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 text-[11px] sm:text-xs font-semibold tracking-[0.15em] uppercase mb-3 sm:mb-4 shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:shadow-[0_0_30px_rgba(234,179,8,0.25)] transition-all cursor-default">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>{settings.hero_badge}</span>
              </div>
            )}
            
            {/* Hero Title */}
            <h1 
              className="font-extrabold tracking-[-0.03em] mb-2.5 sm:mb-3 leading-[1.15] drop-shadow-lg"
              style={{ 
                fontSize: settings.hero_title_size ? `clamp(1.75rem, 5vw, ${settings.hero_title_size}px)` : 'clamp(1.75rem, 4.5vw, 3.25rem)',
                color: settings.hero_title_color || undefined
              }}
              dangerouslySetInnerHTML={{ __html: settings.hero_title || 'Default Title' }}
            />
            
            {settings.hero_subtitle && (
              <p className="text-xs sm:text-sm md:text-base text-slate-400 max-w-2xl mx-auto font-light leading-relaxed px-2">
                {settings.hero_subtitle}
              </p>
            )}
          </header>

          {/* Project Showcase Section (Immediate Above-the-fold Focus) */}
          <div id="projects" className="w-full max-w-7xl mx-auto z-10 scroll-mt-20">
            <ProjectGrid projects={projects} />
          </div>

        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
