export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      boosted_tasks: {
        Row: {
          id: string
          code: string
          title: string
          description: string | null
          reward_nop: number
          order_index: number
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          code: string
          title: string
          description?: string | null
          reward_nop?: number
          order_index?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          title?: string
          description?: string | null
          reward_nop?: number
          order_index?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      burn_stats: {
        Row: {
          id: number
          total: number
          last24h: number
          series_data: Json | null
          updated_at: string | null
          total_burned: number | null
          last_24h: number | null
          series: Json | null
          history: Json | null
        }
        Insert: {
          id: number
          total?: number
          last24h?: number
          series_data?: Json | null
          updated_at?: string | null
          total_burned?: number | null
          last_24h?: number | null
          series?: Json | null
          history?: Json | null
        }
        Update: {
          id?: number
          total?: number
          last24h?: number
          series_data?: Json | null
          updated_at?: string | null
          total_burned?: number | null
          last_24h?: number | null
          series?: Json | null
          history?: Json | null
        }
      }
      burn_widget: {
        Row: {
          id: number
          total_burn: number
          last_update: string | null
        }
        Insert: {
          id?: number
          total_burn?: number
          last_update?: string | null
        }
        Update: {
          id?: number
          total_burn?: number
          last_update?: string | null
        }
      }
      comments: {
        Row: {
          id: number
          post_id: number
          author_id: string
          text: string
          created_at: string | null
        }
        Insert: {
          id?: number
          post_id: number
          author_id: string
          text: string
          created_at?: string | null
        }
        Update: {
          id?: number
          post_id?: number
          author_id?: string
          text?: string
          created_at?: string | null
        }
      }
      contact_messages: {
        Row: {
          id: number
          name: string | null
          email: string | null
          subject: string | null
          message: string
          created_at: string | null
          reporter_id: string | null
        }
        Insert: {
          id?: number
          name?: string | null
          email?: string | null
          subject?: string | null
          message: string
          created_at?: string | null
          reporter_id?: string | null
        }
        Update: {
          id?: number
          name?: string | null
          email?: string | null
          subject?: string | null
          message?: string
          created_at?: string | null
          reporter_id?: string | null
        }
      }
      game_sessions: {
        Row: {
          id: string
          user_id: string | null
          game: string
          score: number
          duration_ms: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          game: string
          score?: number
          duration_ms?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          game?: string
          score?: number
          duration_ms?: number | null
          created_at?: string | null
        }
      }
      gaming_scores: {
        Row: {
          id: number
          user_id: string
          total_score: number
          daily_score: number
          weekly_score: number
          best_flappy: number
          best_runner: number
          best_memory: number
          best_reaction: number
          updated_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          total_score?: number
          daily_score?: number
          weekly_score?: number
          best_flappy?: number
          best_runner?: number
          best_memory?: number
          best_reaction?: number
          updated_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          total_score?: number
          daily_score?: number
          weekly_score?: number
          best_flappy?: number
          best_runner?: number
          best_memory?: number
          best_reaction?: number
          updated_at?: string | null
        }
      }
      investment_items: {
        Row: {
          id: number
          post_id: number
          title: string | null
          min_buy: number
          created_at: string | null
        }
        Insert: {
          id?: number
          post_id: number
          title?: string | null
          min_buy?: number
          created_at?: string | null
        }
        Update: {
          id?: number
          post_id?: number
          title?: string | null
          min_buy?: number
          created_at?: string | null
        }
      }
      investment_orders: {
        Row: {
          id: number
          user_id: string
          post_id: number
          type: string | null
          amount_nop: number
          tx_hash: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          post_id: number
          type?: string | null
          amount_nop: number
          tx_hash?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          post_id?: number
          type?: string | null
          amount_nop?: number
          tx_hash?: string | null
          created_at?: string | null
        }
      }
      news_cache: {
        Row: {
          id: string
          provider: string
          title: string
          url: string
          image_url: string | null
          published_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          provider?: string
          title: string
          url: string
          image_url?: string | null
          published_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          provider?: string
          title?: string
          url?: string
          image_url?: string | null
          published_at?: string | null
          created_at?: string | null
        }
      }
        posts: {
          Row: {
            id: number
            author_id: string
            text: string
            media_url: string | null
            tags: string[] | null
            is_investable: boolean
            invest_open: boolean
            created_at: string | null
            ai_signal: string | null
            ai_volatility: string | null
            ai_mm_activity: string | null
            ai_score: number | null
            ai_last_updated_at: string | null
          }
          Insert: {
            id?: number
            author_id: string
            text: string
            media_url?: string | null
            tags?: string[] | null
            is_investable?: boolean
            invest_open?: boolean
            created_at?: string | null
            ai_signal?: string | null
            ai_volatility?: string | null
            ai_mm_activity?: string | null
            ai_score?: number | null
            ai_last_updated_at?: string | null
          }
          Update: {
            id?: number
            author_id?: string
            text?: string
            media_url?: string | null
            tags?: string[] | null
            is_investable?: boolean
            invest_open?: boolean
            created_at?: string | null
            ai_signal?: string | null
            ai_volatility?: string | null
            ai_mm_activity?: string | null
            ai_score?: number | null
            ai_last_updated_at?: string | null
          }
        }
        post_likes: {
          Row: {
            id: number
            post_id: number
            user_id: string
            created_at: string | null
          }
          Insert: {
            id?: number
            post_id: number
            user_id: string
            created_at?: string | null
          }
          Update: {
            id?: number
            post_id?: number
            user_id?: string
            created_at?: string | null
          }
        }
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          bio: string | null
          wallet_address: string | null
          nop_points: number
          is_admin: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          wallet_address?: string | null
          nop_points?: number
          is_admin?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          wallet_address?: string | null
          nop_points?: number
          is_admin?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      ratings: {
        Row: {
          id: number
          post_id: number
          rater_id: string
          score: number
          created_at: string | null
        }
        Insert: {
          id?: number
          post_id: number
          rater_id: string
          score: number
          created_at?: string | null
        }
        Update: {
          id?: number
          post_id?: number
          rater_id?: string
          score?: number
          created_at?: string | null
        }
      }
      user_task_rewards: {
        Row: {
          id: string
          user_id: string
          task_key: string
          reward_nop: number
          completed_at: string | null
          claimed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          task_key: string
          reward_nop?: number
          completed_at?: string | null
          claimed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          task_key?: string
          reward_nop?: number
          completed_at?: string | null
          claimed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_tasks: {
        Row: {
          id: string
          user_id: string
          task_id: string
          status: "pending" | "completed" | "claimed"
          completed_at: string | null
          claimed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          status?: "pending" | "completed" | "claimed"
          completed_at?: string | null
          claimed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          status?: "pending" | "completed" | "claimed"
          completed_at?: string | null
          claimed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reset_daily_scores: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      reset_weekly_scores: {
        Args: Record<PropertyKey, never>
        Returns: void
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
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
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
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
