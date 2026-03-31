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
        if (fieldName === "html_drive_id") {
          setFormData((prev) => ({ ...prev, html_drive_id: result.fileId }));
          // Load the content immediately into the editor
          const fileReader = new FileReader();
          fileReader.onload = (e) => setHtmlContent(e.target?.result as string);
          fileReader.readAsText(file);
        } else {
          setFormData((prev) => ({ ...prev, [fieldName]: result.url }));
        }
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

      // 2. Save HTML content back to Drive if ID exists
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">
            {initialProject ? "Edit Project" : "New Project"}
          </h1>
          <p className="text-gray-500 mt-1">Configure your project details and HTML content</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all disabled:opacity-75"
        >
          {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          {isSaving ? "Saving..." : "Save Project"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-5">
            <h2 className="text-xl font-semibold dark:text-white mb-2 border-b border-gray-100 dark:border-gray-800 pb-4">Basic Info</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ex: Marketing Landing Page"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Media Links Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-5">
            <h2 className="text-xl font-semibold dark:text-white mb-2 border-b border-gray-100 dark:border-gray-800 pb-4">Media Files</h2>

            {/* Thumbnail */}
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thumbnail Preview</label>
               <div className="flex gap-2 mb-2 items-center">
                  <UploadButton field="thumbnail_url" uploadingField={uploadingField} onUpload={handleFileUpload} accept="image/*" />
               </div>
               <div className="flex gap-2">
                 <div className="p-2 border border-gray-200 dark:border-gray-700 rounded-l-xl bg-gray-50 dark:bg-gray-800">
                    <LinkIcon className="text-gray-400 w-5 h-5"/>
                 </div>
                 <input type="text" name="thumbnail_url" value={formData.thumbnail_url} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-r-xl bg-transparent text-sm dark:text-gray-300" placeholder="Drive URL will appear here" />
               </div>
            </div>
          </div>
        </div>

        {/* Code & Preview Editor */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 overflow-hidden h-[800px] flex flex-col">
            <div className="border-b border-gray-800 p-4 shrink-0 flex items-center justify-between bg-gray-950">
              <div className="flex items-center gap-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                  <span className="bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-md text-sm font-mono tracking-widest border border-blue-500/30">&lt;/&gt;</span>
                  HTML Space
                </h2>
                <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                  <button type="button" onClick={() => setActiveTab('editor')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'editor' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Code</button>
                  <button type="button" onClick={() => setActiveTab('preview')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'preview' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Live Preview</button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex bg-gray-900 border border-gray-700 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors">
                  <span className="bg-gray-800 text-gray-400 text-xs px-3 py-2 flex items-center border-r border-gray-700">Drive ID</span>
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
                    className="bg-transparent text-sm font-mono text-blue-400 w-48 px-3 py-1.5 outline-none"
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
                          setHtmlContent(`<!-- ERROR: No permission to read this Drive ID: ${err.message || 'Access Denied'}.\nPlease make sure you shared the file with the Service Account email! -->`);
                        }
                      } catch (e: any) {
                        setHtmlContent(`<!-- Error: ${e.message} -->`);
                      } finally {
                        setIsLoadingHtml(false);
                      }
                    }}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap shadow-md focus:ring-2 ring-blue-500/50"
                  >
                    Load File
                  </button>
                ) : (
                  <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-gray-100 transition-colors flex items-center gap-2 whitespace-nowrap">
                    {uploadingField === "html_drive_id" ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
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

function UploadButton({ field, uploadingField, onUpload, accept, label = "Upload New" }: any) {
  const isUploading = uploadingField === field;
  return (
    <label className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isUploading ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40'
    }`}>
      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
      {isUploading ? "Uploading..." : label}
      <input type="file" className="hidden" accept={accept} onChange={(e) => onUpload(e, field)} disabled={isUploading} />
    </label>
  );
}
