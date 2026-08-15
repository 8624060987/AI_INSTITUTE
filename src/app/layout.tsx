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
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { margin: 0; padding: 0; font-family: var(--font-geist-sans), system-ui, -apple-system, sans-serif; background-color: #080d1a !important; color: #f8fafc !important; }
          img { max-width: 100%; height: auto; }
          header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: rgba(8, 13, 26, 0.85); backdrop-filter: blur(12px); position: fixed; top: 0; left: 0; right: 0; z-index: 50; border-bottom: 1px solid rgba(255,255,255,0.1); }
          header img { max-height: 48px; width: auto; }
          nav { display: flex; align-items: center; gap: 1.5rem; }
          nav a { color: #94a3b8; text-decoration: none; font-size: 0.875rem; font-weight: 600; }
        ` }} />
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8428613200514609"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
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
