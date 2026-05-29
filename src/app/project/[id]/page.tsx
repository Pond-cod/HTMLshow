import { getProjectById } from "@/lib/google/sheets";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, PlayCircle } from "lucide-react";
import Image from "next/image";
import { cleanImageUrl } from "@/lib/utils";

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await getProjectById(params.id);

  if (!project || project.status !== "published") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="absolute top-0 w-full bg-gray-950/80 backdrop-blur-md border-b border-gray-800 z-50 text-white p-4 flex items-center">
        <Link href="/" className="mr-4 hover:bg-gray-800 p-2 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-base sm:text-xl font-bold truncate mr-2">{project.title}</h1>
        <div className="ml-auto text-xs sm:text-sm text-gray-400 shrink-0">
          <span className="hidden sm:inline">Updated: </span>{new Date(project.last_updated).toLocaleDateString()}
        </div>
      </header>

      <main className="flex-1 w-full mt-[73px] flex flex-col overflow-y-auto">
        {/* Highlight Resources Bar */}
        {(project.manual_url || project.learning_url) && (
          <div className="flex flex-wrap items-center gap-4 p-4 border-b border-white/5 bg-gray-900/80 backdrop-blur-md shrink-0">
            {project.manual_url && (
              <a
                href={project.manual_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-yellow-500/30 bg-gray-800/80 p-2 pr-4 transition-all hover:border-yellow-400 hover:bg-gray-800 shadow-md hover:shadow-yellow-500/20"
              >
                {project.manual_image_url ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gray-950">
                    <Image src={cleanImageUrl(project.manual_image_url)} alt={project.manual_text || "Manual"} fill sizes="40px" className="object-cover transition-transform group-hover:scale-110" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-500">
                    <BookOpen size={20} />
                  </div>
                )}
                <span className="font-semibold text-gray-200 group-hover:text-yellow-400 text-sm">
                  {project.manual_text || "คู่มือการใช้งาน"}
                </span>
              </a>
            )}

            {project.learning_url && (
              <a
                href={project.learning_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-blue-500/30 bg-gray-800/80 p-2 pr-4 transition-all hover:border-blue-400 hover:bg-gray-800 shadow-md hover:shadow-blue-500/20"
              >
                {project.learning_image_url ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gray-950">
                    <Image src={cleanImageUrl(project.learning_image_url)} alt={project.learning_text || "Learning"} fill sizes="40px" className="object-cover transition-transform group-hover:scale-110" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500">
                    <PlayCircle size={20} />
                  </div>
                )}
                <span className="font-semibold text-gray-200 group-hover:text-blue-400 text-sm">
                  {project.learning_text || "สื่อการเรียน"}
                </span>
              </a>
            )}
          </div>
        )}

        {/* iframe */}
        {project.html_drive_id ? (
          <iframe
            src={project.html_drive_id.startsWith('http') ? project.html_drive_id : `/api/proxy-html?id=${project.html_drive_id}`}
            title={project.title}
            className="w-full min-h-[750px] sm:min-h-[850px] border-0 bg-white"
            scrolling="yes"
            style={{ overflow: "auto", WebkitOverflowScrolling: "touch" }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-top-navigation-by-user-activation"
          />
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-500">
            No HTML content available for this project.
          </div>
        )}
      </main>
    </div>
  );
}
