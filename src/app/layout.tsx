import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { DatabaseProvider } from "@/context/DatabaseContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfdff" },
    { media: "(prefers-color-scheme: dark)", color: "#080d1a" },
  ],
};

export const metadata: Metadata = {
  title: "AI Institute - Learn, Build, Succeed with AI",
  description: "Learn from India's top AI experts. Practice real-world projects and get placed in top companies. Premium Learning Management System.",
  other: {
    'google-adsense-account': 'ca-pub-8428613200514609',
  },
  icons: {
    icon: [
      { url: '/logo-icon.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-8428613200514609" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            window.addEventListener('error', function(e) {
              if (e.target && (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
                var src = e.target.src || e.target.href || '';
                if (src.includes('_next/static/chunks/')) {
                  if (!sessionStorage.getItem('chunk_auto_refreshed')) {
                    sessionStorage.setItem('chunk_auto_refreshed', 'true');
                    window.location.reload(true);
                  }
                }
              }
            }, true);
            window.addEventListener('unhandledrejection', function(e) {
              if (e.reason && (e.reason.name === 'ChunkLoadError' || (e.reason.message && e.reason.message.includes('Loading chunk')))) {
                if (!sessionStorage.getItem('chunk_auto_refreshed')) {
                  sessionStorage.setItem('chunk_auto_refreshed', 'true');
                  window.location.reload(true);
                }
              }
            });
          })();
        ` }} />
        <link rel="stylesheet" href="/fallback-tailwind.css" />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { margin: 0; padding: 0; font-family: var(--font-geist-sans), system-ui, -apple-system, sans-serif; background-color: #080d1a; color: #f8fafc; }
          img { max-width: 100%; height: auto; }
          header img, nav img, a img, img[alt*="AI Institute"], img[alt*="Logo"] { max-height: 48px !important; max-width: 220px !important; width: auto !important; height: auto !important; object-fit: contain !important; display: inline-block !important; }
          header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.5rem; }
          header nav { display: flex; align-items: center; gap: 1.25rem; }
          header nav a { color: #94a3b8; text-decoration: none; font-size: 0.875rem; font-weight: 600; }
        ` }} />
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8428613200514609"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased bg-[#fcfdff] dark:bg-[#080d1a] text-[#1e293b] dark:text-[#f8fafc] transition-colors duration-200" suppressHydrationWarning>
        <ThemeProvider>
          <DatabaseProvider>
            {children}
          </DatabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
