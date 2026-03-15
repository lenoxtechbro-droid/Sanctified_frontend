import { useCallback, useEffect, useRef, useState } from "react";
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
  const subscriptionFailedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const retryDelay = 1000; // ms

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
    if (!targetId) {
      console.warn("CommentCount: Missing episodeId or articleId");
      return;
    }

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
        console.log(`CommentCount [${targetId}]: Subscription status: ${status}`);
        if (status === "CHANNEL_ERROR") {
          console.error(`CommentCount [${targetId}]: Realtime error, retry ${retryCountRef.current + 1}/${maxRetries}`);
          retryCountRef.current += 1;
          if (retryCountRef.current < maxRetries) {
            setTimeout(() => {
              // Retry logic: soft reload to recreate effect
              window.location.reload();
            }, retryDelay * Math.pow(2, retryCountRef.current));
          } else {
            subscriptionFailedRef.current = true;
            console.warn(`CommentCount [${targetId}]: Max retries exceeded, falling back to polling`);
          }
        } else if (status === "SUBSCRIBED") {
          console.log(`CommentCount [${targetId}]: Realtime subscribed successfully`);
          retryCountRef.current = 0;
          subscriptionFailedRef.current = false;
        }
      });

    return () => {
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      }
    };
  }, [episodeId, articleId, fetchCount]);

  // Fallback polling if realtime fails after max retries
  useEffect(() => {
    if (!subscriptionFailedRef.current) return;

    console.log("CommentCount: Starting polling fallback");
    const interval = setInterval(fetchCount, 30000); // Poll every 30s

    return () => clearInterval(interval);
  }, [fetchCount, subscriptionFailedRef]);

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
