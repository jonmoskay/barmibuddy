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

export interface TeacherProfile {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentSetup {
  id: string;
  teacher_id: string;
  student_name: string;
  hebrew_name: string | null;
  father_name: string | null;
  mother_name: string | null;
  lineage: "Cohen" | "Levi" | "Yisrael";
  bar_mitzvah_date: string | null;
  service_time: "morning" | "afternoon";
  section_type: "maftir" | "haftarah" | "custom_aliyah";
  custom_aliyah: string | null;
  text_reference: string | null;
  parasha_confirmed: string | null;
  created_at: string;
  updated_at: string;
}

export interface PracticeSection {
  id: string;
  student_setup_id: string;
  teacher_id: string;
  title: string;
  text_reference: string;
  hebrew_text: string | null;
  transliteration: string | null;
  guide_audio_url: string | null;
  timing_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TeacherStudentMessage {
  id: string;
  student_setup_id: string;
  teacher_id: string;
  sender_id: string;
  body: string;
  created_at: string;
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
      teacher_profiles: {
        Row: TeacherProfile;
        Insert: Partial<TeacherProfile> & { id: string };
        Update: Partial<TeacherProfile>;
      };
      student_setups: {
        Row: StudentSetup;
        Insert: Omit<StudentSetup, "id" | "created_at" | "updated_at"> &
          Partial<Pick<StudentSetup, "id" | "created_at" | "updated_at">>;
        Update: Partial<StudentSetup>;
      };
      practice_sections: {
        Row: PracticeSection;
        Insert: Omit<PracticeSection, "id" | "created_at" | "updated_at"> &
          Partial<Pick<PracticeSection, "id" | "created_at" | "updated_at">>;
        Update: Partial<PracticeSection>;
      };
      teacher_student_messages: {
        Row: TeacherStudentMessage;
        Insert: Omit<TeacherStudentMessage, "id" | "created_at"> &
          Partial<Pick<TeacherStudentMessage, "id" | "created_at">>;
        Update: Partial<TeacherStudentMessage>;
      };
    };
  };
}
