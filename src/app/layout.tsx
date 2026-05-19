import type { Metadata } from "next";
import "./globals.css";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { TRPCProvider } from "@/lib/trpc/provider";

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

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "DDT Structure",
  description: "Multi-tenant SaaS for NDT laboratories",
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
      jetbrainsMono.variable
    )}>
      <body className="font-sans">
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
