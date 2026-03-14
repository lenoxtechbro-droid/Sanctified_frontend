import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import type { Episode, Article } from "../types";
import { EpisodeCard } from "../components/Feed/EpisodeCard";
import { ArticleCard } from "../components/Feed/ArticleCard";
import { CommentSection } from "../components/Comments/CommentSection";
import { VideoPlayerModal } from "../components/Video/VideoPlayerModal";

type Tab = "all" | "episodes" | "articles";

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const queryParam = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(queryParam);
  const [tab, setTab] = useState<Tab>("all");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{ episodeId?: string; articleId?: string } | null>(null);
  const [videoTarget, setVideoTarget] = useState<Episode | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setEpisodes([]);
        setArticles([]);
        setHasSearched(false);
        return;
      }
      setLoading(true);
      setHasSearched(true);

      const pattern = `%${trimmed}%`;

      // Search episodes
      let epQ = supabase
        .from("episodes")
        .select("id, title, description, author_name, category, duration_minutes, audio_url, video_url, thumbnail_url, is_premium, created_at")
        .or(`title.ilike.${pattern},description.ilike.${pattern},author_name.ilike.${pattern},category.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(24);
      if (role !== "premium" && role !== "admin") epQ = epQ.eq("is_premium", false);
      const { data: epData } = await epQ;

      // Search articles
      let artQ = supabase
        .from("articles")
        .select("id, title, body, excerpt, author_name, category, image_url, read_minutes, is_premium, created_at")
        .or(`title.ilike.${pattern},excerpt.ilike.${pattern},author_name.ilike.${pattern},category.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(24);
      if (role !== "premium" && role !== "admin") artQ = artQ.eq("is_premium", false);
      const { data: artData } = await artQ;

      setEpisodes((epData ?? []) as Episode[]);
      setArticles((artData ?? []) as Article[]);
      setLoading(false);
    },
    [role]
  );

  // Run search when URL param changes
  useEffect(() => {
    if (queryParam) runSearch(queryParam);
  }, [queryParam, runSearch]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchParams(value.trim() ? { q: value.trim() } : {}, { replace: true });
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = inputValue.trim();
    setSearchParams(trimmed ? { q: trimmed } : {}, { replace: true });
    if (trimmed) runSearch(trimmed);
  };

  const clearSearch = () => {
    setInputValue("");
    setSearchParams({}, { replace: true });
    setEpisodes([]);
    setArticles([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const totalResults = episodes.length + articles.length;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All", count: totalResults },
    { id: "episodes", label: "📻 Sermons & Podcasts", count: episodes.length },
    { id: "articles", label: "📄 Articles", count: articles.length },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-navy-dark"}`}>
          Search
        </h1>
        <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-navy/60"}`}>
          Find sermons, podcasts, and articles.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit}>
        <div className={`relative flex items-center rounded-xl border shadow-sm ${
          isDark
            ? "border-gray-700 bg-gray-800"
            : "border-navy/20 bg-white"
        }`}>
          <Search className={`absolute left-4 w-5 h-5 shrink-0 ${isDark ? "text-gray-400" : "text-navy/40"}`} />
          <input
            ref={inputRef}
            type="search"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search sermons, podcasts, articles…"
            className={`w-full bg-transparent py-3.5 pl-11 pr-10 text-base outline-none ${
              isDark ? "text-white placeholder-gray-500" : "text-navy-dark placeholder-navy/40"
            }`}
          />
          <AnimatePresence>
            {inputValue && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearSearch}
                className={`absolute right-3 rounded-full p-1 ${
                  isDark ? "text-gray-400 hover:text-white" : "text-navy/50 hover:text-navy"
                }`}
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`h-40 animate-pulse rounded-xl ${isDark ? "bg-gray-800" : "bg-navy/5"}`}
            />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <>
          {/* Result summary + tabs */}
          <div className="space-y-3">
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-navy/60"}`}>
              {totalResults === 0
                ? `No results for "${queryParam}"`
                : `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${queryParam}"`}
            </p>

            {totalResults > 0 && (
              <div className={`flex gap-1 rounded-xl p-1 w-fit ${isDark ? "bg-gray-800" : "bg-navy/5"}`}>
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      tab === t.id
                        ? isDark
                          ? "bg-gray-700 text-white shadow"
                          : "bg-white text-navy-dark shadow"
                        : isDark
                        ? "text-gray-400 hover:text-white"
                        : "text-navy/60 hover:text-navy"
                    }`}
                  >
                    {t.label}
                    <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                      tab === t.id
                        ? "bg-gold text-white"
                        : isDark ? "bg-gray-600 text-gray-300" : "bg-navy/10 text-navy/70"
                    }`}>
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {totalResults === 0 ? (
                <div className={`flex flex-col items-center justify-center py-16 rounded-xl border border-dashed ${
                  isDark ? "border-gray-700 text-gray-400" : "border-navy/20 text-navy/50"
                }`}>
                  <span className="text-4xl mb-3">🔍</span>
                  <p className="text-sm font-medium">Nothing found</p>
                  <p className="text-xs mt-1">Try different keywords or check spelling.</p>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="mt-4 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-gold/90"
                  >
                    Browse all content →
                  </button>
                </div>
              ) : (
                <>
                  {/* Episodes section */}
                  {(tab === "all" || tab === "episodes") && episodes.length > 0 && (
                    <section>
                      {tab === "all" && (
                        <h2 className={`text-base font-semibold mb-4 ${isDark ? "text-gray-200" : "text-navy-dark"}`}>
                          📻 Sermons & Podcasts
                        </h2>
                      )}
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
                    </section>
                  )}

                  {/* Articles section */}
                  {(tab === "all" || tab === "articles") && articles.length > 0 && (
                    <section>
                      {tab === "all" && (
                        <h2 className={`text-base font-semibold mb-4 ${isDark ? "text-gray-200" : "text-navy-dark"}`}>
                          📄 Articles
                        </h2>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {articles.map((art) => (
                          <ArticleCard
                            key={art.id}
                            article={art}
                            onCommentClick={() => setCommentTarget({ articleId: art.id })}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {/* Idle state — no search yet */}
      {!loading && !hasSearched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`flex flex-col items-center justify-center py-20 ${
            isDark ? "text-gray-500" : "text-navy/30"
          }`}
        >
          <Search className="w-12 h-12 mb-3" />
          <p className="text-base font-medium">Start typing to search</p>
          <p className="text-sm mt-1">Searching sermons, podcasts, and articles</p>
        </motion.div>
      )}

      {commentTarget && (
        <CommentSection
          episodeId={commentTarget.episodeId}
          articleId={commentTarget.articleId}
          onClose={() => setCommentTarget(null)}
        />
      )}
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
