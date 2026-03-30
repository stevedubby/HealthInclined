import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Healthinclined",
    short_name: "Healthinclined",
    description:
      "Simple health education about everyday body symptoms. Clear explanations and practical, non-diagnostic guidance.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/myhealthinclinedlogo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/myhealthinclinedlogo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
