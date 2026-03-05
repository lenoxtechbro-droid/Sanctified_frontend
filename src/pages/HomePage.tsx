import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Episode, Article } from "../types";
import { EpisodeCard } from "../components/Feed/EpisodeCard";
import { ArticleCard } from "../components/Feed/ArticleCard";
import { CommentSection } from "../components/Comments/CommentSection";
import { VideoPlayerModal } from "../components/Video/VideoPlayerModal";

export function HomePage() {
  const { role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [commentTarget, setCommentTarget] = useState<{ episodeId?: string; articleId?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoTarget, setVideoTarget] = useState<Episode | null>(null);

  const fetchEpisodes = useCallback(async () => {
    let q = supabase
      .from("episodes")
      .select("id, title, description, author_name, category, duration_minutes, audio_url, video_url, thumbnail_url, is_premium, created_at")
      .order("created_at", { ascending: false })
      .limit(9);
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
      .order("created_at", { ascending: false })
      .limit(6);
    if (role !== "premium" && role !== "admin") {
      q = q.eq("is_premium", false);
    }
    const { data, error } = await q;
    if (!error) setArticles((data ?? []) as Article[]);
  }, [role]);

  useEffect(() => {
    Promise.all([fetchEpisodes(), fetchArticles()]).finally(() => setLoading(false));
  }, [fetchEpisodes, fetchArticles]);

  return (
    <div className="space-y-8">
      {searchParams.get("login") === "success" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3 text-emerald-900 dark:text-emerald-100">
          <div className="text-sm">
            <span className="font-semibold">Success:</span> You're now signed in.
          </div>
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("login");
              setSearchParams(next, { replace: true });
            }}
            className="rounded-lg bg-white/70 dark:bg-white/10 px-3 py-1.5 text-sm font-medium text-emerald-900 dark:text-emerald-100 hover:bg-white dark:hover:bg-white/20"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Live / Announcement banner */}
      <div className="rounded-xl border border-navy/10 bg-navy dark:bg-gray-800 px-4 py-3 text-white">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2 py-0.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-green-400" /> Streaming in HD · Connected
          </span>
          <span className="text-gold font-medium">
            Join us live every Sunday at 10:00 AM EST for worship, teaching, and fellowship.
          </span>
        </div>
      </div>

      {/* Featured + Comments placeholder */}
      <section>
        <h2 className="text-lg font-semibold text-navy-dark dark:text-white">Featured Episode</h2>
        <p className="text-sm text-navy/70 dark:text-gray-400">Latest sermon or podcast appears here.</p>
        {episodes[0] && (
          <div className="mt-2">
            <EpisodeCard
              episode={episodes[0]}
              onCommentClick={() => setCommentTarget({ episodeId: episodes[0].id })}
              onVideoClick={() => setVideoTarget(episodes[0]!)}
            />
          </div>
        )}
      </section>

      {commentTarget && (
        <CommentSection
          episodeId={commentTarget.episodeId}
          articleId={commentTarget.articleId}
          onClose={() => setCommentTarget(null)}
        />
      )}

      {videoTarget && videoTarget.video_url && (
        <VideoPlayerModal
          title={videoTarget.title}
          videoUrl={videoTarget.video_url}
          onClose={() => setVideoTarget(null)}
        />
      )}

      {/* Recent Sermons & Podcasts */}
      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-navy-dark dark:text-white">Recent Sermons & Podcasts</h2>
          <Link to="/sermons" className="text-sm font-medium text-gold hover:underline">
            View All →
          </Link>
        </div>
        {loading ? (
          <p className="py-6 text-center text-navy/60 dark:text-gray-400">Loading...</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {episodes.slice(0, 6).map((ep) => (
              <EpisodeCard
                key={ep.id}
                episode={ep}
                onCommentClick={() => setCommentTarget({ episodeId: ep.id })}
                onVideoClick={() => setVideoTarget(ep)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent Articles */}
      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-navy-dark dark:text-white">Recent Articles</h2>
          <Link to="/articles" className="text-sm font-medium text-gold hover:underline">
            View All →
          </Link>
        </div>
        {loading ? null : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.slice(0, 3).map((art) => (
              <ArticleCard
                key={art.id}
                article={art}
                onCommentClick={() => setCommentTarget({ articleId: art.id })}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
