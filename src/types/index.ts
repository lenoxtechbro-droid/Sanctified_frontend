/** Shared TypeScript interfaces for Sanctified Church */

export type UserRole = "admin" | "premium" | "listener";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  sermons_listened?: number;
  hours_this_month?: number;
  favorites_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Episode {
  id: string;
  title: string;
  description: string | null;
  author_name: string;
  category: string;
  duration_minutes: number | null;
  audio_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Article {
  id: string;
  title: string;
  body: string | null;
  excerpt: string | null;
  author_name: string;
  category: string;
  image_url: string | null;
  read_minutes: number | null;
  is_premium: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  content: string;
  episode_id: string | null;
  article_id: string | null;
  user_id: string;
  author_name?: string;
  author_avatar?: string | null;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  episode_id: string | null;
  article_id: string | null;
  comment_id: string | null;
  created_at: string;
}

export interface FeedItem {
  type: "episode" | "video" | "article";
  id: string;
  title: string;
  description?: string | null;
  author_name: string;
  category: string;
  created_at: string;
  duration_minutes?: number | null;
  read_minutes?: number | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  is_premium: boolean;
  audio_url?: string | null;
  video_url?: string | null;
}
