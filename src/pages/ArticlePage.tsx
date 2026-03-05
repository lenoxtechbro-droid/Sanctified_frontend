import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Article } from "../types";
import { useAuth } from "../contexts/AuthContext";

export function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Article not found.");
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("articles")
        .select(
          "id, title, body, excerpt, author_name, category, image_url, read_minutes, is_premium, created_at",
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Article not found.");
        setLoading(false);
        return;
      }

      const a = data as Article;
      if (a.is_premium && role !== "premium" && role !== "admin") {
        setError("This article is available to premium members only.");
        setLoading(false);
        return;
      }

      setArticle(a);
      setLoading(false);
    })();
  }, [id, role]);

  if (loading) {
    return (
      <div className="py-10 text-center text-navy/70 dark:text-gray-300">
        Loading article…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        <button
          type="button"
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
          onClick={() => navigate(-1)}
        >
          Go back
        </button>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6 py-6">
      <header className="space-y-2">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy/70 hover:bg-navy/5 hover:text-gold dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gold"
        >
          ← Back to Home
        </button>
        <p className="text-xs font-semibold uppercase tracking-wide text-gold">
          {article.category}
        </p>
        <h1 className="text-2xl font-bold text-navy-dark dark:text-white">
          {article.title}
        </h1>
        <p className="text-sm text-navy/60 dark:text-gray-400">
          {article.author_name} ·{" "}
          {article.read_minutes ? `${article.read_minutes} min read` : "Article"}
        </p>
      </header>

      {article.image_url && (
        <div className="overflow-hidden rounded-xl">
          <img
            src={article.image_url}
            alt=""
            className="h-64 w-full object-cover"
          />
        </div>
      )}

      <section className="prose max-w-none prose-p:mb-4 prose-headings:mt-6 prose-headings:mb-2 dark:prose-invert dark:text-gray-200">
        {article.body?.split("\n").map((para, idx) => (
          <p key={idx} className="dark:text-gray-300">{para}</p>
        ))}
      </section>
    </article>
  );
}

