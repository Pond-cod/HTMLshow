"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import { 
  Save, 
  UploadCloud, 
  Loader2, 
  Link as LinkIcon, 
  Clock, 
  Download, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Layers, 
  FileCode, 
  Info,
  Star 
} from "lucide-react";

export default function EditProjectForm({ initialProject }: { initialProject: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams ? searchParams.get("type") : null;

  const [formData, setFormData] = useState({
    title: initialProject?.title || "",
    image_url: initialProject?.image_url || "",
    VDO_url: initialProject?.VDO_url || "",
    thumbnail_url: initialProject?.thumbnail_url || "",
    html_drive_id: initialProject?.html_drive_id || "",
    status: initialProject?.status || "draft",
    is_featured: Boolean(initialProject?.is_featured) || false,
    manual_text: initialProject?.manual_text || "",
    manual_image_url: initialProject?.manual_image_url || "",
    manual_url: initialProject?.manual_url || "",
    learning_text: initialProject?.learning_text || "",
    learning_image_url: initialProject?.learning_image_url || "",
    learning_url: initialProject?.learning_url || "",
    other_text: initialProject?.other_text || "",
    other_image_url: initialProject?.other_image_url || "",
    other_url: initialProject?.other_url || "",
  });
  
  const [projectType, setProjectType] = useState<"html" | "gas">(
    typeParam === 'gas' ? 'gas' : (initialProject?.html_drive_id?.startsWith('http') ? 'gas' : 'html')
  );

  const [htmlContent, setHtmlContent] = useState("");
  const [isLoadingHtml, setIsLoadingHtml] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
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

  useEffect(() => {
    const fetchHtml = async () => {
      if (initialProject?.html_drive_id) {
        if (initialProject.html_drive_id.startsWith('http')) {
          setHtmlContent(`<!-- External URL detected: \n\n${initialProject.html_drive_id}\n\nCheck the Live Preview tab. -->`);
          return;
        }
        setIsLoadingHtml(true);
        try {
          const res = await fetch(`/api/admin/html?id=${initialProject.html_drive_id}`);
          if (res.ok) {
            setHtmlContent(await res.text());
          } else {
            const errObj = await res.json().catch(() => ({ message: res.statusText }));
            setHtmlContent(`<!-- ERROR: Could not fetch HTML from Google Drive! -> ${errObj.message} -->`);
          }
        } catch (error: any) {
          setHtmlContent(`<!-- Network Error matching Drive fetch -> ${error.message} -->`);
        } finally {
          setIsLoadingHtml(false);
        }
      }
    };
    fetchHtml();
  }, [initialProject?.html_drive_id]);

  useEffect(() => {
    if (projectType === 'gas') {
      const urlVal = formData.html_drive_id || 'https://script.google.com/macros/s/.../exec';
      setHtmlContent(`<!-- External URL detected: \n\n${urlVal}\n\nCheck the Live Preview tab. -->`);
    } else {
      if (htmlContent.includes('External URL detected')) {
        setHtmlContent('');
      }
    }
  }, [projectType, formData.html_drive_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    
    // Auto-convert Google Drive viewer URLs to direct raw image URLs for rendering in <img> tags
    if ((e.target.name === 'thumbnail_url' || e.target.name === 'image_url' || e.target.name === 'manual_image_url' || e.target.name === 'learning_image_url') && value.includes('drive.google.com/file/d/')) {
        const match = value.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            value = `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
    }

    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (fieldName === "html_drive_id") {
      // For HTML files, we simply read the raw file contents locally 
      // instead of uploading it to Google Drive.
      const fileReader = new FileReader();
      fileReader.onload = (readerEvent) => {
        setHtmlContent(readerEvent.target?.result as string);
        // If no ID exists yet to map the HTML to, generate one locally
        if (!formData.html_drive_id) {
          const newHtmlId = initialProject?.id || `html_${Date.now()}`;
          setFormData((prev) => ({ ...prev, html_drive_id: newHtmlId }));
        }
      };
      fileReader.readAsText(file);
      return;
    }

    setUploadingField(fieldName);
    
    try {
      const data = new FormData();
      data.append("file", file);
      
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      
      if (result.success) {
        setFormData((prev) => ({ ...prev, [fieldName]: result.url }));
      } else {
        alert(result.message || "Failed to upload file");
      }
    } catch (err) {
      alert("Error uploading file");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save metadata to Sheets
      const url = "/api/admin/projects";
      const method = initialProject ? "PUT" : "POST";
      const bodyPayload = initialProject ? { id: initialProject.id, ...formData } : formData;

      const sheetRes = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      // 2. Save HTML content to Sheets instead of Drive
      if (formData.html_drive_id && htmlContent) {
        await fetch("/api/admin/html", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: formData.html_drive_id,
            content: htmlContent,
          }),
        });
      }

      if (sheetRes.ok) {
        router.push("/admin/projects");
        router.refresh();
      } else {
        const errObj = await sheetRes.json().catch(() => ({}));
        alert(`Failed to save project. ${errObj.message || ""}`);
      }
    } catch (e: any) {
      alert(`Error saving project: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.title || "project"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isAdminUser = userRole === 'adminuser';

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            {initialProject ? "Edit Project" : "New Project"}
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Configure your project details and HTML content</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 px-6 py-3 rounded-2xl font-bold shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5 stroke-[3px]" />}
          {isSaving ? "Saving..." : isAdminUser ? "Submit for Review" : "Save Project"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Metadata Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-5">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-800/80 pb-4">Basic Info</h2>
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Project Type</label>
              <div className="flex bg-slate-850 rounded-xl p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setProjectType('html')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${projectType === 'html' ? 'bg-yellow-400 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  HTML File
                </button>
                <button
                  type="button"
                  onClick={() => setProjectType('gas')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${projectType === 'gas' ? 'bg-blue-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Apps Script
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all"
                placeholder="Ex: Marketing Landing Page"
              />
            </div>
            
            {!isAdminUser ? (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-xl text-white outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="pending">Pending Approval</option>
                </select>
              </div>
            ) : (
              <div className="p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                 <p className="text-sm text-yellow-500 font-medium flex items-center gap-2">
                    <Clock size={16} /> Status will be set to Pending Approval
                 </p>
              </div>
            )}

            {/* Featured Project Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl hover:border-yellow-400/40 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg mt-0.5 ${formData.is_featured ? 'bg-yellow-400/20 text-yellow-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Star size={18} className={formData.is_featured ? "fill-yellow-400" : ""} />
                </div>
                <div>
                  <label htmlFor="is_featured" className="text-sm font-semibold text-white block cursor-pointer">
                    โปรเจกต์เด่น (Featured Project)
                  </label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    นำเสนอให้แสดงขึ้นก่อนในหน้าแรก พร้อมป้ายกำกับพิเศษ
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                className="w-5 h-5 accent-yellow-400 rounded cursor-pointer shrink-0"
              />
            </div>
          </div>

          {/* Media Links Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-5">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-800/80 pb-4">Media Files</h2>

            {/* Thumbnail */}
            <div>
               <label className="block text-sm font-semibold text-slate-300 mb-2 flex justify-between items-center">
                 <span>Thumbnail Image</span>
                 <UploadButton field="thumbnail_url" uploadingField={uploadingField} onUpload={handleFileUpload} accept="image/*" />
               </label>
               <div className="flex gap-0 group mt-3">
                 <div className="p-3 border border-slate-700 border-r-0 rounded-l-xl bg-slate-800/50 flex items-center justify-center shrink-0 group-focus-within:border-yellow-400 transition-colors">
                    <LinkIcon className="text-slate-400 w-5 h-5"/>
                 </div>
                 <input type="text" name="thumbnail_url" value={formData.thumbnail_url} onChange={handleChange} className="w-full px-4 py-3 border border-slate-700 rounded-r-xl bg-slate-800/30 text-white text-sm outline-none group-focus-within:border-yellow-400 transition-colors" placeholder="Drive URL will appear here" />
               </div>
            </div>
          </div>

          {/* Highlight Resources Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-5">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-800/80 pb-4">คู่มือ & สื่อการเรียน</h2>
            
            <div className="space-y-4">
               <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                 <LinkIcon size={16} /> คู่มือการใช้งาน (User Manual)
               </h3>
               <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ข้อความแสดงบนปุ่ม</label>
                  <input type="text" name="manual_text" value={formData.manual_text} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-lg text-white outline-none text-sm transition-colors" placeholder="Ex: คลิกเพื่ออ่านคู่มือ..." />
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">URL ลิงก์ปลายทาง</label>
                  <input type="text" name="manual_url" value={formData.manual_url} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-lg text-white outline-none text-sm transition-colors" placeholder="https://..." />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-300 mb-1 flex justify-between items-center">
                   <span>ภาพหน้าปก (Cover Image)</span>
                   <UploadButton field="manual_image_url" uploadingField={uploadingField} onUpload={handleFileUpload} accept="image/*" label="Upload" />
                 </label>
                 <input type="text" name="manual_image_url" value={formData.manual_image_url} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 focus:border-yellow-400 rounded-lg text-white outline-none text-sm mt-1 transition-colors" placeholder="Drive URL หรือ Image URL" />
               </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800/50">
               <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                 <LinkIcon size={16} /> สื่อการเรียน (Learning Materials)
               </h3>
               <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ข้อความแสดงบนปุ่ม</label>
                  <input type="text" name="learning_text" value={formData.learning_text} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 focus:border-blue-400 rounded-lg text-white outline-none text-sm transition-colors" placeholder="Ex: ดูวิดีโอสอน..." />
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">URL ลิงก์ปลายทาง</label>
                  <input type="text" name="learning_url" value={formData.learning_url} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 focus:border-blue-400 rounded-lg text-white outline-none text-sm transition-colors" placeholder="https://..." />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-300 mb-1 flex justify-between items-center">
                   <span>ภาพหน้าปก (Cover Image)</span>
                   <UploadButton field="learning_image_url" uploadingField={uploadingField} onUpload={handleFileUpload} accept="image/*" label="Upload" />
                 </label>
                 <input type="text" name="learning_image_url" value={formData.learning_image_url} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 focus:border-blue-400 rounded-lg text-white outline-none text-sm mt-1 transition-colors" placeholder="Drive URL หรือ Image URL" />
               </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-slate-800/50">
               <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                 <LinkIcon size={16} /> อื่นๆ (Other Resources)
               </h3>
               <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ข้อความแสดงบนปุ่ม</label>
                  <input type="text" name="other_text" value={formData.other_text} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 focus:border-emerald-400 rounded-lg text-white outline-none text-sm transition-colors" placeholder="Ex: ดูข้อมูลเพิ่มเติม..." />
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">URL ลิงก์ปลายทาง</label>
                  <input type="text" name="other_url" value={formData.other_url} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 focus:border-emerald-400 rounded-lg text-white outline-none text-sm transition-colors" placeholder="https://..." />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-300 mb-1 flex justify-between items-center">
                   <span>ภาพหน้าปก (Cover Image)</span>
                   <UploadButton field="other_image_url" uploadingField={uploadingField} onUpload={handleFileUpload} accept="image/*" label="Upload" />
                 </label>
                 <input type="text" name="other_image_url" value={formData.other_image_url} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 focus:border-emerald-400 rounded-lg text-white outline-none text-sm mt-1 transition-colors" placeholder="Drive URL หรือ Image URL" />
               </div>
            </div>
          </div>
        </div>

        {/* Code & Preview Editor */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden h-[800px] flex flex-col">
            <div className="border-b border-slate-800/80 p-5 shrink-0 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-3">
                  <span className="bg-yellow-400/20 text-yellow-400 px-2.5 py-1 rounded-md text-sm font-mono tracking-widest border border-yellow-400/30">&lt;/&gt;</span>
                  HTML Space
                </h2>
                <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                  <button type="button" onClick={() => setActiveTab('editor')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'editor' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Code</button>
                  <button type="button" onClick={() => setActiveTab('preview')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'preview' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Live Preview</button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden focus-within:border-yellow-400 transition-colors">
                  <span className="bg-slate-800 text-slate-400 font-bold text-xs px-3 py-2 flex items-center border-r border-slate-700 uppercase tracking-widest">
                    {projectType === 'gas' ? 'Apps Script URL' : 'Drive ID'}
                  </span>
                  <input
                    type="text"
                    value={formData.html_drive_id}
                    onChange={(e) => {
                      let val = e.target.value.trim();
                      if (projectType === 'html' && val.includes('drive.google.com')) {
                        const match1 = val.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                        if (match1 && match1[1]) val = match1[1];
                        const match2 = val.match(/id=([a-zA-Z0-9_-]+)/);
                        if (match2 && match2[1]) val = match2[1];
                      }
                      setFormData(prev => ({ ...prev, html_drive_id: val }));
                    }}
                    placeholder={projectType === 'gas' ? "https://script.google.com/macros/s/.../exec" : "Paste URL, App Script, or ID here..."}
                    className="bg-transparent text-sm font-mono text-yellow-400 w-64 px-3 py-1.5 outline-none text-ellipsis"
                  />
                </div>
                
                {projectType === 'html' && (
                  formData.html_drive_id ? (
                    <button
                      type="button"
                      onClick={async () => {
                        if (formData.html_drive_id.startsWith('http')) {
                          setHtmlContent(`<!-- External URL detected: \n\n${formData.html_drive_id}\n\nCheck the Live Preview tab. -->`);
                          return;
                        }
                        setIsLoadingHtml(true);
                        try {
                          const res = await fetch(`/api/admin/html?id=${formData.html_drive_id}`);
                          if (res.ok) {
                            setHtmlContent(await res.text());
                          } else {
                            const err = await res.json().catch(() => ({}));
                            setHtmlContent(`<!-- ERROR: Could not fetch HTML: ${err.message || 'Access Denied'} -->`);
                          }
                        } catch (e: any) {
                          setHtmlContent(`<!-- Error: ${e.message} -->`);
                        } finally {
                          setIsLoadingHtml(false);
                        }
                      }}
                      className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap shadow-md focus:border-yellow-400"
                    >
                      Load File
                    </button>
                  ) : (
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-2 whitespace-nowrap">
                      {uploadingField === "html_drive_id" ? <Loader2 className="w-4 h-4 animate-spin text-yellow-400" /> : <UploadCloud className="w-4 h-4 text-yellow-400" />}
                      Upload File
                      <input type="file" className="hidden" accept=".html,text/html" onChange={(e) => handleFileUpload(e, "html_drive_id")} />
                    </label>
                  )
                )}
                {projectType === 'html' && htmlContent && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-yellow-400 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap shadow-md focus:border-yellow-400 flex items-center gap-1.5"
                  >
                    <Download size={14} className="text-yellow-400" />
                    Download Code
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 relative bg-[#1e1e1e]">
              {isLoadingHtml ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 gap-3 bg-[#1e1e1e] z-10">
                  <Loader2 className="w-6 h-6 animate-spin" /> Fetching raw source...
                </div>
              ) : activeTab === 'editor' ? (
                projectType === 'gas' ? (
                  <GasGuidePanel />
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-5 py-3 text-xs text-yellow-300 flex items-center gap-2">
                      <span className="font-bold uppercase tracking-wider bg-yellow-400/20 px-1.5 py-0.5 rounded text-[10px]">ข้อกำหนดสไตล์</span>
                      <span>โปรเจกต์จะรันภายใน Sandbox IFrame <b>ห้ามสร้างไฟล์ CSS แยกต่างหาก</b> ให้ใช้ Bootstrap CDN หรือเขียน Inline CSS เท่านั้น</span>
                    </div>
                    <div className="flex-1">
                      <Editor
                        height="100%"
                        defaultLanguage="html"
                        theme="vs-dark"
                        value={htmlContent}
                        onChange={(val: string | undefined) => setHtmlContent(val || "")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          wordWrap: "on",
                          padding: { top: 16 }
                        }}
                      />
                    </div>
                  </div>
                )
              ) : (
                  <iframe
                  title="Live Preview"
                  className="w-full h-full border-0 bg-white"
                  srcDoc={formData.html_drive_id.startsWith('http') ? undefined : (htmlContent || "<div style='padding:40px;text-align:center;font-family:sans-serif;color:#888;'><h2>No HTML Source Available</h2><p>Upload a .html file or type some code in the Code tab to see the preview here!</p></div>")}
                  src={formData.html_drive_id.startsWith('http') ? formData.html_drive_id : undefined}
                  {...(!formData.html_drive_id.startsWith('http') ? { sandbox: "allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-top-navigation-by-user-activation" } : {})}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadButton({ field, uploadingField, onUpload, accept, label = "Upload Image" }: any) {
  const isUploading = uploadingField === field;
  return (
    <label className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
      isUploading ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700 hover:text-yellow-300'
    }`}>
      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
      {isUploading ? "Uploading..." : label}
      <input type="file" className="hidden" accept={accept} onChange={(e) => onUpload(e, field)} disabled={isUploading} />
    </label>
  );
}

function GasGuidePanel() {
  const [templateType, setTemplateType] = useState<'template' | 'simple'>('template');
  const [copied, setCopied] = useState(false);

  const templateCode = `function doGet(e) {
  // รองรับหลายหน้า (เช่น ?page=admin หรือหน้าแรก Index)
  let page = (e.parameter.page === 'admin') ? 'Admin' : 'Index';
  let template = HtmlService.createTemplateFromFile(page);
  template.scriptUrl = ScriptApp.getService().getUrl();

  return template.evaluate()
    .setTitle(page === 'Admin' ? 'ระบบหลังบ้าน' : 'ระบบจัดการ')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // 👈 สำคัญมาก: อนุญาตให้แสดงผลใน iframe
}`;

  const simpleCode = `function doGet(e) {
  // แสดงผลไฟล์ Index.html หน้าเดียว
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('ระบบจัดการ')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // 👈 สำคัญมาก: อนุญาตให้แสดงผลใน iframe
}`;

  const activeCode = templateType === 'template' ? templateCode : simpleCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="h-full overflow-y-auto p-5 sm:p-6 bg-slate-950 text-slate-100 font-sans space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="bg-yellow-400/20 text-yellow-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-yellow-400/30">
            Guide
          </span>
          <h3 className="text-lg font-bold text-white tracking-wide">
            Google Apps Script Integration Guide
          </h3>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          ขั้นตอนการตั้งค่า Apps Script ให้แสดงผลบนเว็บไซต์ผ่าน iframe ได้อย่างสมบูรณ์โดยไม่ติดปัญหาความปลอดภัย (X-Frame-Options)
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-6">
        {/* Step 1 */}
        <div className="flex gap-3 sm:gap-4">
          <div className="w-7 h-7 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0 font-mono text-xs font-bold text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.15)]">
            1
          </div>
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-200">
                แก้ไขฟังก์ชัน <code className="text-yellow-400 font-mono bg-yellow-400/10 px-1.5 py-0.5 rounded">doGet(e)</code> ใน <span className="text-white font-mono">Code.gs</span>
              </h4>
              
              {/* Type Switcher */}
              <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setTemplateType('template')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                    templateType === 'template' 
                      ? 'bg-yellow-400 text-slate-950 font-bold shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  แบบหลายหน้า (Template)
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateType('simple')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                    templateType === 'simple' 
                      ? 'bg-yellow-400 text-slate-950 font-bold shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3 h-3" />
                  แบบหน้าเดียว (Index.html)
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              เปิดโปรเจกต์ใน Google Apps Script แล้วเพิ่ม <code className="text-amber-300 font-mono bg-amber-400/10 px-1 rounded">.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)</code> ต่อท้ายเพื่ออนุญาตให้แสดงใน iframe:
            </p>

            {/* Code Box */}
            <div className="relative group bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800/80 text-[11px] text-slate-400 font-mono">
                <span>Code.gs &gt; doGet(e)</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 text-[11px] sm:text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                {activeCode}
              </pre>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-200/90 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-yellow-300 font-semibold">ข้อสังเกตสำคัญ:</strong> หากใช้ <code className="font-mono text-white bg-black/30 px-1 rounded">template.evaluate()</code> ให้เติม <code className="font-mono text-yellow-300 bg-black/30 px-1 rounded">.setXFrameOptionsMode(...)</code> ต่อท้าย <code className="font-mono text-white bg-black/30 px-1 rounded">evaluate()</code>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-3 sm:gap-4 border-t border-slate-800/80 pt-5">
          <div className="w-7 h-7 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0 font-mono text-xs font-bold text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.15)]">
            2
          </div>
          <div className="space-y-3 flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-200">
              สร้างการให้บริการ (Deploy) และสิทธิ์การเข้าถึง
            </h4>
            
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider block">กรณีสร้างครั้งแรก (New Deployment)</span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>คลิกปุ่ม <strong className="text-white">Deploy (การทำให้ใช้งานได้)</strong> &gt; <strong className="text-white">New deployment</strong></li>
                  <li>เลือกประเภทเป็น ⚙️ <strong className="text-white">Web app (เว็บแอป)</strong></li>
                  <li>ตั้งค่า Execute as: <span className="text-emerald-400 font-semibold">Me (ฉัน / บัญชีของคุณ)</span></li>
                  <li>ตั้งค่า Who has access: <span className="text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">Anyone (ทุกคน)</span></li>
                  <li>กด <strong className="text-white">Deploy</strong> และคัดลอก **Web app URL**</li>
                </ol>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  กรณีแก้ไขโค้ดเดิม (สำคัญมาก ⚠️)
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  หากคุณเคย Deploy ไปแล้วและมีการแก้ไขโค้ดใน <code className="font-mono text-amber-300">Code.gs</code> <b>ระบบจะไม่เปลี่ยนตามทันที</b> คุณต้อง:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>ไปที่เมนู <strong className="text-white">Deploy &gt; Manage deployments</strong></li>
                  <li>คลิกไอคอน <strong className="text-white">ดินสอ (Edit)</strong> ด้านบน</li>
                  <li>ตรงช่อง Version ให้เลือกเป็น <strong className="text-amber-300">New version (เวอร์ชันใหม่)</strong></li>
                  <li>กดปุ่ม <strong className="text-white">Deploy</strong> เสมอ มิเช่นนั้นจะยังติด Error เดิม</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-3 sm:gap-4 border-t border-slate-800/80 pt-5">
          <div className="w-7 h-7 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0 font-mono text-xs font-bold text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.15)]">
            3
          </div>
          <div className="space-y-3 flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-200">
              ตรวจสอบรูปแบบ URL และวางในระบบ
            </h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-bold text-emerald-300 text-[11px]">URL ที่ถูกต้อง (Web App URL):</span>
                  <p className="font-mono text-[11px] text-slate-300 truncate mt-0.5">
                    https://script.google.com/macros/s/<span className="text-emerald-400">[DEPLOYMENT_ID]</span>/exec
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">*สังเกต: ต้องมีคำว่า <code className="text-emerald-400 font-mono">/macros/s/</code> และลงท้ายด้วย <code className="text-emerald-400 font-mono">/exec</code></span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-rose-950/20 border border-rose-500/30 rounded-xl p-3">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-bold text-rose-300 text-[11px]">URL ที่ผิด (ห้ามนำมาใส่):</span>
                  <p className="font-mono text-[11px] text-slate-400 truncate mt-0.5">
                    https://script.google.com/home/projects/.../edit
                  </p>
                  <span className="text-[10px] text-rose-300/80 block mt-0.5">*URL ที่ลงท้ายด้วย <code className="font-mono">/edit</code> คือหน้าต่างแก้ไขโค้ด ไม่ใช่หน้าเว็บแอป</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              นำ URL ที่ถูกต้องมาวางในช่อง <strong className="text-yellow-400 font-mono">Apps Script URL</strong> ด้านขวาบน แล้วกดปุ่ม <strong className="text-white">Save Project</strong>
            </p>
          </div>
        </div>

        {/* FAQ & Troubleshooting Section */}
        <div className="border-t border-slate-800/80 pt-5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <HelpCircle className="w-4 h-4 text-yellow-400" />
              <span>การแก้ไขปัญหาที่พบบ่อย (Troubleshooting)</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <p className="font-semibold text-rose-300 text-[11px] flex items-center gap-1.5">
                  <span>❌ หน้าเว็บขึ้นไอคอนไฟล์เศร้า / Console ฟ้อง Refused to display (X-Frame-Options)</span>
                </p>
                <p className="text-[11px] text-slate-400 pl-4 leading-relaxed">
                  เกิดจากสคริปต์ยังไม่มี <code className="text-yellow-400 font-mono">.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)</code> หรือหลังแก้โค้ดแล้วลืมกด Deploy เป็น <b>New version</b>
                </p>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <p className="font-semibold text-amber-300 text-[11px] flex items-center gap-1.5">
                  <span>⚠️ หน้าเว็บขึ้นให้ล็อกอิน Google ซ้ำๆ หรือสิทธิ์เข้าถึงถูกปฏิเสธ (Access Denied)</span>
                </p>
                <p className="text-[11px] text-slate-400 pl-4 leading-relaxed">
                  เกิดจากตอน Deploy ไม่ได้เลือก <b>Who has access</b> เป็น <b>Anyone (ทุกคน)</b> ทำให้ผู้เยี่ยมชมที่ไม่ใช่เจ้าของโปรเจกต์เปิดดูไม่ได้
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
