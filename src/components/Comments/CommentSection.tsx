import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import type { Comment } from "../../types";

interface CommentSectionProps {
  episodeId?: string;
  articleId?: string;
  onClose?: () => void;
}

interface CommentRow {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

export function CommentSection({ episodeId, articleId, onClose }: CommentSectionProps) {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [comments, setComments] = useState<Comment[]>([]);
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    let q = supabase
      .from("comments")
      .select("id, content, user_id, created_at")
      .order("created_at", { ascending: true });
    if (episodeId) q = q.eq("episode_id", episodeId);
    if (articleId) q = q.eq("article_id", articleId);
    const { data, error } = await q;
    if (error) {
      console.warn("Comments fetch error:", error);
      setComments([]);
      setLoading(false);
      return;
    }
    const withAuthor: Comment[] = (data as CommentRow[] ?? []).map((c) => ({
      id: c.id,
      content: c.content,
      episode_id: episodeId ?? null,
      article_id: articleId ?? null,
      user_id: c.user_id,
      created_at: c.created_at,
    }));
    setComments(withAuthor);
    setLoading(false);
  }, [episodeId, articleId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Realtime: when anyone inserts/updates/deletes a comment for this episode/article, refresh the list
  useEffect(() => {
    const targetId = episodeId ?? articleId;
    if (!targetId) return;

    const channel = supabase
      .channel(`comments:${targetId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: episodeId ? `episode_id=eq.${episodeId}` : `article_id=eq.${articleId}`,
        },
        () => {
          fetchComments(false); // refresh without showing "Loading..."
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("Realtime subscription error. Enable Realtime for table 'comments' in Supabase: Database → Replication.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [episodeId, articleId, fetchComments]);

  const postComment = async () => {
    const content = newContent.trim();
    if (!content || !user?.id) return;
    
    // Using type assertion to work around Supabase type inference issues
    await (supabase.from("comments") as any).insert({
      content,
      episode_id: episodeId ?? null,
      article_id: articleId ?? null,
      user_id: user.id,
    });
    setNewContent("");
    fetchComments(false); // update list without "Loading..." (Realtime will also push the new comment)
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${
      isDark 
        ? "border-gray-700 bg-gray-800" 
        : "border-navy/10 bg-white"
    }`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-semibold ${
          isDark ? "text-gray-100" : "text-navy-dark"
        }`}>
          Comments ({comments.length})
        </h3>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className={`text-sm hover:underline ${
              isDark ? "text-gray-400" : "text-navy/70"
            }`}
          >
            Close
          </button>
        )}
      </div>
      {user ? (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Share your thoughts..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && postComment()}
            className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm ${
              isDark 
                ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" 
                : "border-navy/20"
            }`}
          />
          <button
            type="button"
            onClick={postComment}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-gold-dark"
          >
            Post Comment
          </button>
        </div>
      ) : (
        <p className={`mb-3 text-sm ${
          isDark ? "text-gray-400" : "text-navy/60"
        }`}>
          Sign in to comment.
        </p>
      )}
      <p className={`mb-2 text-xs ${
        isDark ? "text-gray-500" : "text-navy/60"
      }`}>
        Click below to see what others are saying.
      </p>
      {loading ? (
        <p className={`text-sm ${
          isDark ? "text-gray-400" : "text-navy/60"
        }`}>
          Loading...
        </p>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li 
              key={c.id} 
              className={`rounded-lg p-2 text-sm ${
                isDark ? "bg-gray-700" : "bg-navy/5"
              }`}
            >
              <p className={isDark ? "text-gray-100" : "text-navy-dark"}>
                {c.content}
              </p>
              <p className={`mt-0.5 text-xs ${
                isDark ? "text-gray-500" : "text-navy/60"
              }`}>
                {profile?.id === c.user_id ? "You" : "User"} · {new Date(c.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
