import type { Episode } from "../../types";
import { usePlayer } from "../../contexts/PlayerContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { LikeButton } from "../LikeButton";
import { CommentCount } from "../CommentCount";

interface EpisodeCardProps {
  episode: Episode;
  onCommentClick?: () => void;
  onVideoClick?: () => void;
}

export function EpisodeCard({ episode, onCommentClick, onVideoClick }: EpisodeCardProps) {
  const { setNowPlaying } = usePlayer();
  const { role } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const canPlay = !episode.is_premium || role === "premium" || role === "admin";

  const handlePlay = () => {
    if (!canPlay) return;
    setNowPlaying({
      id: episode.id,
      title: episode.title,
      author: episode.author_name,
      audioUrl: episode.audio_url,
      thumbnailUrl: episode.thumbnail_url,
    });
  };

  return (
    <article className={`rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
      isDark 
        ? "border-gray-700 bg-gray-800" 
        : "border-navy/10 bg-white"
    }`}>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handlePlay}
          disabled={!canPlay}
          className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-lg ${
            isDark ? "bg-gray-700" : "bg-navy/10"
          }`}
        >
          {episode.thumbnail_url ? (
            <img src={episode.thumbnail_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className={`flex h-full w-full items-center justify-center text-2xl ${isDark ? "text-gray-400" : "text-gold"}`}>♪</span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition hover:opacity-100">
            <span className={`rounded-full p-2 ${isDark ? "bg-gray-700 text-gray-200" : "bg-white/90 text-navy"}`}>▶</span>
          </span>
          {episode.is_premium && (
            <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 text-xs font-medium text-white">
              Premium
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
            isDark 
              ? "bg-gray-700 text-gray-300" 
              : "bg-navy/10 text-navy"
          }`}>
            {episode.category}
          </span>
          <h3 className={`mt-1 font-semibold line-clamp-2 ${
            isDark ? "text-gray-100" : "text-navy-dark"
          }`}>
            {episode.title}
          </h3>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-navy/70"}`}>
            {episode.author_name}
          </p>
          <p className={`text-xs ${isDark ? "text-gray-500" : "text-navy/60"}`}>
            {episode.duration_minutes != null ? `${episode.duration_minutes} min` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <LikeButton targetType="episode" targetId={episode.id} />
            <CommentCount episodeId={episode.id} onViewClick={onCommentClick} />
            {episode.video_url && (
              <button
                type="button"
                onClick={
                  onVideoClick
                    ? onVideoClick
                    : () => window.open(episode.video_url as string, "_blank", "noopener,noreferrer")
                }
                className="text-xs font-medium text-gold hover:underline"
              >
                Watch video
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
