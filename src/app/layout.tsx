import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "AI Institute - Learn, Build, Succeed with AI",
  description: "Learn from India's top AI experts. Practice real-world projects and get placed in top companies. Premium Learning Management System.",
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
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-8428613200514609';

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased bg-[#fcfdff] dark:bg-[#080d1a] text-[#1e293b] dark:text-[#f8fafc] transition-colors duration-200">
        <ThemeProvider>
          <DatabaseProvider>
            {children}
          </DatabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
