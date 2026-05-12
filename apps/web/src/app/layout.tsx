import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PobbleHost — Premium Minecraft Server Hosting",
    template: "%s | PobbleHost",
  },
  description:
    "Premium Minecraft server hosting with instant setup, DDoS protection, and 24/7 support. Start your server in under 60 seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider delay={300}>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
          <Toaster richColors position="bottom-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
