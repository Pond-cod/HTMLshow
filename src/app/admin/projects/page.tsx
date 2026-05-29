import { getAllProjects } from "@/lib/google/sheets";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { Plus, CheckCircle, Clock, PenTool } from "lucide-react";
import ProjectRowActions from "../ProjectRowActions";
import { cleanImageUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const [projects, session] = await Promise.all([
    getAllProjects(),
    getSession()
  ]);

  const userRole = (session?.role as string) || "adminuser";

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Projects</h1>
          <p className="text-slate-400 mt-2 font-medium">Manage your showcase deployments</p>
        </div>
        {userRole !== 'approver' && (
          <Link 
            href="/admin/edit/new" 
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 px-6 py-3 rounded-2xl font-bold shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus size={20} strokeWidth={3} />
            New Project
          </Link>
        )}
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-800/50">
                <th className="px-4 sm:px-6 py-5">Project Focus</th>
                <th className="px-4 sm:px-6 py-5">Status</th>
                <th className="px-4 sm:px-6 py-5 hidden md:table-cell">Last Updated</th>
                <th className="px-4 sm:px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-500 font-medium">
                    No projects deployed yet. Launch your first build.
                  </td>
                </tr>
              ) : (
                projects.map((project, index) => (
                  <tr key={project.id} className="hover:bg-slate-800/50 transition-colors group rounded-2xl">
                    <td className="px-4 sm:px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-950 rounded-xl overflow-hidden shrink-0 border border-slate-700/50 shadow-inner group-hover:border-yellow-500/30 transition-colors">
                          {project.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cleanImageUrl(project.thumbnail_url)} alt={project.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase tracking-widest bg-slate-900">Void</div>
                          )}
                        </div>
                        <div className="font-bold text-slate-100 text-lg group-hover:text-yellow-400 transition-colors">{project.title}</div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-5">
                      {project.status === 'published' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-400/10 text-green-400 border border-green-400/20 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                          <CheckCircle size={12} />
                          Live
                        </span>
                      ) : project.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-400/10 text-orange-400 border border-orange-400/20 shadow-[0_0_10px_rgba(251,146,60,0.2)]">
                          <Clock size={12} />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                          <PenTool size={12} />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-5 hidden md:table-cell whitespace-nowrap text-sm text-slate-400 font-medium">
                      {project.last_updated ? new Date(project.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Origin'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <ProjectRowActions 
                        project={project} 
                        userRole={userRole} 
                        isFirst={index === 0} 
                        isLast={index === projects.length - 1} 
                      />
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
