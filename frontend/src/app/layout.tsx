import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Xpense - Shared Expense Tracker",
  description: "Track and manage shared expenses with your flatmates",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-4 max-w-lg">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
