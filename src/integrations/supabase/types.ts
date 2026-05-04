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
      automation_settings: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          key: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          key: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          key?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_assets: {
        Row: {
          category: string
          content: Json
          created_at: string
          id: string
          kind: string | null
          metadata: Json
          organization_id: string
          storage_path: string | null
          title: string
          tool_run_id: string | null
          user_id: string
        }
        Insert: {
          category: string
          content?: Json
          created_at?: string
          id?: string
          kind?: string | null
          metadata?: Json
          organization_id: string
          storage_path?: string | null
          title: string
          tool_run_id?: string | null
          user_id: string
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string
          id?: string
          kind?: string | null
          metadata?: Json
          organization_id?: string
          storage_path?: string | null
          title?: string
          tool_run_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_assets_tool_run_id_fkey"
            columns: ["tool_run_id"]
            isOneToOne: false
            referencedRelation: "tool_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_responses: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          question_key: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          question_key: string
          user_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          question_key?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          business_type: string | null
          created_at: string
          created_by: string
          goal: string | null
          id: string
          location: string | null
          name: string
          niche: string | null
          offer: string | null
          stage: Database["public"]["Enums"]["app_stage"]
          target_customer: string | null
          updated_at: string
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          created_by: string
          goal?: string | null
          id?: string
          location?: string | null
          name: string
          niche?: string | null
          offer?: string | null
          stage?: Database["public"]["Enums"]["app_stage"]
          target_customer?: string | null
          updated_at?: string
        }
        Update: {
          business_type?: string | null
          created_at?: string
          created_by?: string
          goal?: string | null
          id?: string
          location?: string | null
          name?: string
          niche?: string | null
          offer?: string | null
          stage?: Database["public"]["Enums"]["app_stage"]
          target_customer?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      plan_entitlements: {
        Row: {
          allowed_tools: string[]
          created_at: string
          features: Json
          monthly_generation_limit: number | null
          plan: Database["public"]["Enums"]["plan_tier"]
          price_usd: number
        }
        Insert: {
          allowed_tools?: string[]
          created_at?: string
          features?: Json
          monthly_generation_limit?: number | null
          plan: Database["public"]["Enums"]["plan_tier"]
          price_usd: number
        }
        Update: {
          allowed_tools?: string[]
          created_at?: string
          features?: Json
          monthly_generation_limit?: number | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          price_usd?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_complete: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_complete?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_complete?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          organization_id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          organization_id: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          organization_id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_runs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          input: Json
          metadata: Json
          organization_id: string
          output: Json | null
          status: Database["public"]["Enums"]["tool_run_status"]
          tool_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          metadata?: Json
          organization_id: string
          output?: Json | null
          status?: Database["public"]["Enums"]["tool_run_status"]
          tool_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          metadata?: Json
          organization_id?: string
          output?: Json | null
          status?: Database["public"]["Enums"]["tool_run_status"]
          tool_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          count: number
          id: string
          last_used_at: string
          organization_id: string
          period: string
          tool_key: string
        }
        Insert: {
          count?: number
          id?: string
          last_used_at?: string
          organization_id: string
          period: string
          tool_key: string
        }
        Update: {
          count?: number
          id?: string
          last_used_at?: string
          organization_id?: string
          period?: string
          tool_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          created_at: string
          id: string
          integration_key: string
          status: string
          updated_at: string
          user_id: string
          value_encrypted: string | null
          value_last4: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          integration_key: string
          status?: string
          updated_at?: string
          user_id: string
          value_encrypted?: string | null
          value_last4?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          integration_key?: string
          status?: string
          updated_at?: string
          user_id?: string
          value_encrypted?: string | null
          value_last4?: string | null
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
      website_analyses: {
        Row: {
          created_at: string
          id: string
          issues: Json
          opportunities: Json
          organization_id: string
          seo_notes: string | null
          snapshot_path: string | null
          suggested_changes: Json
          url: string
          user_id: string
          ux_notes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          issues?: Json
          opportunities?: Json
          organization_id: string
          seo_notes?: string | null
          snapshot_path?: string | null
          suggested_changes?: Json
          url: string
          user_id: string
          ux_notes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          issues?: Json
          opportunities?: Json
          organization_id?: string
          seo_notes?: string | null
          snapshot_path?: string | null
          suggested_changes?: Json
          url?: string
          user_id?: string
          ux_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_integrations_masked: {
        Row: {
          created_at: string | null
          id: string | null
          integration_key: string | null
          is_connected: boolean | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          value_last4: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          integration_key?: string | null
          is_connected?: never
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          value_last4?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          integration_key?: string | null
          is_connected?: never
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          value_last4?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_integration_secret: {
        Args: {
          _encryption_key: string
          _integration_key: string
          _user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_owner: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      set_user_integration: {
        Args: {
          _encryption_key: string
          _integration_key: string
          _user_id: string
          _value: string
        }
        Returns: {
          integration_key: string
          is_connected: boolean
          status: string
          value_last4: string
        }[]
      }
    }
    Enums: {
      app_role: "user" | "admin"
      app_stage: "Idea" | "Validate" | "Launch" | "Operate" | "Scale"
      business_stage: "Idea" | "Validate" | "Launch" | "Operate" | "Scale"
      lead_stage:
        | "New"
        | "Contacted"
        | "Qualified"
        | "Proposal"
        | "Won"
        | "Lost"
      org_role: "owner" | "admin" | "member"
      plan_tier: "starter" | "launch" | "operate" | "scale"
      tool_run_status: "running" | "succeeded" | "failed"
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
      app_role: ["user", "admin"],
      business_stage: ["Idea", "Validate", "Launch", "Operate", "Scale"],
      lead_stage: ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"],
      org_role: ["owner", "admin", "member"],
      plan_tier: ["starter", "launch", "operate", "scale"],
      tool_run_status: ["running", "succeeded", "failed"],
    },
  },
} as const
