import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DeeDevIOT Showcase",
    short_name: "DeeDevIOT",
    description: "IoT Solutions and Web Applications Showcase Portal",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#020617", // slate-950 bg
    theme_color: "#f59e0b", // amber-500 yellow accent
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
