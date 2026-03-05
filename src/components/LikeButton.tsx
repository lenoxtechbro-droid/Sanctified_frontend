import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

type TargetType = "episode" | "article" | "comment";

interface LikeButtonProps {
  targetType: TargetType;
  targetId: string;
  className?: string;
}

export function LikeButton({ targetType, targetId, className = "" }: LikeButtonProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  const episodeId = targetType === "episode" ? targetId : null;
  const articleId = targetType === "article" ? targetId : null;
  const commentId = targetType === "comment" ? targetId : null;

  const fetchCount = useCallback(async () => {
    const col = targetType === "episode" ? "episode_id" : targetType === "article" ? "article_id" : "comment_id";
    const { count: c, error } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq(col, targetId);
    if (!error) setCount(c ?? 0);
  }, [targetType, targetId]);

  const fetchUserLike = useCallback(async () => {
    if (!user?.id) return;
    const col = targetType === "episode" ? "episode_id" : targetType === "article" ? "article_id" : "comment_id";
    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq(col, targetId)
      .maybeSingle();
    setLiked(!!data);
  }, [user?.id, targetType, targetId]);

  useEffect(() => {
    fetchCount();
    fetchUserLike();
  }, [fetchCount, fetchUserLike]);

  useEffect(() => {
    const channel = supabase
      .channel(`likes:${targetType}:${targetId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "likes",
          filter: episodeId ? `episode_id=eq.${episodeId}` : articleId ? `article_id=eq.${articleId}` : `comment_id=eq.${commentId}`,
        },
        () => {
          fetchCount();
          fetchUserLike();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetType, targetId, episodeId, articleId, commentId, fetchCount, fetchUserLike]);

  const toggle = async () => {
    if (!user?.id) return;
    if (liked) {
      const col = targetType === "episode" ? "episode_id" : targetType === "article" ? "article_id" : "comment_id";
      await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq(col, targetId);
    } else {
      await (supabase.from("likes") as any).insert({
        user_id: user.id,
        episode_id: episodeId,
        article_id: articleId,
        comment_id: commentId,
      });
    }
    fetchCount();
    setLiked(!liked);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!user}
      className={`flex items-center gap-1 text-sm hover:text-sanctified-red disabled:opacity-50 ${className} ${
        isDark ? "text-gray-400" : "text-navy/70"
      } ${liked ? "text-sanctified-red" : ""}`}
      aria-pressed={liked}
    >
      <span className={liked ? "text-sanctified-red" : ""}>{liked ? "♥" : "♡"}</span>
      <span>{count}</span>
    </button>
  );
}
