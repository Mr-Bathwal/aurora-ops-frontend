import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "IT Ops Assistant Hub",
  description: "Agentic IT operations console",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${sora.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen">
        <TooltipProvider delay={200}>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
