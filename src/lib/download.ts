export const downloadProjectCode = async (
  projectId: string,
  driveId: string,
  title: string,
  onSuccess?: (newCount: number) => void
) => {
  try {
    const res = await fetch(`/api/proxy-html?id=${driveId}`);
    if (res.ok) {
      const htmlText = await res.text();
      const blob = new Blob([htmlText], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "project"}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Increment download count
      try {
        const incRes = await fetch(`/api/projects/download`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: projectId }),
        });
        if (incRes.ok) {
          const data = await incRes.json();
          if (data.success && onSuccess) {
            onSuccess(data.count);
            // Dispatch event to notify other client components (e.g. Navbar, Hero stats)
            window.dispatchEvent(new CustomEvent("project-downloaded", { detail: { projectId } }));
          }
        }
      } catch (incError) {
        console.error("Failed to increment download count:", incError);
      }
    } else {
      alert("Failed to download code.");
    }
  } catch (error) {
    console.error("Error downloading code:", error);
    alert("Error downloading code.");
  }
};
