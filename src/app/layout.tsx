
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { Providers } from "@/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Teslead Connect",
  description: "The official platform for Teslead Connect, fostering professional networking and collaboration.",

  icons: {
    icon: '/favicon.ico',
  },
};

import { ToastContainer } from "@/components/ui/Toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <Providers>
          <ThemeProvider>
            {children}
            <ToastContainer position="top-right" />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
