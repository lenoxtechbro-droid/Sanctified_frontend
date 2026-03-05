import React, { useState } from "react";

interface VideoPlayerModalProps {
  title: string;
  videoUrl: string;
  onClose: () => void;
}

export function VideoPlayerModal({ title, videoUrl, onClose }: VideoPlayerModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Video player"
    >
      <div className="relative w-full max-w-5xl rounded-xl bg-gray-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/40 px-2 py-1 text-sm text-gray-200 hover:bg-black/70"
        >
          Close ✕
        </button>
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-black">
          <video
            key={videoUrl}
            src={videoUrl}
            controls
            playsInline
            preload="auto"
            className="h-full w-full"
            onError={() => setError("This video could not be loaded. It may be in an unsupported format or the link may be invalid.")}
          />
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 p-4 text-center">
              <p className="text-sm text-gray-300">{error}</p>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-gold px-4 py-2 text-sm font-medium text-navy hover:bg-gold/90"
              >
                Open video in new tab
              </a>
            </div>
          )}
        </div>
        <div className="border-t border-gray-800 px-4 py-3">
          <h2 className="truncate text-sm font-semibold text-gray-100">{title}</h2>
        </div>
      </div>
    </div>
  );
}


