import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Syne, DM_Sans, JetBrains_Mono, Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { TRPCProvider } from "@/lib/trpc/provider";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { OfflineProvider } from "@/components/pwa/OfflineProvider";
import { Toaster } from "@/components/ui/toaster";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["500"],
});

export const viewport: Viewport = {
  themeColor: "#3B82F6",
};

export const metadata: Metadata = {
  title: "DDT Structure",
  description: "Engineering confidence. Report clarity.",
  metadataBase: new URL("https://ddt-structure.com"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DDT Structure",
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "DDT Structure",
    description: "Engineering confidence. Report clarity.",
    url: "https://ddt-structure.com",
    siteName: "DDT Structure",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DDT Structure - Laboratory Operations Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DDT Structure",
    description: "Engineering confidence. Report clarity.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(
      "antialiased",
      syne.variable,
      dmSans.variable,
      inter.variable,
      jetbrainsMono.variable
    )}>
      <body className="font-sans">
        <TRPCProvider>
          <OfflineProvider>
            {children}
            <InstallBanner />
            <Toaster />
          </OfflineProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
