"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
}

export function VideoModal({ isOpen, onClose, videoUrl }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Handle video lifecycle
  useEffect(() => {
    if (isOpen && videoRef.current) {
      // Autoplay when modal opens (muted for browser policy)
      videoRef.current.play().catch((error) => {
        console.error("Autoplay failed:", error);
      });
    } else if (!isOpen && videoRef.current) {
      // Pause and reset when modal closes
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isOpen]);

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

  const handleVideoLoaded = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
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
              <video
                ref={videoRef}
                className="w-full aspect-video"
                controls
                controlsList="nodownload"
                playsInline
                muted={isMuted}
                onLoadedData={handleVideoLoaded}
                onError={handleVideoError}
                preload="metadata"
              >
                <source src={videoUrl} type="video/mp4" />
                <p className="text-text-secondary p-8">
                  Your browser doesn't support video playback. Please try a different browser.
                </p>
              </video>

              {/* Unmute Prompt (appears if video is muted) */}
              <AnimatePresence>
                {isMuted && !isLoading && !hasError && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={toggleMute}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-primary/90 hover:bg-primary text-white font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(255,0,92,0.4)] transition-all duration-200 hover:scale-105 z-20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                    Click to Unmute
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Video Info */}
            <div className="mt-4 text-center">
              <h3 id="video-modal-title" className="text-lg font-semibold text-white mb-1">
                StablePago Platform Demo
              </h3>
              <p className="text-sm text-text-secondary">
                See how we're transforming Caribbean remittances into wealth creation
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

