import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import type { Episode, Article } from "../types";
import { EpisodeCard } from "../components/Feed/EpisodeCard";
import { ArticleCard } from "../components/Feed/ArticleCard";
import { CommentSection } from "../components/Comments/CommentSection";
import { VideoPlayerModal } from "../components/Video/VideoPlayerModal";

type Tab = "episodes" | "articles";

export function FavoritesPage() {
  const { user, role } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [tab, setTab] = useState<Tab>("episodes");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentTarget, setCommentTarget] = useState<{ episodeId?: string; articleId?: string } | null>(null);
  const [videoTarget, setVideoTarget] = useState<Episode | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    // Fetch liked episodes
    const { data: epLikes } = await supabase
      .from("likes")
      .select("episode_id")
      .eq("user_id", user.id)
      .not("episode_id", "is", null);

    const epIds = ((epLikes ?? []) as any[]).map((l) => l.episode_id).filter(Boolean) as string[];

    if (epIds.length > 0) {
      let q = supabase
        .from("episodes")
        .select("id, title, description, author_name, category, duration_minutes, audio_url, video_url, thumbnail_url, is_premium, created_at")
        .in("id", epIds)
        .order("created_at", { ascending: false });
      if (role !== "premium" && role !== "admin") {
        q = q.eq("is_premium", false);
      }
      const { data } = await q;
      setEpisodes((data ?? []) as Episode[]);
    } else {
      setEpisodes([]);
    }

    // Fetch liked articles
    const { data: artLikes } = await supabase
      .from("likes")
      .select("article_id")
      .eq("user_id", user.id)
      .not("article_id", "is", null);

    const artIds = ((artLikes ?? []) as any[]).map((l) => l.article_id).filter(Boolean) as string[];

    if (artIds.length > 0) {
      let q = supabase
        .from("articles")
        .select("id, title, body, excerpt, author_name, category, image_url, read_minutes, is_premium, created_at")
        .in("id", artIds)
        .order("created_at", { ascending: false });
      if (role !== "premium" && role !== "admin") {
        q = q.eq("is_premium", false);
      }
      const { data } = await q;
      setArticles((data ?? []) as Article[]);
    } else {
      setArticles([]);
    }

    setLoading(false);
  }, [user?.id, role]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const EmptyState = ({ type }: { type: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 rounded-xl border border-dashed ${
        isDark ? "border-gray-700 text-gray-400" : "border-navy/20 text-navy/50"
      }`}
    >
      <span className="text-4xl mb-3">♡</span>
      <p className="text-sm font-medium">No liked {type} yet</p>
      <p className="text-xs mt-1 mb-4">
        Heart any {type === "episodes" ? "sermon or podcast" : "article"} to save it here.
      </p>
      <Link
        to="/"
        className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-gold/90 transition-colors"
      >
        Browse Content →
      </Link>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-navy-dark"}`}>
          ♥ My Favorites
        </h1>
        <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-navy/60"}`}>
          All the content you've liked, saved in one place.
        </p>
      </div>

      {/* Tabs */}
      <div className={`flex rounded-xl p-1 w-fit ${isDark ? "bg-gray-800" : "bg-navy/5"}`}>
        {(["episodes", "articles"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t
                ? isDark
                  ? "bg-gray-700 text-white shadow"
                  : "bg-white text-navy-dark shadow"
                : isDark
                ? "text-gray-400 hover:text-white"
                : "text-navy/60 hover:text-navy"
            }`}
          >
            {t === "episodes" ? "📻 Sermons & Podcasts" : "📄 Articles"}
            {/* badge */}
            {!loading && (
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                tab === t
                  ? "bg-gold text-white"
                  : isDark ? "bg-gray-600 text-gray-300" : "bg-navy/10 text-navy/70"
              }`}>
                {t === "episodes" ? episodes.length : articles.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`h-40 animate-pulse rounded-xl ${isDark ? "bg-gray-800" : "bg-navy/5"}`}
            />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "episodes" ? (
              episodes.length === 0 ? (
                <EmptyState type="episodes" />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {episodes.map((ep) => (
                    <EpisodeCard
                      key={ep.id}
                      episode={ep}
                      onCommentClick={() => setCommentTarget({ episodeId: ep.id })}
                      onVideoClick={() => setVideoTarget(ep)}
                    />
                  ))}
                </div>
              )
            ) : articles.length === 0 ? (
              <EmptyState type="articles" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((art) => (
                  <ArticleCard
                    key={art.id}
                    article={art}
                    onCommentClick={() => setCommentTarget({ articleId: art.id })}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Comment section overlay */}
      {commentTarget && (
        <CommentSection
          episodeId={commentTarget.episodeId}
          articleId={commentTarget.articleId}
          onClose={() => setCommentTarget(null)}
        />
      )}

      {/* Video modal */}
      {videoTarget?.video_url && (
        <VideoPlayerModal
          title={videoTarget.title}
          videoUrl={videoTarget.video_url}
          onClose={() => setVideoTarget(null)}
        />
      )}
    </div>
  );
}
