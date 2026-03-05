import React, { createContext, useCallback, useContext, useState } from "react";
import type { NowPlaying } from "../components/StickyPlayer";

interface PlayerState {
  nowPlaying: NowPlaying | null;
  setNowPlaying: (track: NowPlaying | null) => void;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const value: PlayerState = {
    nowPlaying,
    setNowPlaying: useCallback((track) => setNowPlaying(track), []),
  };
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
