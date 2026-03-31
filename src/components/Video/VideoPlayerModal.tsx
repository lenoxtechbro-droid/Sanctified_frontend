import React, { useState, useEffect } from "react";

interface VideoPlayerModalProps {
  title: string;
  videoUrl: string;
  onClose: () => void;
}

export function VideoPlayerModal({ title, videoUrl, onClose }: VideoPlayerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    console.log('[VideoModal] Opening with src:', videoUrl);
    setLoadStatus('idle');
    setError(null);
    setDebugInfo(`Src: ${videoUrl}`);
  }, [videoUrl]);

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
            onLoadStart={() => {
              console.log('[Video] loadstart');
              setLoadStatus('loading');
            }}
            onLoadedMetadata={(e) => {
              console.log('[Video] loadedmetadata, duration:', e.currentTarget.duration);
              setLoadStatus('loaded');
            }}
            onCanPlay={() => {
              console.log('[Video] canplay');
              setLoadStatus('loaded');
            }}
            onPlay={() => console.log('[Video] play started')}
            onPause={() => console.log('[Video] paused')}
            onError={(e) => {
              console.error('[Video] Error details:', e.currentTarget.error);
              setLoadStatus('error');
              setError("Failed to load video. Check console for details.");
            }}
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
          {/* Debug overlay always visible */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white text-xs p-2 rounded opacity-90 max-h-20 overflow-y-auto">
            <div>Status: {loadStatus}</div>
            <div>{debugInfo}</div>
            <div>Try manual play with controls above</div>
          </div>
        </div>
        <div className="border-t border-gray-800 px-4 py-3">
          <h2 className="truncate text-sm font-semibold text-gray-100">{title}</h2>
        </div>
      </div>
    </div>
  );
}

