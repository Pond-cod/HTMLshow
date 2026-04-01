"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import { Save, UploadCloud, Loader2, Link as LinkIcon } from "lucide-react";

export default function EditProjectForm({ initialProject }: { initialProject: any }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: initialProject?.title || "",
    image_url: initialProject?.image_url || "",
    VDO_url: initialProject?.VDO_url || "",
    thumbnail_url: initialProject?.thumbnail_url || "",
    html_drive_id: initialProject?.html_drive_id || "",
    status: initialProject?.status || "draft",
  });
  
  const [htmlContent, setHtmlContent] = useState("");
  const [isLoadingHtml, setIsLoadingHtml] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  useEffect(() => {
    const fetchHtml = async () => {
      if (initialProject?.html_drive_id) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    
    // Auto-convert Google Drive viewer URLs to direct raw image URLs for rendering in <img> tags
    if ((e.target.name === 'thumbnail_url' || e.target.name === 'image_url') && value.includes('drive.google.com/file/d/')) {
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
        router.push("/admin");
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
          {isSaving ? "Saving..." : "Save Project"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Metadata Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-5">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-800/80 pb-4">Basic Info</h2>
            
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
              </select>
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
                  <span className="bg-slate-800 text-slate-400 font-bold text-xs px-3 py-2 flex items-center border-r border-slate-700 uppercase tracking-widest">Drive ID</span>
                  <input
                    type="text"
                    value={formData.html_drive_id}
                    onChange={(e) => {
                      let val = e.target.value.trim();
                      const match1 = val.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                      if (match1 && match1[1]) val = match1[1];
                      const match2 = val.match(/id=([a-zA-Z0-9_-]+)/);
                      if (match2 && match2[1]) val = match2[1];
                      setFormData(prev => ({ ...prev, html_drive_id: val }));
                    }}
                    placeholder="Paste full URL or ID here..."
                    className="bg-transparent text-sm font-mono text-yellow-400 w-48 px-3 py-1.5 outline-none"
                  />
                </div>
                
                {formData.html_drive_id ? (
                  <button
                    type="button"
                    onClick={async () => {
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
                )}
              </div>
            </div>
            
            <div className="flex-1 relative bg-[#1e1e1e]">
              {isLoadingHtml ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 gap-3 bg-[#1e1e1e] z-10">
                  <Loader2 className="w-6 h-6 animate-spin" /> Fetching raw source from Drive...
                </div>
              ) : activeTab === 'editor' ? (
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
              ) : (
                <iframe
                  title="Live Preview"
                  className="w-full h-full border-0 bg-white"
                  srcDoc={htmlContent || "<div style='padding:40px;text-align:center;font-family:sans-serif;color:#888;'><h2>No HTML Source Available</h2><p>Upload a .html file or type some code in the Code tab to see the preview here!</p></div>"}
                  sandbox="allow-scripts allow-same-origin"
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
