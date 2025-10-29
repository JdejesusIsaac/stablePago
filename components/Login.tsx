"use client";

import { useAuth } from "@crossmint/client-sdk-react-ui";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function Login() {
  const { login, status } = useAuth();
  const router = useRouter();
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);

  useEffect(() => {
    if (status === "logged-out" && !hasAttemptedLogin) {
      login();
      setHasAttemptedLogin(true);
    }
  }, [login, status, hasAttemptedLogin]);

  // If user closes the modal and is still logged out, redirect to landing
  useEffect(() => {
    if (hasAttemptedLogin && status === "logged-out") {
      const timer = setTimeout(() => {
        router.push("/");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasAttemptedLogin, status, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 max-w-md px-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-text-secondary text-center">Opening login...</p>
        
        {hasAttemptedLogin && status === "logged-out" && (
          <div className="text-center space-y-4 animate-fade-in">
            <p className="text-sm text-text-muted">
              Login cancelled or closed
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 rounded-xl bg-surface-elevated hover:bg-border text-white font-semibold transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
