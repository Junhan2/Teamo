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
      invitations: {
        Row: {
          id: string
          space_id: string
          inviter_id: string
          email: string
          token: string
          role: 'admin' | 'member'
          status: 'pending' | 'accepted' | 'expired' | 'cancelled'
          expires_at: string
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          space_id: string
          inviter_id: string
          email: string
          token: string
          role?: 'admin' | 'member'
          status?: 'pending' | 'accepted' | 'expired' | 'cancelled'
          expires_at: string
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          inviter_id?: string
          email?: string
          token?: string
          role?: 'admin' | 'member'
          status?: 'pending' | 'accepted' | 'expired' | 'cancelled'
          expires_at?: string
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      spaces: {
        Row: {
          id: string
          name: string
          description: string | null
          type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          type?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_spaces: {
        Row: {
          id: string
          user_id: string
          space_id: string
          role: 'owner' | 'admin' | 'member'
          is_default: boolean | null
          joined_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          space_id: string
          role?: 'owner' | 'admin' | 'member'
          is_default?: boolean | null
          joined_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          space_id?: string
          role?: 'owner' | 'admin' | 'member'
          is_default?: boolean | null
          joined_at?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      todos: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'completed'
          user_id: string
          space_id: string | null
          is_shared: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed'
          user_id: string
          space_id?: string | null
          is_shared?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed'
          user_id?: string
          space_id?: string | null
          is_shared?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: {
          invitation_token: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
