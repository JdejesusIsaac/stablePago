"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
}

const buildYouTubeEmbedUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`;
      }
    }

    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace("/", "");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`;
      }
    }
  } catch (error) {
    console.warn("Invalid video URL provided to VideoModal:", error);
  }

  return "";
};

export function VideoModal({ isOpen, onClose, videoUrl }: VideoModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const embedUrl = useMemo(() => buildYouTubeEmbedUrl(videoUrl), [videoUrl]);

  useEffect(() => {
    if (!embedUrl) {
      setHasError(true);
      setIsLoading(false);
    } else {
      setHasError(false);
      setIsLoading(true);
    }
  }, [embedUrl]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleIframeLoaded = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-6xl mx-4 md:mx-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-modal-title"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 p-2 rounded-full bg-surface-elevated/80 hover:bg-surface-elevated border border-border text-white hover:text-primary transition-all duration-200 hover:scale-110 z-20"
              aria-label="Close video"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video Container */}
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-[0_0_50px_rgba(255,0,92,0.3)] border border-primary/20">
              {/* Loading Spinner */}
              {isLoading && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-secondary">Loading demo video...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                  <div className="text-center px-6 max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold mb-2 text-error">Video Load Failed</h3>
                    <p className="text-text-secondary mb-6">
                      We couldn't load the demo video. Please try again or contact support.
                    </p>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Video Player */}
              {embedUrl && !hasError ? (
                <iframe
                  key={embedUrl}
                  className="w-full aspect-video"
                  src={embedUrl}
                  title="StablePago demo video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  onLoad={handleIframeLoaded}
                  onError={handleIframeError}
                />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center bg-background text-text-secondary p-8">
                  Unable to load video. Please try again later.
                </div>
              )}
            </div>

            {/* Video Info */}
                <div className="mt-4 text-center">
                  <h3 id="video-modal-title" className="text-lg font-semibold text-white mb-1">
                    ElevenLabs × Circle Telegram Agent Demo
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Voice-controlled flows for wallet creation, balance checks, USDC transfers (including CCTP), and bilingual RWA market data powered by CoinGecko.
                  </p>
                </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

