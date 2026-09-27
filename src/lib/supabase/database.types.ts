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
      campaign: {
        Row: {
          ends_at: string | null
          id: boolean
          is_open: boolean
          name: string
          results_published: boolean
          starts_at: string | null
          updated_at: string
          winners_per_restaurant: number
        }
        Insert: {
          ends_at?: string | null
          id?: boolean
          is_open?: boolean
          name?: string
          results_published?: boolean
          starts_at?: string | null
          updated_at?: string
          winners_per_restaurant?: number
        }
        Update: {
          ends_at?: string | null
          id?: boolean
          is_open?: boolean
          name?: string
          results_published?: boolean
          starts_at?: string | null
          updated_at?: string
          winners_per_restaurant?: number
        }
        Relationships: []
      }
      dishes: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: number
          image_path: string | null
          is_active: boolean
          name: string
          restaurant_id: number
          slug: string
          sort_order: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: never
          image_path?: string | null
          is_active?: boolean
          name: string
          restaurant_id: number
          slug: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: never
          image_path?: string | null
          is_active?: boolean
          name?: string
          restaurant_id?: number
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "dishes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "dish_results"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "dishes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          consent_version: string
          consented_at: string
          created_at: string
          full_name: string
          id: number
          phone_e164: string
        }
        Insert: {
          consent_version: string
          consented_at?: string
          created_at?: string
          full_name: string
          id?: never
          phone_e164: string
        }
        Update: {
          consent_version?: string
          consented_at?: string
          created_at?: string
          full_name?: string
          id?: never
          phone_e164?: string
        }
        Relationships: []
      }
      raffle_draws: {
        Row: {
          drawn_at: string
          id: number
          notes: string | null
          participant_id: number
          pool_size: number
          prize_restaurant_id: number
          resolved_at: string | null
          status: string
        }
        Insert: {
          drawn_at?: string
          id?: never
          notes?: string | null
          participant_id: number
          pool_size: number
          prize_restaurant_id: number
          resolved_at?: string | null
          status?: string
        }
        Update: {
          drawn_at?: string
          id?: never
          notes?: string | null
          participant_id?: number
          pool_size?: number
          prize_restaurant_id?: number
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "raffle_draws_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_draws_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "raffle_entries"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "raffle_draws_prize_restaurant_id_fkey"
            columns: ["prize_restaurant_id"]
            isOneToOne: false
            referencedRelation: "dish_results"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "raffle_draws_prize_restaurant_id_fkey"
            columns: ["prize_restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          bucket: string
          hits: number
          window_start: string
        }
        Insert: {
          bucket: string
          hits?: number
          window_start: string
        }
        Update: {
          bucket?: string
          hits?: number
          window_start?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          device_id: string | null
          dish_id: number
          entry_restaurant_id: number | null
          id: number
          ip_hash: string | null
          participant_id: number
          stars: number
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          dish_id: number
          entry_restaurant_id?: number | null
          id?: never
          ip_hash?: string | null
          participant_id: number
          stars: number
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          dish_id?: number
          entry_restaurant_id?: number | null
          id?: never
          ip_hash?: string | null
          participant_id?: number
          stars?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dish_results"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "ratings_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_entry_restaurant_id_fkey"
            columns: ["entry_restaurant_id"]
            isOneToOne: false
            referencedRelation: "dish_results"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "ratings_entry_restaurant_id_fkey"
            columns: ["entry_restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "raffle_entries"
            referencedColumns: ["participant_id"]
          },
        ]
      }
      restaurants: {
        Row: {
          accent_color: string
          created_at: string
          id: number
          logo_path: string | null
          name: string
          slug: string
          sort_order: number
          tagline: string | null
        }
        Insert: {
          accent_color?: string
          created_at?: string
          id?: never
          logo_path?: string | null
          name: string
          slug: string
          sort_order?: number
          tagline?: string | null
        }
        Update: {
          accent_color?: string
          created_at?: string
          id?: never
          logo_path?: string | null
          name?: string
          slug?: string
          sort_order?: number
          tagline?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      dish_results: {
        Row: {
          avg_stars: number | null
          category: string | null
          dish_id: number | null
          dish_name: string | null
          dish_slug: string | null
          restaurant_id: number | null
          restaurant_name: string | null
          restaurant_slug: string | null
          stars_1: number | null
          stars_2: number | null
          stars_3: number | null
          stars_4: number | null
          stars_5: number | null
          votes: number | null
        }
        Relationships: []
      }
      raffle_entries: {
        Row: {
          dishes_rated: number | null
          first_rating_at: string | null
          full_name: string | null
          last_rating_at: string | null
          participant_id: number | null
          phone_e164: string | null
          restaurants_covered: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      draw_raffle_winners: {
        Args: { p_restaurant_slug: string }
        Returns: number
      }
      hit_rate_limit: {
        Args: { p_bucket: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      normalize_name: { Args: { p_name: string }; Returns: string }
      submit_rating: {
        Args: {
          p_consent_version: string
          p_device_id?: string
          p_dish_slug: string
          p_entry_restaurant_slug?: string
          p_full_name: string
          p_ip_hash?: string
          p_phone_e164: string
          p_stars: number
          p_user_agent?: string
        }
        Returns: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
