import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usePlayer } from "../../contexts/PlayerContext";
import type { Episode } from "../../types";
import { CommentSection } from "../Comments/CommentSection";
import { LikeButton } from "../LikeButton";

interface EpisodeCardProps {
  episode: Episode;
  onVideoClick?: (episode: Episode) => void;
  onCommentClick?: () => void;
}

export function EpisodeCard({ 
  episode, 
  onVideoClick,
  onCommentClick
}: EpisodeCardProps) {
  const [showComments, setShowComments] = useState(false);
  const { role } = useAuth();
  const { setNowPlaying } = usePlayer();

  const canPlay = !episode.is_premium || role === "premium" || role === "admin";

  const handlePlay = () => {
    if (!canPlay) return;

    if (episode.video_url && onVideoClick) {
      // Videos remain the same - trigger parent video modal
      onVideoClick(episode);
    } else if (episode.audio_url) {
      // Audio cards - play in StickyPlayer
      setNowPlaying({
        id: episode.id,
        title: episode.title,
        author: episode.author_name,
        audioUrl: episode.audio_url,
        thumbnailUrl: episode.thumbnail_url,
      });
    }
  };

  return (
    <article className="group rounded-xl border overflow-hidden shadow-sm transition-all hover:shadow-md hover:-translate-y-1 bg-white dark:bg-gray-800 border-navy/10 dark:border-gray-700">
      {/* Thumbnail with Play Overlay */}
      <div className="relative h-48 w-full overflow-hidden bg-navy/10 dark:bg-gray-700">
        {episode.thumbnail_url ? (
          <img 
            src={episode.thumbnail_url} 
            alt={episode.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl text-navy/30 dark:text-gray-500">
            🎙️
          </div>
        )}

        {/* Play Overlay Button */}
        <button
          type="button"
          onClick={handlePlay}
          disabled={!canPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/40"
          aria-label="Play episode"
        >
          <span className="w-16 h-16 bg-white/95 rounded-full flex items-center justify-center text-2xl text-navy shadow-2xl hover:bg-white">
            ▶
          </span>
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1">
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gold text-white">
            {episode.category}
          </span>
          {episode.is_premium && (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white">
              Premium
            </span>
          )}
        </div>
        {episode.video_url && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold bg-navy text-white">
            🎬 Video
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg leading-tight line-clamp-2 text-navy-dark dark:text-gray-100 mb-2 group-hover:text-gold transition-colors">
          {episode.title}
        </h3>
        <p className="text-sm text-navy/70 dark:text-gray-400 line-clamp-2 mb-3">
          {episode.author_name}
        </p>
        
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <LikeButton targetType="episode" targetId={episode.id} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onCommentClick) onCommentClick();
                else setShowComments(true);
              }}
              className="flex items-center gap-1 hover:text-gold transition-colors text-xs text-navy/60 dark:text-gray-500"
            >
              💬 Comments
            </button>
          </div>
          <span className="text-xs text-navy/60 dark:text-gray-500">
            {episode.duration_minutes ? `${episode.duration_minutes} min` : "Podcast"}
          </span>
        </div>

        {/* Play Button */}
        <button
          onClick={handlePlay}
          disabled={!canPlay}
          className={`w-full rounded-lg py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            canPlay
              ? "bg-gradient-to-r from-gold to-gold-dark text-white hover:from-gold-dark shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              : "bg-navy/20 text-navy/50 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          <span>▶</span>
          {episode.video_url ? "Watch Video" : "Play Audio"}
        </button>

        {!canPlay && (
          <p className="mt-2 text-xs text-center text-amber-600 dark:text-amber-400">
            Premium content - Upgrade to play
          </p>
        )}

        {showComments && (
          <div className="border-t border-navy/10 dark:border-gray-700 pt-4 max-h-96 overflow-y-auto">
            <CommentSection 
              episodeId={episode.id}
              onClose={() => setShowComments(false)} 
            />
          </div>
        )}
      </div>
    </article>
  );
}

