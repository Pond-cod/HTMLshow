import { getProjectById } from "@/lib/google/sheets";
import EditProjectForm from "./EditProjectForm";

export default async function EditPage({ params }: { params: { id: string } }) {
  const isNew = params.id === "new";
  const project = isNew ? null : await getProjectById(params.id);

  if (!isNew && !project) {
    return <div className="p-8 text-center text-red-500">Project not found</div>;
  }

  return <EditProjectForm initialProject={project} />;
}
