import type { MetadataRoute } from "next";

import { APP_FULL_NAME, APP_SHORT_NAME } from "@/lib/app-branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_FULL_NAME,
    short_name: APP_SHORT_NAME,
    description:
      "Insurance-centric financial intelligence platform for financial advisors",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
  };
}
