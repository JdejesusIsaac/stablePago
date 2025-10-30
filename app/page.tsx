"use client";

import { useEffect } from "react";
import LandingPage from "./landing/page";

export default function Home() {
  // Clean up hash fragments on page load
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      // Remove hash from URL without triggering a page reload
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Render landing page directly at root
  return <LandingPage />;
}
