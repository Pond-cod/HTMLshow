import { getProjectById } from "@/lib/google/sheets";
import { notFound } from "next/navigation";
import ProjectViewClient from "./ProjectViewClient";

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

  return <ProjectViewClient project={project} />;
}
