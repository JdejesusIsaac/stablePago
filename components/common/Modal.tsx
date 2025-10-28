import { cn } from "@/lib/utils";
import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import React, { ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
  title?: string;
  showCloseButton?: boolean;
}

export function Modal({
  open,
  onClose,
  children,
  showBackButton,
  onBack,
  className,
  title,
  showCloseButton,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [open]);
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm py-2"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative mx-4 flex h-fit w-full max-w-md flex-col items-center overflow-y-auto rounded-2xl bg-[#121417] border border-[#1C1F24] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] md:h-fit md:max-h-[calc(100dvh-32px)]",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex h-9 w-full items-center justify-between mb-4">
          {showBackButton && (
            <button
              onClick={onBack || onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1C1F24] hover:bg-[#2A2D32] text-[#A9B0B7] transition-all duration-200"
              aria-label="Back"
              type="button"
            >
              <span className="text-2xl">←</span>
            </button>
          )}
          {title && (
            <div className="transform-[translateX(-50%)] absolute left-1/2 w-max text-lg font-bold text-white">
              {title}
            </div>
          )}
          {showCloseButton && (
            <button onClick={onClose} className="absolute right-0 text-[#A9B0B7] hover:text-white transition-colors duration-200">
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
