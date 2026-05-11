import { getSiteSettings } from "@/actions/settings";
import { MetadataRoute } from "next";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  const siteName = settings.site_name || "ZenStory";
  const siteDesc = settings.site_description || "Nền tảng sáng tác và đọc truyện Light Novel cao cấp.";
  const primaryColor = settings.primary_color || "#8b5cf6";
  const iconUrl = settings.apple_icon_url || settings.favicon_url || "/favicon.ico";

  return {
    name: siteName,
    short_name: siteName,
    description: siteDesc,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: primaryColor,
    icons: [
      {
        src: iconUrl,
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: iconUrl,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: iconUrl,
        sizes: "512x512",
        type: "image/png"
      }
    ],
  };
}
