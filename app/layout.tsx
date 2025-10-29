import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

// Inter - Variable font for body, UI, forms, navigation
// Supports Latin, Latin Extended (accents), and extended character sets
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// Space Grotesk - For hero headings and major CTAs
// Adds expressive brand personality while maintaining readability
const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["500", "600", "700"],
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
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-background antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
