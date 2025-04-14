import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from 'sonner';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const metadata: Metadata = {
  title: "Xpense - Split Expenses with Friends",
  description: "Track and split expenses with friends and family",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={inter.className}>
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-4 max-w-lg">
            {children}
          </div>
        </main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
