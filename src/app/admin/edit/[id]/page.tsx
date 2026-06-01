import { getProjectById } from "@/lib/google/sheets";
import EditProjectForm from "./EditProjectForm";
import { Suspense } from "react";

export default async function EditPage({ params }: { params: { id: string } }) {
  const isNew = params.id === "new";
  const project = isNew ? null : await getProjectById(params.id);

  if (!isNew && !project) {
    return <div className="p-8 text-center text-red-500">Project not found</div>;
  }

  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400 font-medium">Loading form...</div>}>
      <EditProjectForm initialProject={project} />
    </Suspense>
  );
}
