"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Settings2, Shield, AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    hero_title: "",
    hero_title_size: "72",
    hero_title_color: "#ffffff",
    hero_subtitle: "",
    hero_badge: "",
    facebook_url: "",
    contact_email: "",
    contact_phone: "",
    line_id: "",
    youtube_url: "",
    instagram_url: "",
    tiktok_url: "",
    address: "",
    footer_description: "",
    cta_text: "คลิกเลือกดูผลงานผลงานได้เลย",
    cta_size: "18",
    cta_color: "#ef4444",
    site_font: "inter"
  });
  const [pendingChanges, setPendingChanges] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch role
      const meRes = await fetch("/api/admin/me");
      const meData = await meRes.json();
      if (meData.success) setUserRole(meData.role);

      // Fetch settings
      const settingsRes = await fetch("/api/admin/settings");
      const settingsData = await settingsRes.json();
      setSettings(settingsData);

      // Fetch pending if admin/approver
      if (['admin', 'approver'].includes(meData.role)) {
        const pendingRes = await fetch("/api/admin/settings?action=pending");
        const pendingData = await pendingRes.json();
        if (pendingData.updates) {
          setPendingChanges(pendingData);
        }
      }
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFontUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    
    // Extract drive ID
    let driveId = url;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      driveId = match[1];
    } else if (url.includes('?id=')) {
      const params = new URLSearchParams(url.split('?')[1]);
      driveId = params.get('id') || url;
    }

    setSettings((prev: any) => ({
      ...prev,
      custom_font_id: driveId,
      custom_font_name: url ? "Google Drive Link" : "",
      site_font: url ? "custom" : prev.site_font
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        if (data.pending) {
          // If was adminuser, maybe refresh or just show success
        }
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (e: any) {
      toast.error("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsProcessingApproval(true);
    try {
      const res = await fetch("/api/admin/settings?action=approve", { method: "POST" });
      if (res.ok) {
        toast.success("Settings approved!");
        setPendingChanges(null);
        fetchData(); // Refresh to get the live settings
      } else {
        toast.error("Failed to approve settings");
      }
    } catch (err) {
      toast.error("Error approving settings");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Are you sure you want to reject these changes?")) return;
    setIsProcessingApproval(true);
    try {
      const res = await fetch("/api/admin/settings?action=reject", { method: "POST" });
      if (res.ok) {
        toast.success("Settings rejected");
        setPendingChanges(null);
      } else {
        toast.error("Failed to reject settings");
      }
    } catch (err) {
      toast.error("Error rejecting settings");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const isAdminUser = userRole === 'adminuser';
  const canApprove = ['admin', 'approver'].includes(userRole || '');

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Pending Banner for Admin/Approver */}
      {canApprove && pendingChanges && (
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-yellow-400/20 rounded-2xl flex items-center justify-center text-yellow-400">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Pending Changes Detected</h3>
              <p className="text-slate-400 text-sm">
                Requested by <span className="text-yellow-400 font-bold">@{pendingChanges.requestedBy}</span> on {new Date(pendingChanges.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={handleApprove}
              disabled={isProcessingApproval}
              className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 size={18} /> Approve
            </button>
            <button 
              onClick={handleReject}
              disabled={isProcessingApproval}
              className="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <XCircle size={18} /> Reject
            </button>
          </div>
        </div>
      )}

      {/* Intro Banner for AdminUser */}
      {isAdminUser && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex items-center gap-4 backdrop-blur-xl">
           <AlertCircle className="text-yellow-400 shrink-0" size={24} />
           <p className="text-slate-300 text-sm">
             You are editing in <strong>Draft Mode</strong>. Any changes you save will be submitted to the <span className="text-yellow-400">Admin</span> for approval before they appear live on the website.
           </p>
        </div>
      )}

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
          {isSaving ? "Saving..." : isAdminUser ? "Submit for Review" : "Save Settings"}
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

        {/* Global Typography */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800 shadow-2xl h-fit">
          <div className="flex items-center gap-3 mb-6">
            <Settings2 className="text-yellow-400" size={24} />
            <h2 className="text-xl font-bold text-white">Global Typography</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Display Font Family</label>
              <select 
                name="site_font" 
                value={settings.site_font || "inter"} 
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all cursor-pointer font-bold appearance-none"
              >
                <option value="inter">Inter (English Standard)</option>
                <option value="kanit">Kanit - คณิต</option>
                <option value="prompt">Prompt - พร้อม</option>
                <option value="sarabun">Sarabun - สารบรรณ</option>
                <option value="mitr">Mitr - มิตร</option>
                {settings.custom_font_id && (
                  <option value="custom">Custom Font - {settings.custom_font_name || 'Uploaded Font'}</option>
                )}
              </select>
              <p className="text-xs text-slate-500 mt-2 mb-4">Fonts will apply to the main website layout. Inter is standard. Kanit and Prompt are great for Thai context.</p>

              <div className="p-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-700 mt-4">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Google Drive Font URL (.ttf / .otf)</label>
                <div className="space-y-3">
                  <input 
                    type="url" 
                    placeholder="https://drive.google.com/file/d/1128M.../view"
                    onChange={handleFontUrlChange} 
                    defaultValue={settings.custom_font_id ? `https://drive.google.com/file/d/${settings.custom_font_id}/view` : ""}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all text-sm"
                  />
                  {settings.custom_font_id && (
                    <p className="text-xs text-green-400">Drive ID extracted ({settings.custom_font_id}). It's ready to use as "Custom Font" in the dropdown.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800 shadow-2xl h-fit">
          <div className="flex items-center gap-3 mb-6">
            <Settings2 className="text-yellow-400" size={24} />
            <h2 className="text-xl font-bold text-white">ข้อมูลติดต่อ & ช่องทางสื่อสาร</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">อีเมลติดต่อ</label>
              <input 
                type="email" 
                name="contact_email" 
                value={settings.contact_email || ""} 
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all"
                placeholder="hello@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">เบอร์โทรศัพท์</label>
              <input 
                type="text" 
                name="contact_phone" 
                value={settings.contact_phone || ""} 
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all"
                placeholder="0xx-xxx-xxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">LINE ID</label>
              <input 
                type="text" 
                name="line_id" 
                value={settings.line_id || ""} 
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all"
                placeholder="@yourlineid"
              />
            </div>

            <div className="pt-4 border-t border-slate-800/80 space-y-5">
              <h3 className="text-yellow-400 font-semibold text-sm uppercase tracking-widest">โซเชียลมีเดีย</h3>
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
                <label className="block text-sm font-semibold text-slate-300 mb-2">YouTube URL</label>
                <input 
                  type="text" 
                  name="youtube_url" 
                  value={settings.youtube_url || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all"
                  placeholder="https://youtube.com/@..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Instagram URL</label>
                <input 
                  type="text" 
                  name="instagram_url" 
                  value={settings.instagram_url || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all"
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">TikTok URL</label>
                <input 
                  type="text" 
                  name="tiktok_url" 
                  value={settings.tiktok_url || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all"
                  placeholder="https://tiktok.com/@..."
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 space-y-5">
              <h3 className="text-yellow-400 font-semibold text-sm uppercase tracking-widest">ที่อยู่ & Footer</h3>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">ที่อยู่ / สถานที่ตั้ง</label>
                <textarea 
                  name="address" 
                  rows={2}
                  value={settings.address || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all"
                  placeholder="123 ถ.xxx อ.xxx จ.xxx 12345"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">ข้อความท้ายเว็บ (Footer Description)</label>
                <textarea 
                  name="footer_description" 
                  rows={2}
                  value={settings.footer_description || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all"
                  placeholder="ขับเคลื่อนนวัตกรรม IoT และระบบอัจฉริยะ เพื่ออนาคตที่ดีกว่า"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

