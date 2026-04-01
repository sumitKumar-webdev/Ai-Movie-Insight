import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import AuthBootstrap from "@/app/components/auth/auth-bootstrap";
import ClientLayout from "@/app/client-layout";
import RouteProgressBar from "@/app/components/ui/route-progress";
import { Toaster } from "@/app/components/ui/toaster";
import { brand } from "@/app/config/brand";
import StoreProvider from "@/app/store/store-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: {
    default: brand.metaTitle,
    template: `%s | ${brand.name}`,
  },
  description: brand.metaDescription,
  applicationName: brand.name,
  manifest: "/site.webmanifest",
  keywords: [
    "CineAI",
    "movie search",
    "AI movie insights",
    "movie recommendations",
    "movie reviews",
    "IMDb search",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: brand.metaTitle,
    description: brand.metaDescription,
    url: brand.siteUrl,
    siteName: brand.name,
    type: "website",
    images: [
      {
        url: brand.logoSrc,
        width: 128,
        height: 128,
        alt: brand.logoAlt,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: brand.metaTitle,
    description: brand.metaDescription,
    images: [brand.logoSrc],
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StoreProvider>
          <AuthBootstrap />
          <Suspense fallback={null}>
            <RouteProgressBar />
          </Suspense>
          <ClientLayout>{children}</ClientLayout>
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}
