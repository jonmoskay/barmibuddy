/**
 * Database row types — keep in sync with the Supabase SQL schema.
 *
 * In future, regenerate via:
 *   npx supabase gen types typescript --project-id <id> > packages/db/src/generated.ts
 * and re-export from here.
 */

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  item_key: string;
  status: "in_progress" | "completed";
  score: number | null;
  data: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  meta: Record<string, unknown>;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      progress: {
        Row: Progress;
        Insert: Omit<Progress, "id" | "started_at" | "updated_at"> &
          Partial<Pick<Progress, "id" | "started_at" | "updated_at">>;
        Update: Partial<Progress>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, "id" | "started_at"> &
          Partial<Pick<Session, "id" | "started_at">>;
        Update: Partial<Session>;
      };
    };
  };
}
