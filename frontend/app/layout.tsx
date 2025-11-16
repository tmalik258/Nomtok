import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nomtok.com"),
  title: {
    default: "Nomtok",
    template: "%s | Nomtok",
  },
  description:
    "Discover amazing restaurants recommended by your favorite food influencers",
  keywords: [
    "nomtok",
    "restaurants",
    "influencers",
    "food",
    "city guides",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.nomtok.com" },
  openGraph: {
    type: "website",
    title: "Nomtok",
    description:
      "Discover amazing restaurants recommended by your favorite food influencers",
    url: "https://www.nomtok.com",
    images: [
      { url: "/hero-main.jpg", width: 1200, height: 630, alt: "Nomtok" },
    ],
    siteName: "Nomtok",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nomtok",
    description:
      "Discover amazing restaurants recommended by your favorite food influencers",
    images: ["/hero-main.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-64x64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-50 to-gray-100`}
      >
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />

        <Script id="ga-setup" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
