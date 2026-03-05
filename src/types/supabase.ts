/** Supabase generated types - extend to match your DB. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          sermons_listened: number | null;
          hours_this_month: number | null;
          favorites_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      episodes: {
        Row: {
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
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["episodes"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["episodes"]["Insert"]>;
      };
      comments: {
        Row: {
          id: string;
          content: string;
          episode_id: string | null;
          article_id: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["comments"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          episode_id: string | null;
          article_id: string | null;
          comment_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["likes"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["likes"]["Insert"]>;
      };
      articles: {
        Row: {
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
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["articles"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
