"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import { Save, UploadCloud, Loader2, Link as LinkIcon, Clock, Download } from "lucide-react";

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
  const codeToCopy = `function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('ระบบจัดการ - DeeDevIOT')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeToCopy);
    alert("คัดลอกโค้ดไปยังคลิปบอร์ดแล้ว!");
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-slate-950 text-slate-100 font-sans space-y-5">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-yellow-400">Google Apps Script Integration Guide</h3>
        <p className="text-xs text-slate-400 mt-1">ทำตามขั้นตอนด้านล่างเพื่อนำ Google Apps Script ของคุณมาแสดงผลบนเว็บไซต์</p>
      </div>

      <div className="space-y-5">
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0 font-mono text-xs font-bold text-yellow-400">1</div>
          <div className="space-y-1.5 flex-1">
            <h4 className="text-sm font-bold text-slate-200">แก้ไขฟังก์ชัน doGet() ใน Apps Script</h4>
            <p className="text-xs text-slate-400">เปิดสคริปต์ของคุณและเพิ่ม <code className="text-yellow-400">.setXFrameOptionsMode(...)</code> เพื่ออนุญาตให้แสดงผลใน iframe:</p>
            <div className="relative group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-1.5">
              <pre className="p-3 text-[10px] sm:text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                {codeToCopy}
              </pre>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2 right-2 text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-2.5 py-1 rounded-md font-bold transition-all"
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-800/60 pt-3">
          <div className="w-6 h-6 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0 font-mono text-xs font-bold text-yellow-400">2</div>
          <div className="space-y-1 flex-1">
            <h4 className="text-sm font-bold text-slate-200">สร้างการให้บริการ (New Deployment)</h4>
            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
              <li>คลิกปุ่ม <strong className="text-slate-300">Deploy (การทำให้ใช้งานได้)</strong> &gt; <strong className="text-slate-300">New deployment</strong></li>
              <li>เลือกประเภทเป็น <strong className="text-slate-300">Web app (เว็บแอป)</strong></li>
              <li>ตั้งค่า <strong className="text-slate-300">Execute as (เรียกใช้ในฐานะ)</strong> เป็น <strong className="text-slate-300">Me (ฉัน)</strong></li>
              <li>ตั้งค่า <strong className="text-slate-300">Who has access (ผู้มีสิทธิ์เข้าถึง)</strong> เป็น <strong className="text-slate-300">Anyone (ทุกคน)</strong></li>
              <li>กด <strong className="text-slate-300">Deploy</strong> และคัดลอก **Web app URL**</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-800/60 pt-3">
          <div className="w-6 h-6 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0 font-mono text-xs font-bold text-yellow-400">3</div>
          <div className="space-y-1 flex-1">
            <h4 className="text-sm font-bold text-slate-200">วาง URL ในระบบ</h4>
            <p className="text-xs text-slate-400">วางลิงก์ที่คัดลอกมาใส่ในช่อง <strong className="text-yellow-400">Apps Script URL</strong> ด้านบน แล้วกดบันทึกโปรเจกต์</p>
          </div>
        </div>
      </div>
    </div>
  );
}
