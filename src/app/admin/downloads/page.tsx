"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Search, Calendar, ShieldAlert, Monitor, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

interface DownloadEvent {
  id: string;
  project_id: string;
  project_title: string;
  timestamp: string;
  ip_address: string;
}

export default function DownloadsLogPage() {
  const [downloads, setDownloads] = useState<DownloadEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const res = await fetch("/api/admin/downloads");
        if (!res.ok) {
          throw new Error("Failed to fetch downloads");
        }
        const data = await res.json();
        setDownloads(data);
      } catch (err) {
        toast.error("Error loading downloads log");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDownloads();
  }, []);

  // Filter downloads
  const filteredDownloads = downloads.filter((d) => {
    const matchSearch =
      d.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ip_address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchProject = selectedProject === "all" || d.project_id === selectedProject;
    return matchSearch && matchProject;
  });

  // Sort downloads
  const sortedDownloads = [...filteredDownloads].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortDirection === "desc" ? timeB - timeA : timeA - timeB;
  });

  // Get unique projects for the filter dropdown
  const uniqueProjects = Array.from(
    new Map(downloads.map((d) => [d.project_id, d.project_title])).entries()
  );

  // Statistics calculation
  const totalDownloads = downloads.length;
  const uniqueIPs = new Set(downloads.map((d) => d.ip_address)).size;

  const todayDownloads = downloads.filter((d) => {
    const downloadDate = new Date(d.timestamp);
    const today = new Date();
    return (
      downloadDate.getDate() === today.getDate() &&
      downloadDate.getMonth() === today.getMonth() &&
      downloadDate.getFullYear() === today.getFullYear()
    );
  }).length;

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const toggleSort = () => {
    setSortDirection(prev => prev === "desc" ? "asc" : "desc");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-yellow-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <div className="p-2 bg-yellow-400/10 rounded-2xl border border-yellow-400/20 text-yellow-400">
            <Download size={28} />
          </div>
          Downloads History
        </h1>
        <p className="text-slate-400 mt-2 font-medium">
          Track and audit code download events across all showcase deployments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-yellow-400/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/5 rounded-full blur-2xl group-hover:bg-yellow-400/10 transition-colors" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Total Downloads
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{totalDownloads}</span>
            <span className="text-sm font-bold text-yellow-400 uppercase">Times</span>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-400/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/5 rounded-full blur-2xl group-hover:bg-emerald-400/10 transition-colors" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Unique Requesters
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{uniqueIPs}</span>
            <span className="text-sm font-bold text-emerald-400 uppercase">IP Addresses</span>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-blue-400/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/5 rounded-full blur-2xl group-hover:bg-blue-400/10 transition-colors" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Downloads Today
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{todayDownloads}</span>
            <span className="text-sm font-bold text-blue-400 uppercase">Events</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between shadow-2xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by project title or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-400 rounded-2xl pl-12 pr-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 text-sm"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full md:w-64 bg-slate-950 border border-slate-800 focus:border-yellow-400 rounded-2xl px-4 py-3 text-white outline-none transition-all cursor-pointer text-sm"
          >
            <option value="all">All Projects</option>
            {uniqueProjects.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>

          <button
            onClick={toggleSort}
            className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 hover:border-yellow-400/40 px-4 py-3 rounded-2xl text-slate-300 hover:text-white transition-all text-sm whitespace-nowrap"
            title={`Sort by Date: ${sortDirection === "desc" ? "Newest First" : "Oldest First"}`}
          >
            <ArrowUpDown size={16} />
            <span className="hidden sm:inline">
              {sortDirection === "desc" ? "Newest" : "Oldest"}
            </span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-800/50">
                <th className="px-6 py-5">Project Title</th>
                <th className="px-6 py-5">IP Address</th>
                <th className="px-6 py-5">Downloaded At</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {sortedDownloads.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <ShieldAlert className="text-slate-600" size={36} />
                      <span>No download logs match your search.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedDownloads.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-slate-800/30 transition-colors group border-b border-slate-800/30 last:border-0"
                  >
                    <td className="px-6 py-5 font-bold text-slate-100 group-hover:text-yellow-400 transition-colors">
                      {event.project_title}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-950 rounded-lg flex items-center justify-center text-slate-500 border border-slate-800">
                          <Monitor size={14} />
                        </div>
                        <span className="font-mono text-sm text-slate-300">{event.ip_address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-slate-400 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-500" />
                        {formatDateTime(event.timestamp)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
