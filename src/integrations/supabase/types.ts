export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string | null
          admin_user_id: string | null
          created_at: string
          details: Json | null
          id: string
          target: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target?: string | null
        }
        Relationships: []
      }
      admin_nicknames: {
        Row: {
          admin_user_id: string
          assigned_by: string | null
          created_at: string
          nickname: string
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          assigned_by?: string | null
          created_at?: string
          nickname: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          assigned_by?: string | null
          created_at?: string
          nickname?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_whitelist: {
        Row: {
          added_by: string | null
          created_at: string
          email: string
          id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          college_id: string
          college_name: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          college_id: string
          college_name?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          college_id?: string
          college_name?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          classification: string | null
          id: string
          location: string | null
          meeting_day: string | null
          name: string
          purpose: string | null
          raw: Json | null
          schedule: string | null
          sponsor: string | null
          sponsor_email: string | null
          updated_at: string
        }
        Insert: {
          classification?: string | null
          id?: string
          location?: string | null
          meeting_day?: string | null
          name: string
          purpose?: string | null
          raw?: Json | null
          schedule?: string | null
          sponsor?: string | null
          sponsor_email?: string | null
          updated_at?: string
        }
        Update: {
          classification?: string | null
          id?: string
          location?: string | null
          meeting_day?: string | null
          name?: string
          purpose?: string | null
          raw?: Json | null
          schedule?: string | null
          sponsor?: string | null
          sponsor_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      college_overrides: {
        Row: {
          cds_url: string | null
          college_id: string
          created_at: string
          known_programs: string[]
          notes: string | null
          official_url: string | null
          rankings: Json
          tier: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cds_url?: string | null
          college_id: string
          created_at?: string
          known_programs?: string[]
          notes?: string | null
          official_url?: string | null
          rankings?: Json
          tier?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cds_url?: string | null
          college_id?: string
          created_at?: string
          known_programs?: string[]
          notes?: string | null
          official_url?: string | null
          rankings?: Json
          tier?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      contributors: {
        Row: {
          contribution: string | null
          created_at: string
          id: string
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          contribution?: string | null
          created_at?: string
          id?: string
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          contribution?: string | null
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      custom_tabs: {
        Row: {
          content: Json
          created_at: string
          icon: string | null
          id: string
          order_index: number
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          icon?: string | null
          id?: string
          order_index?: number
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          icon?: string | null
          id?: string
          order_index?: number
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_blacklist: {
        Row: {
          added_by: string | null
          created_at: string
          email: string
          id: string
          reason: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          email: string
          id?: string
          reason?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      faculty: {
        Row: {
          bio_full: string | null
          bio_short: string | null
          contact_link: string | null
          contributions: string | null
          created_at: string
          id: string
          name: string
          order_index: number
          projects: string | null
          role: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          bio_full?: string | null
          bio_short?: string | null
          contact_link?: string | null
          contributions?: string | null
          created_at?: string
          id?: string
          name: string
          order_index?: number
          projects?: string | null
          role?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          bio_full?: string | null
          bio_short?: string | null
          contact_link?: string | null
          contributions?: string | null
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          projects?: string | null
          role?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      international_colleges: {
        Row: {
          admit_rate: number | null
          athletic_division: string | null
          avg_cost_usd: number | null
          city: string | null
          country: string
          created_at: string
          enrollment: number | null
          id: string
          name: string
          notes: string | null
          order_index: number
          programs: string[]
          setting: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          admit_rate?: number | null
          athletic_division?: string | null
          avg_cost_usd?: number | null
          city?: string | null
          country: string
          created_at?: string
          enrollment?: number | null
          id?: string
          name: string
          notes?: string | null
          order_index?: number
          programs?: string[]
          setting?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          admit_rate?: number | null
          athletic_division?: string | null
          avg_cost_usd?: number | null
          city?: string | null
          country?: string
          created_at?: string
          enrollment?: number | null
          id?: string
          name?: string
          notes?: string | null
          order_index?: number
          programs?: string[]
          setting?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_nickname: string | null
          created_at: string
          display_name: string | null
          email: string
          flagged: boolean
          grad_year: number | null
          id: string
          profile_data: Json
          setup_complete: boolean
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          admin_nickname?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          flagged?: boolean
          grad_year?: number | null
          id?: string
          profile_data?: Json
          setup_complete?: boolean
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          admin_nickname?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          flagged?: boolean
          grad_year?: number | null
          id?: string
          profile_data?: Json
          setup_complete?: boolean
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      security_code_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip: string | null
          succeeded: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip?: string | null
          succeeded?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip?: string | null
          succeeded?: boolean
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          dropdown_links: Json
          homepage_hero: Json
          id: string
          logo_url: string | null
          mobile_spacing: Json
          updated_at: string
        }
        Insert: {
          dropdown_links?: Json
          homepage_hero?: Json
          id: string
          logo_url?: string | null
          mobile_spacing?: Json
          updated_at?: string
        }
        Update: {
          dropdown_links?: Json
          homepage_hero?: Json
          id?: string
          logo_url?: string | null
          mobile_spacing?: Json
          updated_at?: string
        }
        Relationships: []
      }
      system_state: {
        Row: {
          id: string
          last_refresh_at: string | null
          last_refresh_summary: Json | null
          next_refresh_at: string | null
          updated_at: string
        }
        Insert: {
          id: string
          last_refresh_at?: string | null
          last_refresh_summary?: Json | null
          next_refresh_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          last_refresh_at?: string | null
          last_refresh_summary?: Json | null
          next_refresh_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_security_codes: {
        Row: {
          code_hash: string
          code_salt: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code_hash: string
          code_salt: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          code_hash?: string
          code_salt?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blacklisted: { Args: { _email: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
