export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      ai_operator_configs: {
        Row: {
          id: string;
          user_id: string;
          operator_name: string | null;
          operator_tone: string | null;
          primary_niche: string | null;
          recommended_tools: Json;
          gtm_strategy_summary: string | null;
          brand_voice_keywords: Json;
          top_3_pain_points: Json;
          source_intake_id: string | null;
          llm_model: string | null;
          llm_prompt_version: string | null;
          raw_llm_response: Json | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          operator_name?: string | null;
          operator_tone?: string | null;
          primary_niche?: string | null;
          recommended_tools?: Json;
          gtm_strategy_summary?: string | null;
          brand_voice_keywords?: Json;
          top_3_pain_points?: Json;
          source_intake_id?: string | null;
          llm_model?: string | null;
          llm_prompt_version?: string | null;
          raw_llm_response?: Json | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          operator_name?: string | null;
          operator_tone?: string | null;
          primary_niche?: string | null;
          recommended_tools?: Json;
          gtm_strategy_summary?: string | null;
          brand_voice_keywords?: Json;
          top_3_pain_points?: Json;
          source_intake_id?: string | null;
          llm_model?: string | null;
          llm_prompt_version?: string | null;
          raw_llm_response?: Json | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      automation_drafts: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          workflow_json: Json;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          workflow_json: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          description?: string;
          workflow_json?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      automation_settings: {
        Row: {
          config: Json;
          created_at: string;
          enabled: boolean;
          id: string;
          key: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          key: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          key?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_settings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      generated_assets: {
        Row: {
          category: string;
          content: Json;
          created_at: string;
          id: string;
          kind: string | null;
          metadata: Json;
          organization_id: string;
          storage_path: string | null;
          title: string;
          tool_run_id: string | null;
          user_id: string;
        };
        Insert: {
          category: string;
          content?: Json;
          created_at?: string;
          id?: string;
          kind?: string | null;
          metadata?: Json;
          organization_id: string;
          storage_path?: string | null;
          title: string;
          tool_run_id?: string | null;
          user_id: string;
        };
        Update: {
          category?: string;
          content?: Json;
          created_at?: string;
          id?: string;
          kind?: string | null;
          metadata?: Json;
          organization_id?: string;
          storage_path?: string | null;
          title?: string;
          tool_run_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generated_assets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_assets_tool_run_id_fkey";
            columns: ["tool_run_id"];
            isOneToOne: false;
            referencedRelation: "tool_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          organization_id: string;
          phone: string | null;
          source: string | null;
          stage: Database["public"]["Enums"]["lead_stage"];
          updated_at: string;
          user_id: string;
          value: number | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          organization_id: string;
          phone?: string | null;
          source?: string | null;
          stage?: Database["public"]["Enums"]["lead_stage"];
          updated_at?: string;
          user_id: string;
          value?: number | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          organization_id?: string;
          phone?: string | null;
          source?: string | null;
          stage?: Database["public"]["Enums"]["lead_stage"];
          updated_at?: string;
          user_id?: string;
          value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      onboarding_responses: {
        Row: {
          answer: string | null;
          created_at: string;
          id: string;
          question_key: string;
          user_id: string;
        };
        Insert: {
          answer?: string | null;
          created_at?: string;
          id?: string;
          question_key: string;
          user_id: string;
        };
        Update: {
          answer?: string | null;
          created_at?: string;
          id?: string;
          question_key?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          role: Database["public"]["Enums"]["org_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          role?: Database["public"]["Enums"]["org_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["org_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          business_type: string | null;
          created_at: string;
          goal: string | null;
          id: string;
          location: string | null;
          name: string;
          niche: string | null;
          offer: string | null;
          owner_id: string;
          stage: Database["public"]["Enums"]["business_stage"];
          target_customer: string | null;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          business_type?: string | null;
          created_at?: string;
          goal?: string | null;
          id?: string;
          location?: string | null;
          name: string;
          niche?: string | null;
          offer?: string | null;
          owner_id: string;
          stage?: Database["public"]["Enums"]["business_stage"];
          target_customer?: string | null;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          business_type?: string | null;
          created_at?: string;
          goal?: string | null;
          id?: string;
          location?: string | null;
          name?: string;
          niche?: string | null;
          offer?: string | null;
          owner_id?: string;
          stage?: Database["public"]["Enums"]["business_stage"];
          target_customer?: string | null;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
      plan_entitlements: {
        Row: {
          allowed_tools: string[];
          created_at: string;
          features: Json;
          monthly_generation_limit: number | null;
          plan: Database["public"]["Enums"]["plan_tier"];
          price_usd: number;
        };
        Insert: {
          allowed_tools?: string[];
          created_at?: string;
          features?: Json;
          monthly_generation_limit?: number | null;
          plan: Database["public"]["Enums"]["plan_tier"];
          price_usd: number;
        };
        Update: {
          allowed_tools?: string[];
          created_at?: string;
          features?: Json;
          monthly_generation_limit?: number | null;
          plan?: Database["public"]["Enums"]["plan_tier"];
          price_usd?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          onboarding_complete: boolean;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          onboarding_complete?: boolean;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          onboarding_complete?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean;
          created_at: string;
          current_period_end: string | null;
          id: string;
          organization_id: string;
          plan: Database["public"]["Enums"]["plan_tier"];
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string;
        };
        Insert: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          organization_id: string;
          plan?: Database["public"]["Enums"]["plan_tier"];
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
        };
        Update: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          organization_id?: string;
          plan?: Database["public"]["Enums"]["plan_tier"];
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      tool_runs: {
        Row: {
          created_at: string;
          error: string | null;
          id: string;
          input: Json;
          metadata: Json;
          organization_id: string;
          output: Json | null;
          status: Database["public"]["Enums"]["tool_run_status"];
          tool_key: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          id?: string;
          input?: Json;
          metadata?: Json;
          organization_id: string;
          output?: Json | null;
          status?: Database["public"]["Enums"]["tool_run_status"];
          tool_key: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          id?: string;
          input?: Json;
          metadata?: Json;
          organization_id?: string;
          output?: Json | null;
          status?: Database["public"]["Enums"]["tool_run_status"];
          tool_key?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tool_runs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_tracking: {
        Row: {
          count: number;
          id: string;
          last_used_at: string;
          organization_id: string;
          period: string;
          tool_key: string;
        };
        Insert: {
          count?: number;
          id?: string;
          last_used_at?: string;
          organization_id: string;
          period: string;
          tool_key: string;
        };
        Update: {
          count?: number;
          id?: string;
          last_used_at?: string;
          organization_id?: string;
          period?: string;
          tool_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usage_tracking_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_integrations: {
        Row: {
          created_at: string;
          id: string;
          integration_key: string;
          status: string;
          updated_at: string;
          user_id: string;
          value_encrypted: string | null;
          value_last4: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          integration_key: string;
          status?: string;
          updated_at?: string;
          user_id: string;
          value_encrypted?: string | null;
          value_last4?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          integration_key?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
          value_encrypted?: string | null;
          value_last4?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      website_analyses: {
        Row: {
          created_at: string;
          id: string;
          issues: Json;
          opportunities: Json;
          organization_id: string;
          seo_notes: string | null;
          snapshot_path: string | null;
          suggested_changes: Json;
          url: string;
          user_id: string;
          ux_notes: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          issues?: Json;
          opportunities?: Json;
          organization_id: string;
          seo_notes?: string | null;
          snapshot_path?: string | null;
          suggested_changes?: Json;
          url: string;
          user_id: string;
          ux_notes?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          issues?: Json;
          opportunities?: Json;
          organization_id?: string;
          seo_notes?: string | null;
          snapshot_path?: string | null;
          suggested_changes?: Json;
          url?: string;
          user_id?: string;
          ux_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "website_analyses_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      client_kpi_metrics: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          metric_key: string;
          metric_value: number;
          metric_date: string;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          metric_key: string;
          metric_value?: number;
          metric_date?: string;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          metric_key?: string;
          metric_value?: number;
          metric_date?: string;
          source?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      client_reports: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          period_start: string | null;
          period_end: string | null;
          period_label: string | null;
          markdown_payload: string | null;
          pdf_url: string | null;
          kpi_snapshot: Json;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          period_label?: string | null;
          markdown_payload?: string | null;
          pdf_url?: string | null;
          kpi_snapshot?: Json;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          period_label?: string | null;
          markdown_payload?: string | null;
          pdf_url?: string | null;
          kpi_snapshot?: Json;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      content_outputs: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          payload: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      credit_ledger: {
        Row: {
          id: string;
          user_id: string;
          tool: string;
          cost: number;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tool: string;
          cost: number;
          meta?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tool?: string;
          cost?: number;
          meta?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      health_checks: {
        Row: {
          id: string;
          endpoint_name: string;
          status: string;
          status_code: number | null;
          response_time_ms: number | null;
          checked_at: string;
        };
        Insert: {
          id?: string;
          endpoint_name: string;
          status: string;
          status_code?: number | null;
          response_time_ms?: number | null;
          checked_at?: string;
        };
        Update: {
          id?: string;
          endpoint_name?: string;
          status?: string;
          status_code?: number | null;
          response_time_ms?: number | null;
          checked_at?: string;
        };
        Relationships: [];
      };
      n8n_error_log: {
        Row: {
          id: string;
          workflow_name: string;
          error_message: string | null;
          error_node: string | null;
          execution_id: string | null;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          workflow_name: string;
          error_message?: string | null;
          error_node?: string | null;
          execution_id?: string | null;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          workflow_name?: string;
          error_message?: string | null;
          error_node?: string | null;
          execution_id?: string | null;
          occurred_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          type: string | null;
          tool_id: string | null;
          message: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          type?: string | null;
          tool_id?: string | null;
          message?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          type?: string | null;
          tool_id?: string | null;
          message?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      operator_memory: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          memory_type: string;
          content: string;
          tags: string[];
          pruned: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          memory_type?: string;
          content: string;
          tags?: string[];
          pruned?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          memory_type?: string;
          content?: string;
          tags?: string[];
          pruned?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      operator_prompts: {
        Row: {
          id: string;
          component: string;
          system_prompt: string;
          version: string;
          is_known_component: boolean | null;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          component: string;
          system_prompt: string;
          version?: string;
          is_known_component?: boolean | null;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          component?: string;
          system_prompt?: string;
          version?: string;
          is_known_component?: boolean | null;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      operator_sessions: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          message: string | null;
          type: string | null;
          last_confidence: number | null;
          top_intents: Json | null;
          clarification_text: string | null;
          clarification_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          message?: string | null;
          type?: string | null;
          last_confidence?: number | null;
          top_intents?: Json | null;
          clarification_text?: string | null;
          clarification_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          message?: string | null;
          type?: string | null;
          last_confidence?: number | null;
          top_intents?: Json | null;
          clarification_text?: string | null;
          clarification_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          issue_summary: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          issue_summary: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          issue_summary?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      tool_outputs: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          tool_id: string;
          output_type: string;
          raw_output: string | null;
          formatted_output: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          tool_id: string;
          output_type?: string;
          raw_output?: string | null;
          formatted_output?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          tool_id?: string;
          output_type?: string;
          raw_output?: string | null;
          formatted_output?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      user_ai_config: {
        Row: {
          user_id: string;
          brand_voice: Json;
          niche: string | null;
          tone: string | null;
          writing_style: string | null;
          icp: Json;
          value_props: Json;
          company_name: string | null;
          logo_url: string | null;
          primary_color: string | null;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          brand_voice?: Json;
          niche?: string | null;
          tone?: string | null;
          writing_style?: string | null;
          icp?: Json;
          value_props?: Json;
          company_name?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          brand_voice?: Json;
          niche?: string | null;
          tone?: string | null;
          writing_style?: string | null;
          icp?: Json;
          value_props?: Json;
          company_name?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      user_credit_balance: {
        Row: {
          user_id: string | null;
          starting_credits: number | null;
          credits_used: number | null;
          credits_remaining: number | null;
        };
        Insert: {
          [_ in never]: never;
        };
        Update: {
          [_ in never]: never;
        };
        Relationships: [];
      };
      users: {
        Row: {
          user_id: string | null;
          email: string | null;
          plan_tier: string | null;
          plan_tier_enum: string | null;
          organization_id: string | null;
          created_at: string | null;
        };
        Insert: {
          [_ in never]: never;
        };
        Update: {
          [_ in never]: never;
        };
        Relationships: [];
      };
      user_integrations_masked: {
        Row: {
          created_at: string | null;
          id: string | null;
          integration_key: string | null;
          is_connected: boolean | null;
          status: string | null;
          updated_at: string | null;
          user_id: string | null;
          value_last4: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string | null;
          integration_key?: string | null;
          is_connected?: never;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          value_last4?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string | null;
          integration_key?: string | null;
          is_connected?: never;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          value_last4?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_user_integration_secret: {
        Args: {
          _encryption_key: string;
          _integration_key: string;
          _user_id: string;
        };
        Returns: string;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_org_member: {
        Args: { _org_id: string; _user_id: string };
        Returns: boolean;
      };
      is_org_owner: {
        Args: { _org_id: string; _user_id: string };
        Returns: boolean;
      };
      set_user_integration: {
        Args: {
          _encryption_key: string;
          _integration_key: string;
          _user_id: string;
          _value: string;
        };
        Returns: {
          integration_key: string;
          is_connected: boolean;
          status: string;
          value_last4: string;
        }[];
      };
    };
    Enums: {
      app_role: "user" | "admin";
      business_stage: "Idea" | "Validate" | "Launch" | "Operate" | "Scale";
      lead_stage: "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
      org_role: "owner" | "admin" | "member";
      plan_tier: "starter" | "launch" | "operate" | "scale";
      tool_run_status: "running" | "succeeded" | "failed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

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
} as const;
