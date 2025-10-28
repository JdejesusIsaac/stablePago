import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StablePago - Build Caribbean Prosperity, One Transfer at a Time",
  description: "Turn remittances into wealth creation. Earn yield, invest in real assets, access credit. Send money to Puerto Rico, Dominican Republic & Haiti with 1.25% fees. Voice-powered wealth building for Caribbean families.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background box-content antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
