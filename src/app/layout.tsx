import type { Metadata } from "next";
import { Inter, Lora, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { getSiteSettings } from "@/actions/settings";
import { cookies } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { ReaderProvider } from "../features/reader/context/ReaderContext";
import { PWAProvider } from "@/components/providers/PWAProvider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "vietnamese"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.site_name || "ZenStory";
  const siteDesc = settings.site_description || "Nền tảng sáng tác và đọc truyện Light Novel cao cấp.";
  
  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteDesc,
    keywords: ["light novel", "đọc truyện online", "sáng tác truyện", "truyện chữ", "zenstory"],
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: siteName,
      description: siteDesc,
      url: "./",
      siteName: siteName,
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: siteDesc,
    },
    manifest: "/manifest.json",
    icons: {
      icon: settings.favicon_url || "/favicon.ico",
      apple: settings.apple_icon_url || "/apple-touch-icon.png",
      shortcut: settings.favicon_url || "/favicon.ico",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const primaryColor = settings.primary_color || "#8b5cf6";
  const primaryFont = settings.primary_font || "font-serif";
  const defaultTheme = settings.default_theme || "light";
  const googleFont = settings.google_font; // e.g. "Outfit" or "Playfair Display"

  const cookieStore = await cookies();
  const savedTheme = cookieStore.get("zenstory-theme")?.value;
  const activeTheme = savedTheme || defaultTheme;

  return (
    <html
      lang="vi"
      className={cn("antialiased", inter.variable, lora.variable, geist.variable, primaryFont)}
      suppressHydrationWarning
    >
      <head>
        {/* Load main google font */}
        {googleFont && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href={`https://fonts.googleapis.com/css2?family=${googleFont.replace(/ /g, '+')}:wght@400;500;700;900&display=swap`} rel="stylesheet" />
          </>
        )}
        {/* Load custom reader fonts */}
        {settings.custom_fonts?.map((f: any) => (
          <link 
            key={f.id}
            href={`https://fonts.googleapis.com/css2?family=${f.fontFamily.replace(/ /g, '+')}:wght@400;500;700&display=swap`} 
            rel="stylesheet" 
          />
        ))}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${primaryColor};
            ${googleFont ? `--font-dynamic: '${googleFont}', sans-serif;` : ''}
          }
          ${googleFont ? `
            body { font-family: var(--font-dynamic), var(--font-sans) !important; }
            h1, h2, h3, h4, .font-bold { font-family: var(--font-dynamic), var(--font-sans) !important; }
          ` : ''}
        `}} />
      </head>
      <body 
        className={cn(
          "bg-background text-foreground transition-colors duration-300",
          `theme-${activeTheme}`
        )}
        suppressHydrationWarning
      >
        <ReaderProvider initialSettings={{...settings, default_theme: activeTheme}}>
          <PWAProvider>
            {children}
            <Toaster position="top-center" richColors />
          </PWAProvider>
        </ReaderProvider>
      </body>
    </html>
  );
}
