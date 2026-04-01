import { getPublishedProjects } from "@/lib/google/sheets";
import { getSiteSettings } from "@/lib/google/settings";
import ProjectGrid from "./ProjectGrid";
import TopNavbar from "@/components/TopNavbar";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [projects, settings] = await Promise.all([
    getPublishedProjects(),
    getSiteSettings()
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-yellow-400 selection:text-slate-950">
      <TopNavbar settings={settings} />

      <main className="relative overflow-hidden flex flex-col items-center p-6 pt-32 sm:p-12 sm:pt-40 lg:p-24 lg:pt-48">
        {/* Background glowing orb */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[400px] sm:h-[600px] bg-blue-600/20 blur-[100px] sm:blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
        
        <header className="mb-16 sm:mb-24 mt-4 sm:mt-10 text-center relative z-10 w-full px-2">
          {settings.hero_badge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-6 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <Sparkles className="w-4 h-4" />
              <span>{settings.hero_badge}</span>
            </div>
          )}
          
          <h1 
            className="font-extrabold tracking-tighter mb-6 leading-tight drop-shadow-lg"
            style={{ 
              fontSize: settings.hero_title_size ? `clamp(2.5rem, 8vw, ${settings.hero_title_size}px)` : undefined,
              color: settings.hero_title_color || undefined
            }}
            dangerouslySetInnerHTML={{ __html: settings.hero_title || 'Default Title' }}
          />
          
          {settings.hero_subtitle && (
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed px-4">
              {settings.hero_subtitle}
            </p>
          )}
        </header>

        <div className="w-full max-w-7xl mx-auto z-10">
          <ProjectGrid projects={projects} />
        </div>
      </main>
    </div>
  );
}
