import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-provider";
import {
  APP_DEFAULT_PAGE_TITLE,
  APP_FULL_NAME,
  APP_SHORT_NAME,
  APP_TITLE_TAGLINE,
} from "@/lib/app-branding";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: APP_FULL_NAME,
  title: {
    default: APP_DEFAULT_PAGE_TITLE,
    template: `%s | ${APP_SHORT_NAME} | ${APP_TITLE_TAGLINE}`,
  },
  description:
    "Insurance-centric financial intelligence platform for financial advisors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider>
              <TooltipProvider>
                {children}
                <Toaster />
              </TooltipProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
