import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast";

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
    <html lang="en" className={cn("h-full", "antialiased", "font-sans")}>
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
