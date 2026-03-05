import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { usePlayer } from "../contexts/PlayerContext";
import type { Episode, Article } from "../types";
import { CommentSection } from "../components/Comments/CommentSection";
import { VideoPlayerModal } from "../components/Video/VideoPlayerModal";

type TabType = "all" | "sermons" | "articles";

export function LibraryPage() {
  const { role } = useAuth();
  const { setNowPlaying } = usePlayer();
  const [searchParams, setSearchParams] = useSearchParams();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [commentTarget, setCommentTarget] = useState<{ episodeId?: string; articleId?: string } | null>(null);
  const [videoTarget, setVideoTarget] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const fetchEpisodes = useCallback(async () => {
    let q = supabase
      .from("episodes")
      .select("id, title, description, author_name, category, duration_minutes, audio_url, video_url, thumbnail_url, is_premium, created_at")
      .order("created_at", { ascending: false });
    if (role !== "premium" && role !== "admin") {
      q = q.eq("is_premium", false);
    }
    const { data, error } = await q;
    if (!error) setEpisodes((data ?? []) as Episode[]);
  }, [role]);

  const fetchArticles = useCallback(async () => {
    let q = supabase
      .from("articles")
      .select("id, title, body, excerpt, author_name, category, image_url, read_minutes, is_premium, created_at")
      .order("created_at", { ascending: false });
    if (role !== "premium" && role !== "admin") {
      q = q.eq("is_premium", false);
    }
    const { data, error } = await q;
    if (!error) setArticles((data ?? []) as Article[]);
  }, [role]);

  useEffect(() => {
    Promise.all([fetchEpisodes(), fetchArticles()]).finally(() => setLoading(false));
  }, [fetchEpisodes, fetchArticles]);

  // Handle play - opens video modal if video exists, otherwise plays audio
  const handlePlay = (episode: Episode) => {
    const canPlay = !episode.is_premium || role === "premium" || role === "admin";
    if (!canPlay) return;
    
    // If video exists, open video modal
    if (episode.video_url) {
      setVideoTarget(episode);
    } else if (episode.audio_url) {
      // Otherwise, play audio in sticky player
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
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-2xl font-bold text-navy-dark dark:text-white">My Library</h1>
        <p className="text-navy/70 dark:text-gray-400">Browse all your sermons, podcasts, and articles</p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 border-b border-navy/10 dark:border-gray-700 pb-1"
      >
        {(["all", "sermons", "articles"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-navy dark:text-white"
                : "text-navy/60 dark:text-gray-400 hover:text-navy dark:hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && (
              <motion.div
                layoutId="activeTabLibrary"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </motion.div>

      {/* Content Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-4"
      >
        {activeTab === "all" && (
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎙️</span>
              <div>
                <p className="font-semibold text-navy-dark dark:text-white">{episodes.length}</p>
                <p className="text-navy/60 dark:text-gray-400">Sermons & Podcasts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📖</span>
              <div>
                <p className="font-semibold text-navy-dark dark:text-white">{articles.length}</p>
                <p className="text-navy/60 dark:text-gray-400">Articles</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === "sermons" && (
          <p className="text-sm text-navy/60 dark:text-gray-400">
            Showing {episodes.length} sermons and podcasts
          </p>
        )}
        {activeTab === "articles" && (
          <p className="text-sm text-navy/60 dark:text-gray-400">
            Showing {articles.length} articles
          </p>
        )}
      </motion.div>

      {/* Comment Section Modal */}
      {commentTarget && (
        <CommentSection
          episodeId={commentTarget.episodeId}
          articleId={commentTarget.articleId}
          onClose={() => setCommentTarget(null)}
        />
      )}

      {/* Video Player Modal */}
      {videoTarget && videoTarget.video_url && (
        <VideoPlayerModal
          title={videoTarget.title}
          videoUrl={videoTarget.video_url}
          onClose={() => setVideoTarget(null)}
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
            <p className="text-navy/60 dark:text-gray-400">Loading your library...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && activeTab === "all" && episodes.length === 0 && articles.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <span className="text-6xl mb-4">📚</span>
          <h2 className="text-xl font-semibold text-navy-dark dark:text-white mb-2">Your library is empty</h2>
          <p className="text-navy/60 dark:text-gray-400 max-w-md">
            Start exploring our content to build your personal library of sermons, podcasts, and articles.
          </p>
        </motion.div>
      )}

      {/* Episodes Grid - List View */}
      {!loading && episodes.length > 0 && (activeTab === "sermons" || activeTab === "all") && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-navy-dark dark:text-white">Sermons & Podcasts</h2>
          <div className="space-y-3">
            {episodes.map((ep) => (
              <motion.div
                key={ep.id}
                whileHover={{ scale: 1.01 }}
                className="flex gap-4 rounded-xl border border-navy/10 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm transition-all hover:shadow-md"
              >
                {/* Thumbnail with Play Button */}
                <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-navy/10">
                  {ep.thumbnail_url ? (
                    <img src={ep.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">🎙️</div>
                  )}
                  
                  {/* Play Overlay */}
                  <button
                    type="button"
                    onClick={() => handlePlay(ep)}
                    disabled={(ep.is_premium && role !== "premium" && role !== "admin")}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed"
                  >
                    <span className="rounded-full bg-white/90 p-2 text-navy shadow-lg">
                      ▶
                    </span>
                  </button>
                  
                  {/* Premium Badge */}
                  {ep.is_premium && (
                    <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Premium
                    </span>
                  )}
                  
                  {/* Video Badge */}
                  {ep.video_url && (
                    <span className="absolute right-1 top-1 rounded bg-navy px-1.5 py-0.5 text-[10px] font-medium text-white">
                      🎬 Video
                    </span>
                  )}
                </div>
                
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-navy-dark dark:text-white line-clamp-2">{ep.title}</h3>
                  </div>
                  <p className="text-sm text-navy/70 dark:text-gray-400">{ep.author_name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-navy/50 dark:text-gray-500">
                    <span className="rounded-full bg-gold/10 px-2 py-0.5 text-gold">{ep.category}</span>
                    {ep.duration_minutes && <span>⏱️ {ep.duration_minutes} min</span>}
                  </div>
                  
                  {/* Action Button */}
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handlePlay(ep)}
                      disabled={(ep.is_premium && role !== "premium" && role !== "admin")}
                      className="flex items-center gap-1 text-sm text-gold hover:text-gold-light disabled:opacity-50"
                    >
                      <span>▶</span> {ep.video_url ? "Watch" : "Play"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Articles Grid */}
      {!loading && articles.length > 0 && (activeTab === "articles" || activeTab === "all") && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-navy-dark dark:text-white">Articles</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((art) => (
              <motion.div
                key={art.id}
                whileHover={{ scale: 1.02 }}
                className="group overflow-hidden rounded-xl border border-navy/10 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative h-40 overflow-hidden">
                  {art.image_url ? (
                    <img src={art.image_url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-navy/10 text-4xl">📖</div>
                  )}
                  {art.is_premium && (
                    <span className="absolute right-2 top-2 rounded bg-gold px-2 py-0.5 text-xs font-medium text-white">
                      Premium
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-navy-dark dark:text-white line-clamp-2 group-hover:text-gold transition-colors">
                    {art.title}
                  </h3>
                  <p className="mt-1 text-sm text-navy/70 dark:text-gray-400 line-clamp-2">
                    {art.excerpt || art.body?.substring(0, 100)}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-navy/50 dark:text-gray-500">
                    <span className="rounded-full bg-gold/10 px-2 py-0.5 text-gold">{art.category}</span>
                    {art.read_minutes && <span>📖 {art.read_minutes} min</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
