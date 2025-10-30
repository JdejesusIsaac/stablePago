import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

// Inter - Variable font for body, UI, forms, navigation
// Optimized: Using only necessary weights and preloading for performance
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"], // Reduced from 5 to 3 weights
  preload: true,
  fallback: ['system-ui', 'arial'],
});

// Space Grotesk - For hero headings and major CTAs  
// Optimized: Reduced weights for faster loading
const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700"], // Reduced from 3 to 2 weights
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  title: "StablePago - Build Caribbean Prosperity, One Transfer at a Time",
  description: "Turn remittances into wealth creation. Earn yield, invest in real assets, access credit. Send money to Puerto Rico, Dominican Republic & Haiti with 1.25% fees. Voice-powered wealth building for Caribbean families.",
  icons: {
    icon: [
      { url: '/favicon.ico?v=2', sizes: 'any' },
      { url: '/stablePago.png?v=2', type: 'image/png', sizes: '32x32' },
      { url: '/stablePago.png?v=2', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/favicon.ico?v=2',
    apple: '/stablePago.png?v=2',
  },
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
