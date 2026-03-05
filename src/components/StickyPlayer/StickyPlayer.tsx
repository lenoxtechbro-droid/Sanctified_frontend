import { useCallback, useRef, useState } from "react";

export interface NowPlaying {
  id: string;
  title: string;
  author: string;
  audioUrl: string | null;
  thumbnailUrl?: string | null;
}

interface StickyPlayerProps {
  nowPlaying: NowPlaying | null;
  onClear?: () => void;
}

export function StickyPlayer({ nowPlaying, onClear }: StickyPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  if (!nowPlaying) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-navy/10 bg-navy/5 py-2 text-center text-sm text-navy/70">
        No track selected. Play a sermon or podcast from the feed.
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-navy/10 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        {/* Artwork / info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-navy/10">
            {nowPlaying.thumbnailUrl ? (
              <img src={nowPlaying.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gold text-lg">♪</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-navy-dark">{nowPlaying.title}</p>
            <p className="truncate text-sm text-navy/70">{nowPlaying.author}</p>
          </div>
        </div>

        {/* Playback */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-white shadow hover:bg-gold-dark"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="rounded px-2 py-1 text-sm text-navy/70 hover:bg-navy/5"
            >
              Close
            </button>
          )}
        </div>

        {/* Progress (visual only if no audio) */}
        <div className="hidden w-32 sm:block">
          <div className="h-1.5 rounded-full bg-navy/10">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {nowPlaying.audioUrl && (
        <audio
          ref={audioRef}
          src={nowPlaying.audioUrl}
          onTimeUpdate={(e) => {
            const a = e.currentTarget;
            if (a.duration) setProgress((a.currentTime / a.duration) * 100);
          }}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
}
