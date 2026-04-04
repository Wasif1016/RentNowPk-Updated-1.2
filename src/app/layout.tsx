import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast";

const geistHeading = Geist({ subsets: ["latin"], variable: "--font-heading" });

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RentNowPk — Car rental marketplace",
  description:
    "Find and book rental vehicles from verified vendors across Pakistan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
        geistHeading.variable
      )}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ToastProvider>
          <AnchoredToastProvider>
            {/* Boundary for async layouts (auth) under Cache Components — see blocking-route */}
            <Suspense fallback={null}>{children}</Suspense>
          </AnchoredToastProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
