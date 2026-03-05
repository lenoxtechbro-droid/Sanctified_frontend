import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useTheme } from "../contexts/ThemeContext";

interface CommentCountProps {
  episodeId?: string;
  articleId?: string;
  onViewClick?: () => void;
}

export function CommentCount({ episodeId, articleId, onViewClick }: CommentCountProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    let q = supabase.from("comments").select("*", { count: "exact", head: true });
    if (episodeId) q = q.eq("episode_id", episodeId);
    if (articleId) q = q.eq("article_id", articleId);
    const { count: c, error } = await q;
    if (!error) setCount(c ?? 0);
  }, [episodeId, articleId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Realtime subscription for comment count updates
  useEffect(() => {
    const targetId = episodeId ?? articleId;
    if (!targetId) return;

    // Use a unique channel name to avoid conflicts with CommentSection
    const channel = supabase
      .channel(`comment-count:${targetId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: episodeId ? `episode_id=eq.${episodeId}` : `article_id=eq.${articleId}`,
        },
        () => {
          // Refetch count on any comment change
          fetchCount();
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("CommentCount: Realtime subscription error");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [episodeId, articleId, fetchCount]);

  return (
    <button
      type="button"
      onClick={onViewClick}
      className={`flex items-center gap-1 text-sm hover:underline ${
        isDark ? "text-gray-400" : "text-navy/70"
      }`}
    >
      <span aria-hidden>💬</span> {count}
    </button>
  );
}
