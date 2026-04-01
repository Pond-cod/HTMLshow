"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Settings2 } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    hero_title: "",
    hero_title_size: "72",
    hero_title_color: "#ffffff",
    hero_subtitle: "",
    hero_badge: "",
    facebook_url: "",
    contact_email: "",
    cta_text: "คลิกเลือกดูผลงานผลงานได้เลย",
    cta_size: "18",
    cta_color: "#ef4444"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setIsLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const promise = fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });

    toast.promise(promise, {
      loading: "Saving global settings to Google Sheets...",
      success: async (res) => {
        if (!res.ok) throw new Error("Failed to save");
        setIsSaving(false);
        return "Global Settings saved successfully!";
      },
      error: () => {
        setIsSaving(false);
        return "Failed to save settings.";
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Global Config</h1>
          <p className="text-slate-400 mt-2 font-medium">Control the texts explicitly shown on your frontend.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-slate-950 px-6 py-3 rounded-2xl font-bold shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center gap-2 transition-all hover:scale-105"
        >
          <Save size={20} strokeWidth={3} />
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Homepage Settings */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Settings2 className="text-yellow-400" size={24} />
            <h2 className="text-xl font-bold text-white">Homepage Hero</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Hero Badge Text</label>
              <input 
                type="text" 
                name="hero_badge" 
                value={settings.hero_badge || ""} 
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all"
                placeholder="e.g. Technology Powerhouse"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Hero Title (Allows HTML like &lt;br/&gt;)</label>
              <textarea 
                name="hero_title" 
                rows={3}
                value={settings.hero_title || ""} 
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all font-mono text-sm"
                placeholder="Gearing Up <br /> For The Future."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-950/30 p-4 rounded-xl border border-slate-800/80">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Title Size (px)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    name="hero_title_size" 
                    min="32" max="150" step="1"
                    value={settings.hero_title_size || "72"} 
                    onChange={handleChange}
                    className="w-full accent-yellow-400"
                  />
                  <span className="text-white font-mono text-sm bg-slate-800 px-2 py-1 rounded-md min-w-[3rem] text-center">{settings.hero_title_size || "72"}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Title Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    name="hero_title_color" 
                    value={settings.hero_title_color || "#ffffff"} 
                    onChange={handleChange}
                    className="w-10 h-10 rounded cursor-pointer bg-slate-800 border-0 p-1"
                  />
                  <input 
                    type="text" 
                    name="hero_title_color" 
                    value={settings.hero_title_color || "#ffffff"} 
                    onChange={handleChange}
                    className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-mono outline-none focus:border-yellow-400 border border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Hero Subtitle</label>
              <textarea 
                name="hero_subtitle" 
                rows={4}
                value={settings.hero_subtitle || ""} 
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all"
              />
            </div>

            <div className="pt-4 border-t border-slate-800/80 mt-4 space-y-5">
              <h3 className="text-yellow-400 font-semibold mb-2 text-sm uppercase tracking-widest">Call-To-Action Text (CTA)</h3>
              
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Pulsing CTA Text</label>
                <input 
                  type="text" 
                  name="cta_text" 
                  value={settings.cta_text || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all"
                  placeholder="คลิกเลือกดูผลงานผลงานได้เลย"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-950/30 p-4 rounded-xl border border-slate-800/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Font Size (px)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      name="cta_size" 
                      min="12" max="64" step="1"
                      value={settings.cta_size || "18"} 
                      onChange={handleChange}
                      className="w-full accent-yellow-400"
                    />
                    <span className="text-white font-mono text-sm bg-slate-800 px-2 py-1 rounded-md min-w-[3rem] text-center">{settings.cta_size || "18"}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Base Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      name="cta_color" 
                      value={settings.cta_color || "#ef4444"} 
                      onChange={handleChange}
                      className="w-10 h-10 rounded cursor-pointer bg-slate-800 border-0 p-1"
                    />
                    <input 
                      type="text" 
                      name="cta_color" 
                      value={settings.cta_color || "#ef4444"} 
                      onChange={handleChange}
                      className="flex-1 min-w-0 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-mono outline-none focus:border-yellow-400 border border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Global Connections */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800 shadow-2xl h-fit">
          <div className="flex items-center gap-3 mb-6">
            <Settings2 className="text-yellow-400" size={24} />
            <h2 className="text-xl font-bold text-white">Global Connections</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Facebook URL</label>
              <input 
                type="text" 
                name="facebook_url" 
                value={settings.facebook_url || ""} 
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Contact Email</label>
              <input 
                type="email" 
                name="contact_email" 
                value={settings.contact_email || ""} 
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all"
                placeholder="hello@company.com"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
