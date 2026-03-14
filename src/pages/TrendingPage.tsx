import { useCallback, useEffect, useState } from "react";
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

interface RankedEpisode extends Episode { like_count: number }
interface RankedArticle extends Article { like_count: number }

export function TrendingPage() {
  const { role } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [tab, setTab] = useState<Tab>("episodes");
  const [episodes, setEpisodes] = useState<RankedEpisode[]>([]);
  const [articles, setArticles] = useState<RankedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentTarget, setCommentTarget] = useState<{ episodeId?: string; articleId?: string } | null>(null);
  const [videoTarget, setVideoTarget] = useState<Episode | null>(null);

  const fetchTrending = useCallback(async () => {
    setLoading(true);

    // ── Trending episodes ─────────────────────────────────────────────────
    // Get episodes, then count their likes client-side and sort.
    // (Supabase free tier doesn't support window functions, so we aggregate manually.)
    const { data: epLikes } = await supabase
      .from("likes")
      .select("episode_id")
      .not("episode_id", "is", null);

    // Count likes per episode
    const epLikeCounts: Record<string, number> = {};
    for (const l of ((epLikes ?? []) as any[])) {
      if (l.episode_id) {
        epLikeCounts[l.episode_id] = (epLikeCounts[l.episode_id] ?? 0) + 1;
      }
    }

    let epQuery = supabase
      .from("episodes")
      .select("id, title, description, author_name, category, duration_minutes, audio_url, video_url, thumbnail_url, is_premium, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (role !== "premium" && role !== "admin") {
      epQuery = epQuery.eq("is_premium", false);
    }
    const { data: epData } = await epQuery;

    const rankedEpisodes: RankedEpisode[] = ((epData ?? []) as Episode[])
      .map((ep) => ({ ...ep, like_count: epLikeCounts[ep.id] ?? 0 }))
      .sort((a, b) => b.like_count - a.like_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setEpisodes(rankedEpisodes);

    // ── Trending articles ─────────────────────────────────────────────────
    const { data: artLikes } = await supabase
      .from("likes")
      .select("article_id")
      .not("article_id", "is", null);

    const artLikeCounts: Record<string, number> = {};
    for (const l of ((artLikes ?? []) as any[])) {
      if (l.article_id) {
        artLikeCounts[l.article_id] = (artLikeCounts[l.article_id] ?? 0) + 1;
      }
    }

    let artQuery = supabase
      .from("articles")
      .select("id, title, body, excerpt, author_name, category, image_url, read_minutes, is_premium, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (role !== "premium" && role !== "admin") {
      artQuery = artQuery.eq("is_premium", false);
    }
    const { data: artData } = await artQuery;

    const rankedArticles: RankedArticle[] = ((artData ?? []) as Article[])
      .map((art) => ({ ...art, like_count: artLikeCounts[art.id] ?? 0 }))
      .sort((a, b) => b.like_count - a.like_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setArticles(rankedArticles);
    setLoading(false);
  }, [role]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 rounded-xl border border-dashed ${
        isDark ? "border-gray-700 text-gray-400" : "border-navy/20 text-navy/50"
      }`}
    >
      <span className="text-4xl mb-3">↑</span>
      <p className="text-sm font-medium">Nothing trending yet</p>
      <p className="text-xs mt-1">Be the first to like some content!</p>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-navy-dark"}`}>
          ↑ Trending
        </h1>
        <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-navy/60"}`}>
          The most-liked sermons and articles from the community.
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
                <EmptyState />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {episodes.map((ep, idx) => (
                    <div key={ep.id} className="relative">
                      {/* Rank badge */}
                      <span className={`absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow ${
                        idx === 0 ? "bg-gold text-white" :
                        idx === 1 ? "bg-gray-400 text-white" :
                        idx === 2 ? "bg-amber-700 text-white" :
                        isDark ? "bg-gray-700 text-gray-300" : "bg-navy/10 text-navy"
                      }`}>
                        {idx + 1}
                      </span>
                      {/* Like count chip */}
                      {ep.like_count > 0 && (
                        <span className="absolute -top-2 right-2 z-10 flex items-center gap-0.5 rounded-full bg-red-500/90 px-2 py-0.5 text-xs font-semibold text-white shadow">
                          ♥ {ep.like_count}
                        </span>
                      )}
                      <EpisodeCard
                        episode={ep}
                        onCommentClick={() => setCommentTarget({ episodeId: ep.id })}
                        onVideoClick={() => setVideoTarget(ep)}
                      />
                    </div>
                  ))}
                </div>
              )
            ) : articles.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((art, idx) => (
                  <div key={art.id} className="relative">
                    <span className={`absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow ${
                      idx === 0 ? "bg-gold text-white" :
                      idx === 1 ? "bg-gray-400 text-white" :
                      idx === 2 ? "bg-amber-700 text-white" :
                      isDark ? "bg-gray-700 text-gray-300" : "bg-navy/10 text-navy"
                    }`}>
                      {idx + 1}
                    </span>
                    {art.like_count > 0 && (
                      <span className="absolute -top-2 right-2 z-10 flex items-center gap-0.5 rounded-full bg-red-500/90 px-2 py-0.5 text-xs font-semibold text-white shadow">
                        ♥ {art.like_count}
                      </span>
                    )}
                    <ArticleCard
                      article={art}
                      onCommentClick={() => setCommentTarget({ articleId: art.id })}
                    />
                  </div>
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
