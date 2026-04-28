import { getProjectById } from "@/lib/google/sheets";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

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
        <h1 className="text-xl font-bold truncate">{project.title}</h1>
        <div className="ml-auto text-sm text-gray-400">
          Updated: {new Date(project.last_updated).toLocaleDateString()}
        </div>
      </header>

      {/* 
        We use an iframe pointing to our proxy route.
        The sandbox attribute ensures security.
      */}
      <main className="flex-1 mt-[73px] w-full">
        {project.html_drive_id ? (
          <iframe
            src={project.html_drive_id.startsWith('http') ? project.html_drive_id : `/api/proxy-html?id=${project.html_drive_id}`}
            title={project.title}
            className="w-full h-[calc(100vh-73px)] border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No HTML content available for this project.
          </div>
        )}
      </main>
    </div>
  );
}
