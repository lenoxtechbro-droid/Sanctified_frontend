import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import type { Article, Episode } from "../types";

const ADMIN_API_KEY: string | undefined = import.meta.env.VITE_ADMIN_API_KEY;

type EpisodeForm = {
  title: string;
  description: string;
  author_name: string;
  category: string;
  duration_minutes: string;
  audio_url: string;
  video_url: string;
  thumbnail_url: string;
  is_premium: boolean;
};

type ArticleForm = {
  title: string;
  body: string;
  excerpt: string;
  author_name: string;
  category: string;
  image_url: string;
  read_minutes: string;
  is_premium: boolean;
};

const emptyEpisodeForm: EpisodeForm = {
  title: "",
  description: "",
  author_name: "",
  category: "",
  duration_minutes: "",
  audio_url: "",
  video_url: "",
  thumbnail_url: "",
  is_premium: false,
};

const emptyArticleForm: ArticleForm = {
  title: "",
  body: "",
  excerpt: "",
  author_name: "",
  category: "",
  image_url: "",
  read_minutes: "",
  is_premium: false,
};

export function AdminDashboard() {
  const { role, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [episodeForm, setEpisodeForm] = useState<EpisodeForm>(emptyEpisodeForm);
  const [articleForm, setArticleForm] = useState<ArticleForm>(emptyArticleForm);
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [savingEpisode, setSavingEpisode] = useState(false);
  const [savingArticle, setSavingArticle] = useState(false);
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleMediaUpload = async (
    file: File,
    field: "episode_audio_url" | "episode_video_url" | "episode_thumbnail_url" | "article_image_url",
  ) => {
    if (!ADMIN_API_KEY) {
      setError("Admin media upload is not configured (missing VITE_ADMIN_API_KEY).");
      return;
    }

    setUploadingField(field);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/admin/media/upload`, {
        method: "POST",
        headers: {
          "X-Admin-Key": ADMIN_API_KEY,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed with status ${res.status}`);
      }

      const data: { url?: string } = await res.json();
      if (!data.url) {
        throw new Error("No URL returned from media upload endpoint.");
      }

      if (field === "episode_audio_url") {
        setEpisodeForm((f) => ({ ...f, audio_url: data.url ?? "" }));
      } else if (field === "episode_video_url") {
        setEpisodeForm((f) => ({ ...f, video_url: data.url ?? "" }));
      } else if (field === "episode_thumbnail_url") {
        setEpisodeForm((f) => ({ ...f, thumbnail_url: data.url ?? "" }));
      } else if (field === "article_image_url") {
        setArticleForm((f) => ({ ...f, image_url: data.url ?? "" }));
      }

      setSuccessMessage("Media uploaded successfully.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to upload media.");
    } finally {
      setUploadingField(null);
    }
  };

  const loadContent = useCallback(async () => {
    setLoadingContent(true);
    setError(null);
    const [{ data: episodesData, error: episodesError }, { data: articlesData, error: articlesError }] =
      await Promise.all([
        supabase
          .from("episodes")
          .select(
            "id, title, description, author_name, category, duration_minutes, audio_url, video_url, thumbnail_url, is_premium, created_at, updated_at",
          )
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("articles")
          .select(
            "id, title, body, excerpt, author_name, category, image_url, read_minutes, is_premium, created_at, updated_at",
          )
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    if (episodesError || articlesError) {
      setError("Failed to load content. Please try again.");
    } else {
      setEpisodes((episodesData ?? []) as Episode[]);
      setArticles((articlesData ?? []) as Article[]);
    }
    setLoadingContent(false);
  }, []);

  useEffect(() => {
    if (!authLoading && role === "admin") {
      loadContent();
    }
  }, [authLoading, role, loadContent]);

  const handleEpisodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEpisode(true);
    setError(null);
    setSuccessMessage(null);

    const episodeData = {
      title: episodeForm.title.trim(),
      description: episodeForm.description.trim() || null,
      author_name: episodeForm.author_name.trim() || "Pastor",
      category: episodeForm.category.trim() || "Sermon",
      duration_minutes: episodeForm.duration_minutes ? Number(episodeForm.duration_minutes) : null,
      audio_url: episodeForm.audio_url.trim() || null,
      video_url: episodeForm.video_url.trim() || null,
      thumbnail_url: episodeForm.thumbnail_url.trim() || null,
      is_premium: episodeForm.is_premium,
    };

    const { error: insertError } = await supabase.from("episodes").insert(episodeData as never);

    if (insertError) {
      setError(insertError.message ?? "Failed to create episode.");
    } else {
      setSuccessMessage("Episode created successfully.");
      setEpisodeForm(emptyEpisodeForm);
      await loadContent();
    }
    setSavingEpisode(false);
  };

  const handleEpisodeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEpisodeId) return;
    
    setSavingEpisode(true);
    setError(null);
    setSuccessMessage(null);

    const episodeUpdateData = {
      title: episodeForm.title.trim(),
      description: episodeForm.description.trim() || null,
      author_name: episodeForm.author_name.trim() || "Pastor",
      category: episodeForm.category.trim() || "Sermon",
      duration_minutes: episodeForm.duration_minutes ? Number(episodeForm.duration_minutes) : null,
      audio_url: episodeForm.audio_url.trim() || null,
      video_url: episodeForm.video_url.trim() || null,
      thumbnail_url: episodeForm.thumbnail_url.trim() || null,
      is_premium: episodeForm.is_premium,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("episodes")
      .update(episodeUpdateData as never)
      .eq("id", editingEpisodeId);

    if (updateError) {
      setError(updateError.message ?? "Failed to update episode.");
    } else {
      setSuccessMessage("Episode updated successfully.");
      setEpisodeForm(emptyEpisodeForm);
      setEditingEpisodeId(null);
      await loadContent();
    }
    setSavingEpisode(false);
  };

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingArticle(true);
    setError(null);
    setSuccessMessage(null);

    const articleData = {
      title: articleForm.title.trim(),
      body: articleForm.body.trim() || null,
      excerpt: articleForm.excerpt.trim() || null,
      author_name: articleForm.author_name.trim() || "Pastor",
      category: articleForm.category.trim() || "Article",
      image_url: articleForm.image_url.trim() || null,
      read_minutes: articleForm.read_minutes ? Number(articleForm.read_minutes) : null,
      is_premium: articleForm.is_premium,
    };

    const { error: insertError } = await supabase.from("articles").insert(articleData as never);

    if (insertError) {
      setError(insertError.message ?? "Failed to create article.");
    } else {
      setSuccessMessage("Article created successfully.");
      setArticleForm(emptyArticleForm);
      await loadContent();
    }
    setSavingArticle(false);
  };

  const handleArticleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticleId) return;
    
    setSavingArticle(true);
    setError(null);
    setSuccessMessage(null);

    const articleUpdateData = {
      title: articleForm.title.trim(),
      body: articleForm.body.trim() || null,
      excerpt: articleForm.excerpt.trim() || null,
      author_name: articleForm.author_name.trim() || "Pastor",
      category: articleForm.category.trim() || "Article",
      image_url: articleForm.image_url.trim() || null,
      read_minutes: articleForm.read_minutes ? Number(articleForm.read_minutes) : null,
      is_premium: articleForm.is_premium,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("articles")
      .update(articleUpdateData as never)
      .eq("id", editingArticleId);

    if (updateError) {
      setError(updateError.message ?? "Failed to update article.");
    } else {
      setSuccessMessage("Article updated successfully.");
      setArticleForm(emptyArticleForm);
      setEditingArticleId(null);
      await loadContent();
    }
    setSavingArticle(false);
  };

  const handleDeleteEpisode = async (id: string) => {
    if (!confirm("Are you sure you want to delete this episode?")) return;
    
    const { error: deleteError } = await supabase.from("episodes").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message ?? "Failed to delete episode.");
    } else {
      setSuccessMessage("Episode deleted successfully.");
      await loadContent();
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    
    const { error: deleteError } = await supabase.from("articles").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message ?? "Failed to delete article.");
    } else {
      setSuccessMessage("Article deleted successfully.");
      await loadContent();
    }
  };

  const handleEditEpisode = (ep: Episode) => {
    setEditingEpisodeId(ep.id);
    setEpisodeForm({
      title: ep.title ?? "",
      description: ep.description ?? "",
      author_name: ep.author_name ?? "",
      category: ep.category ?? "",
      duration_minutes: ep.duration_minutes?.toString() ?? "",
      audio_url: ep.audio_url ?? "",
      video_url: ep.video_url ?? "",
      thumbnail_url: ep.thumbnail_url ?? "",
      is_premium: ep.is_premium ?? false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditArticle = (art: Article) => {
    setEditingArticleId(art.id);
    setArticleForm({
      title: art.title ?? "",
      body: art.body ?? "",
      excerpt: art.excerpt ?? "",
      author_name: art.author_name ?? "",
      category: art.category ?? "",
      image_url: art.image_url ?? "",
      read_minutes: art.read_minutes?.toString() ?? "",
      is_premium: art.is_premium ?? false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingEpisodeId(null);
    setEditingArticleId(null);
    setEpisodeForm(emptyEpisodeForm);
    setArticleForm(emptyArticleForm);
  };

  if (authLoading) {
    return (
      <div className={`py-10 text-center ${isDark ? "text-gray-400" : "text-navy/70"}`}>
        Checking permissions…
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className={`space-y-4 rounded-xl border p-6 ${
        isDark 
          ? "border-red-900 bg-red-950 text-red-200" 
          : "border-red-100 bg-red-50 text-red-800"
      }`}>
        <h1 className="text-lg font-semibold">Admin access required</h1>
        <p className="text-sm">
          You must be signed in as an <span className="font-semibold">admin</span> to access the
          dashboard.
        </p>
      </div>
    );
  }

  // Dark mode input styles
  const inputClass = `mt-1 w-full rounded-md border px-2 py-1.5 text-sm ${
    isDark 
      ? "border-gray-600 bg-gray-700 text-gray-100" 
      : "border-navy/20"
  }`;
  
  const labelClass = `block text-xs font-medium ${
    isDark ? "text-gray-300" : "text-navy/80"
  }`;
  
  const cardClass = `rounded-xl border p-4 shadow-sm ${
    isDark 
      ? "border-gray-700 bg-gray-800" 
      : "border-navy/10 bg-white"
  }`;
  
  const headingClass = `text-lg font-semibold ${
    isDark ? "text-gray-100" : "text-navy-dark"
  }`;
  
  const subtextClass = `mb-3 text-xs ${
    isDark ? "text-gray-400" : "text-navy/60"
  }`;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className={`text-2xl font-bold ${isDark ? "text-gray-100" : "text-navy-dark"}`}>
          Admin Dashboard
        </h1>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-navy/70"}`}>
          Create and manage sermons (episodes) and articles. The latest episode automatically appears
          as the featured sermon on the home page.
        </p>
      </header>

      {error && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${
          isDark 
            ? "border-red-800 bg-red-900/30 text-red-300" 
            : "border-red-200 bg-red-50 text-red-800"
        }`}>
          {error}
        </div>
      )}

      {successMessage && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${
          isDark 
            ? "border-emerald-800 bg-emerald-900/30 text-emerald-300" 
            : "border-emerald-200 bg-emerald-50 text-emerald-800"
        }`}>
          {successMessage}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <h2 className={headingClass}>
            {editingEpisodeId ? "Edit Sermon / Episode" : "New Sermon / Episode"}
          </h2>
          <p className={subtextClass}>
            Fill in the basic details and paste media URLs (audio, video, thumbnail). Upload files
            to Supabase Storage or your preferred host first, then paste the public URLs here.
          </p>
          <form className="space-y-3" onSubmit={editingEpisodeId ? handleEpisodeUpdate : handleEpisodeSubmit}>
            <div>
              <label className={labelClass}>Title</label>
              <input
                required
                className={inputClass}
                value={episodeForm.title}
                onChange={(e) => setEpisodeForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                className={inputClass}
                rows={3}
                value={episodeForm.description}
                onChange={(e) => setEpisodeForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Speaker / Author</label>
                <input
                  className={inputClass}
                  value={episodeForm.author_name}
                  onChange={(e) => setEpisodeForm((f) => ({ ...f, author_name: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <input
                  className={inputClass}
                  value={episodeForm.category}
                  onChange={(e) => setEpisodeForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Duration (minutes)</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={episodeForm.duration_minutes}
                  onChange={(e) => setEpisodeForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  id="episode-is-premium"
                  type="checkbox"
                  className="h-4 w-4 rounded"
                  checked={episodeForm.is_premium}
                  onChange={(e) => setEpisodeForm((f) => ({ ...f, is_premium: e.target.checked }))}
                />
                <label htmlFor="episode-is-premium" className={labelClass}>
                  Premium content
                </label>
              </div>
            </div>
            <div>
              <label className={labelClass}>Audio URL (.mp3)</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  className={inputClass}
                  placeholder="https://..."
                  value={episodeForm.audio_url}
                  onChange={(e) => setEpisodeForm((f) => ({ ...f, audio_url: e.target.value }))}
                />
                <label className={`inline-flex cursor-pointer items-center rounded-md border px-2 py-1 text-xs font-medium ${
                  isDark 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                    : "border-navy/20 text-navy hover:bg-navy/5"
                }`}>
                  {uploadingField === "episode_audio_url" ? "Uploading…" : "Upload"}
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleMediaUpload(file, "episode_audio_url");
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div>
              <label className={labelClass}>Video URL (optional)</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  className={inputClass}
                  placeholder="https://..."
                  value={episodeForm.video_url}
                  onChange={(e) => setEpisodeForm((f) => ({ ...f, video_url: e.target.value }))}
                />
                <label className={`inline-flex cursor-pointer items-center rounded-md border px-2 py-1 text-xs font-medium ${
                  isDark 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                    : "border-navy/20 text-navy hover:bg-navy/5"
                }`}>
                  {uploadingField === "episode_video_url" ? "Uploading…" : "Upload"}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleMediaUpload(file, "episode_video_url");
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div>
              <label className={labelClass}>Thumbnail URL</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  className={inputClass}
                  placeholder="https://..."
                  value={episodeForm.thumbnail_url}
                  onChange={(e) => setEpisodeForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
                />
                <label className={`inline-flex cursor-pointer items-center rounded-md border px-2 py-1 text-xs font-medium ${
                  isDark 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                    : "border-navy/20 text-navy hover:bg-navy/5"
                }`}>
                  {uploadingField === "episode_thumbnail_url" ? "Uploading…" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleMediaUpload(file, "episode_thumbnail_url");
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingEpisode}
                className={`mt-1 inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70 ${
                  isDark ? "bg-navy hover:bg-navy-light" : "bg-navy hover:bg-navy-dark"
                }`}
              >
                {savingEpisode ? "Saving…" : editingEpisodeId ? "Update Episode" : "Publish Episode"}
              </button>
              {editingEpisodeId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={`mt-1 inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70 ${
                    isDark 
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                      : "border-navy/20 text-navy hover:bg-navy/5"
                  }`}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className={cardClass}>
          <h2 className={headingClass}>
            {editingArticleId ? "Edit Article" : "New Article"}
          </h2>
          <p className={subtextClass}>
            Post written content such as devotionals, study notes, and announcements.
          </p>
          <form className="space-y-3" onSubmit={editingArticleId ? handleArticleUpdate : handleArticleSubmit}>
            <div>
              <label className={labelClass}>Title</label>
              <input
                required
                className={inputClass}
                value={articleForm.title}
                onChange={(e) => setArticleForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Body</label>
              <textarea
                className={inputClass}
                rows={4}
                value={articleForm.body}
                onChange={(e) => setArticleForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Excerpt (short summary)</label>
              <textarea
                className={inputClass}
                rows={2}
                value={articleForm.excerpt}
                onChange={(e) => setArticleForm((f) => ({ ...f, excerpt: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Author</label>
                <input
                  className={inputClass}
                  value={articleForm.author_name}
                  onChange={(e) => setArticleForm((f) => ({ ...f, author_name: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <input
                  className={inputClass}
                  value={articleForm.category}
                  onChange={(e) => setArticleForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Estimated read time (minutes)</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={articleForm.read_minutes}
                  onChange={(e) => setArticleForm((f) => ({ ...f, read_minutes: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  id="article-is-premium"
                  type="checkbox"
                  className="h-4 w-4 rounded"
                  checked={articleForm.is_premium}
                  onChange={(e) => setArticleForm((f) => ({ ...f, is_premium: e.target.checked }))}
                />
                <label htmlFor="article-is-premium" className={labelClass}>
                  Premium content
                </label>
              </div>
            </div>
            <div>
              <label className={labelClass}>Image URL</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  className={inputClass}
                  placeholder="https://..."
                  value={articleForm.image_url}
                  onChange={(e) => setArticleForm((f) => ({ ...f, image_url: e.target.value }))}
                />
                <label className={`inline-flex cursor-pointer items-center rounded-md border px-2 py-1 text-xs font-medium ${
                  isDark 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                    : "border-navy/20 text-navy hover:bg-navy/5"
                }`}>
                  {uploadingField === "article_image_url" ? "Uploading…" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleMediaUpload(file, "article_image_url");
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingArticle}
                className={`mt-1 inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70 ${
                  isDark ? "bg-navy hover:bg-navy-light" : "bg-navy hover:bg-navy-dark"
                }`}
              >
                {savingArticle ? "Saving…" : editingArticleId ? "Update Article" : "Publish Article"}
              </button>
              {editingArticleId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={`mt-1 inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70 ${
                    isDark 
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                      : "border-navy/20 text-navy hover:bg-navy/5"
                  }`}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-navy-dark"}`}>
            Recent Content
          </h2>
          {loadingContent && (
            <span className={`text-xs ${isDark ? "text-gray-500" : "text-navy/60"}`}>
              Refreshing…
            </span>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className={`rounded-lg border p-3 text-sm ${
            isDark 
              ? "border-gray-700 bg-gray-800" 
              : "border-navy/10 bg-white"
          }`}>
            <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
              isDark ? "text-gray-400" : "text-navy/70"
            }`}>
              Latest Episodes
            </h3>
            {episodes.length === 0 ? (
              <p className={`text-xs ${isDark ? "text-gray-500" : "text-navy/60"}`}>
                No episodes yet. Create one above.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {episodes.map((ep) => (
                  <li key={ep.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-medium ${isDark ? "text-gray-100" : "text-navy-dark"}`}>
                        {ep.title}
                      </p>
                      <p className={`truncate text-[11px] ${isDark ? "text-gray-500" : "text-navy/60"}`}>
                        {ep.author_name} · {ep.category} ·{" "}
                        {new Date(ep.created_at).toLocaleDateString()}
                        {ep.is_premium ? " · Premium" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditEpisode(ep)}
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          isDark 
                            ? "text-gray-300 hover:bg-gray-700" 
                            : "text-navy hover:bg-navy/10"
                        }`}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEpisode(ep.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={`rounded-lg border p-3 text-sm ${
            isDark 
              ? "border-gray-700 bg-gray-800" 
              : "border-navy/10 bg-white"
          }`}>
            <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
              isDark ? "text-gray-400" : "text-navy/70"
            }`}>
              Latest Articles
            </h3>
            {articles.length === 0 ? (
              <p className={`text-xs ${isDark ? "text-gray-500" : "text-navy/60"}`}>
                No articles yet. Create one above.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {articles.map((art) => (
                  <li key={art.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-medium ${isDark ? "text-gray-100" : "text-navy-dark"}`}>
                        {art.title}
                      </p>
                      <p className={`truncate text-[11px] ${isDark ? "text-gray-500" : "text-navy/60"}`}>
                        {art.author_name} · {art.category} ·{" "}
                        {new Date(art.created_at).toLocaleDateString()}
                        {art.is_premium ? " · Premium" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditArticle(art)}
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          isDark 
                            ? "text-gray-300 hover:bg-gray-700" 
                            : "text-navy hover:bg-navy/10"
                        }`}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(art.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
