// src/types/database.ts

// JSON 型の定義 (Supabaseの複雑な型推論を避けるため手動で定義)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Project SEED v3.1 Dual-Core DB の型定義
 * Supabase クライアントに適用するメインの型
 */
export type Database = {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string; // UUID
          display_name: string;
          employment_type: string | null;
          attributes: Json | null; // JSONB
          engagement_score: number | null;
          is_active: boolean | null;
          created_at: string;
          line_id: string | null; // Golden Schemaで追加
        };
        Insert: {
          id?: string;
          display_name: string;
          employment_type?: string | null;
          attributes?: Json | null;
          engagement_score?: number | null;
          is_active?: boolean | null;
          created_at?: string;
          line_id?: string | null;
        };
        Update: {
          id?: string;
          display_name?: string;
          employment_type?: string | null;
          attributes?: Json | null;
          engagement_score?: number | null;
          is_active?: boolean | null;
          created_at?: string;
          line_id?: string | null;
        };
      };
      shift_requests: {
        Row: {
          id: string; // UUID
          staff_id: string; // staff.id への外部キー
          shift_date: string; // Date (e.g., '2024-12-01')
          start_time: string; // Time (e.g., '09:00:00')
          end_time: string; // Time (e.g., '18:00:00')
          is_approved: boolean;
          created_at: string;
          notes: string | null;
        };
        Insert: {
          staff_id: string;
          shift_date: string;
          start_time: string;
          end_time: string;
          notes?: string | null;
          // id, is_approved, created_at はDBが自動生成
        };
        Update: {
          staff_id?: string;
          shift_date?: string;
          start_time?: string;
          end_time?: string;
          notes?: string | null;
        };
      };
      // knowledge_categories, knowledge_entries, ... などの定義は省略されている前提
    };
    Views: {
      ai_staff_context: {
        Row: {
          id: string | null;
          display_name: string | null;
          employment_type: string | null;
          role: string | null; // attributesから抽出
          skills: string | null; // attributesから抽出
          engagement_score: number | null;
        };
      };
    };
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};


// データベースアクセス用のユーティリティ型

/**
 * データベースのテーブルの Row 型 (Select結果)
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * データベースのテーブルの Insert 型 (Insertデータ)
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/**
 * データベースのテーブルの Update 型 (Updateデータ)
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/**
 * データベースのビューの Row 型
 */
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];