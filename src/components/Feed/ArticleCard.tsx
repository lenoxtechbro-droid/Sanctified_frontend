import { Link } from "react-router-dom";
import type { Article } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { LikeButton } from "../LikeButton";
import { CommentCount } from "../CommentCount";

interface ArticleCardProps {
  article: Article;
  onCommentClick?: () => void;
}

export function ArticleCard({ article, onCommentClick }: ArticleCardProps) {
  const { role } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const canRead = !article.is_premium || role === "premium" || role === "admin";

  return (
    <article className={`rounded-xl border overflow-hidden shadow-sm transition hover:shadow-md ${
      isDark 
        ? "border-gray-700 bg-gray-800" 
        : "border-navy/10 bg-white"
    }`}>
      <div className={`relative h-40 ${isDark ? "bg-gray-700" : "bg-navy/10"}`}>
        {article.image_url ? (
          <img src={article.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center text-4xl ${
            isDark ? "text-gray-500" : "text-navy/30"
          }`}>📖</div>
        )}
        <span className="absolute left-2 top-2 rounded bg-gold px-2 py-0.5 text-xs font-medium text-white">
          {article.category}
        </span>
        {article.is_premium && (
          <span className="absolute right-2 top-2 rounded bg-navy px-2 py-0.5 text-xs font-medium text-white">
            Premium
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className={`font-semibold line-clamp-2 ${
          isDark ? "text-gray-100" : "text-navy-dark"
        }`}>
          {article.title}
        </h3>
        <p className={`mt-1 text-sm line-clamp-2 ${
          isDark ? "text-gray-400" : "text-navy/70"
        }`}>
          {article.excerpt ?? article.body}
        </p>
        <p className={`mt-1 text-xs ${
          isDark ? "text-gray-500" : "text-navy/60"
        }`}>
          {article.author_name} · {article.read_minutes ?? "?"} min read
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <LikeButton targetType="article" targetId={article.id} />
            <CommentCount articleId={article.id} onViewClick={onCommentClick} />
          </div>
          {canRead ? (
            <Link
              to={`/articles/${article.id}`}
              className="rounded bg-gold px-3 py-1.5 text-sm font-medium text-white hover:bg-gold-dark"
            >
              Read Article →
            </Link>
          ) : (
            <span className={`text-sm ${isDark ? "text-gray-500" : "text-navy/60"}`}>
              Premium only
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
