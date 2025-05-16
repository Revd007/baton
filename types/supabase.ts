export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          content_type: 'video' | 'comic'
          content_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_type: 'video' | 'comic'
          content_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_type?: 'video' | 'comic'
          content_id?: string
          created_at?: string
        }
      }
      history: {
        Row: {
          id: string
          user_id: string
          content_type: 'video' | 'comic'
          content_id: string
          progress: number | null
          chapter_id: string | null
          last_accessed: string
        }
        Insert: {
          id?: string
          user_id: string
          content_type: 'video' | 'comic'
          content_id: string
          progress?: number | null
          chapter_id?: string | null
          last_accessed?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_type?: 'video' | 'comic'
          content_id?: string
          progress?: number | null
          chapter_id?: string | null
          last_accessed?: string
        }
      }
    }
  }
}