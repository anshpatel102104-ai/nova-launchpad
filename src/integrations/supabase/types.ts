export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activation_events: {
        Row: {
          created_at: string;
          event_name: string;
          id: string;
          properties: Json;
          user_id: string;
          workspace_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_name: string;
          id?: string;
          properties?: Json;
          user_id: string;
          workspace_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_name?: string;
          id?: string;
          properties?: Json;
          user_id?: string;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activation_events_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id"];
          },
          {
            foreignKeyName: "activation_events_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_audit_log: {
        Row: {
          created_at: string;
          email: string | null;
          event_type: string;
          id: string;
          metadata: Json | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      agent_runs: {
        Row: {
          agent_type: Database["public"]["Enums"]["agent_type"];
          created_at: string;
          duration_ms: number | null;
          error: string | null;
          id: string;
          input: Json;
          mission_id: string | null;
          model: string | null;
          output: Json | null;
          status: Database["public"]["Enums"]["agent_run_status"];
          tokens_used: number | null;
          updated_at: string;
          user_id: string;
          workspace_id: string | null;
        };
        Insert: {
          agent_type?: Database["public"]["Enums"]["agent_type"];
          created_at?: string;
          duration_ms?: number | null;
          error?: string | null;
          id?: string;
          input?: Json;
          mission_id?: string | null;
          model?: string | null;
          output?: Json | null;
          status?: Database["public"]["Enums"]["agent_run_status"];
          tokens_used?: number | null;
          updated_at?: string;
          user_id: string;
          workspace_id?: string | null;
        };
        Update: {
          agent_type?: Database["public"]["Enums"]["agent_type"];
          created_at?: string;
          duration_ms?: number | null;
          error?: string | null;
          id?: string;
          input?: Json;
          mission_id?: string | null;
          model?: string | null;
          output?: Json | null;
          status?: Database["public"]["Enums"]["agent_run_status"];
          tokens_used?: number | null;
          updated_at?: string;
          user_id?: string;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agent_runs_mission_id_fkey";
            columns: ["mission_id"];
            isOneToOne: false;
            referencedRelation: "missions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_runs_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id"];
          },
          {
            foreignKeyName: "agent_runs_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_dashboards: {
        Row: {
          biggest_blocker: string;
          business: string;
          created_at: string;
          current_revenue: string;
          generated_at: string;
          goal: string;
          id: string;
          model: string;
          niche: string;
          organization_id: string;
          payload: Json;
          prompt_version: string;
          stage: string;
          target_customer: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          biggest_blocker?: string;
          business?: string;
          created_at?: string;
          current_revenue?: string;
          generated_at?: string;
          goal?: string;
          id?: string;
          model?: string;
          niche?: string;
          organization_id: string;
          payload?: Json;
          prompt_version?: string;
          stage?: string;
          target_customer?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          biggest_blocker?: string;
          business?: string;
          created_at?: string;
          current_revenue?: string;
          generated_at?: string;
          goal?: string;
          id?: string;
          model?: string;
          niche?: string;
          organization_id?: string;
          payload?: Json;
          prompt_version?: string;
          stage?: string;
          target_customer?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_dashboards_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_operator_configs: {
        Row: {
          brand_voice_keywords: Json | null;
          created_at: string;
          gtm_strategy_summary: string | null;
          id: string;
          llm_model: string | null;
          llm_prompt_version: string | null;
          operator_name: string | null;
          operator_tone: string | null;
          primary_niche: string | null;
          raw_llm_response: Json | null;
          recommended_tools: Json | null;
          source_intake_id: string | null;
          status: string;
          target_customer_profile: string | null;
          top_3_pain_points: Json | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          brand_voice_keywords?: Json | null;
          created_at?: string;
          gtm_strategy_summary?: string | null;
          id?: string;
          llm_model?: string | null;
          llm_prompt_version?: string | null;
          operator_name?: string | null;
          operator_tone?: string | null;
          primary_niche?: string | null;
          raw_llm_response?: Json | null;
          recommended_tools?: Json | null;
          source_intake_id?: string | null;
          status?: string;
          target_customer_profile?: string | null;
          top_3_pain_points?: Json | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          brand_voice_keywords?: Json | null;
          created_at?: string;
          gtm_strategy_summary?: string | null;
          id?: string;
          llm_model?: string | null;
          llm_prompt_version?: string | null;
          operator_name?: string | null;
          operator_tone?: string | null;
          primary_niche?: string | null;
          raw_llm_response?: Json | null;
          recommended_tools?: Json | null;
          source_intake_id?: string | null;
          status?: string;
          target_customer_profile?: string | null;
          top_3_pain_points?: Json | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ai_usage: {
        Row: {
          created_at: string;
          id: string;
          model: string;
          prompt_summary: string | null;
          session_id: string | null;
          tokens_used: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          model?: string;
          prompt_summary?: string | null;
          session_id?: string | null;
          tokens_used?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          model?: string;
          prompt_summary?: string | null;
          session_id?: string | null;
          tokens_used?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      asset_versions: {
        Row: {
          asset_id: string;
          content: Json;
          created_at: string;
          created_by: string | null;
          diff_summary: string | null;
          id: string;
          version_number: number;
        };
        Insert: {
          asset_id: string;
          content?: Json;
          created_at?: string;
          created_by?: string | null;
          diff_summary?: string | null;
          id?: string;
          version_number?: number;
        };
        Update: {
          asset_id?: string;
          content?: Json;
          created_at?: string;
          created_by?: string | null;
          diff_summary?: string | null;
          id?: string;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "asset_versions_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "generated_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_connections: {
        Row: {
          config: Json;
          created_at: string;
          id: string;
          integration_key: string;
          last_triggered_at: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          id?: string;
          integration_key: string;
          last_triggered_at?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          id?: string;
          integration_key?: string;
          last_triggered_at?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_connections_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id"];
          },
          {
            foreignKeyName: "automation_connections_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_drafts: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          status: string;
          updated_at: string;
          user_id: string;
          workflow_json: Json;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
          workflow_json: Json;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
          workflow_json?: Json;
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
          label: string | null;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          key: string;
          label?: string | null;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          key?: string;
          label?: string | null;
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
      client_kpi_metrics: {
        Row: {
          client_id: string | null;
          created_at: string;
          id: string;
          metric_date: string;
          metric_key: string;
          metric_value: number;
          source: string | null;
          user_id: string;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          id?: string;
          metric_date?: string;
          metric_key: string;
          metric_value?: number;
          source?: string | null;
          user_id: string;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          id?: string;
          metric_date?: string;
          metric_key?: string;
          metric_value?: number;
          source?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      client_reports: {
        Row: {
          client_id: string | null;
          created_at: string;
          id: string;
          kpi_snapshot: Json | null;
          markdown_payload: string | null;
          pdf_url: string | null;
          period_end: string | null;
          period_label: string | null;
          period_start: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          id?: string;
          kpi_snapshot?: Json | null;
          markdown_payload?: string | null;
          pdf_url?: string | null;
          period_end?: string | null;
          period_label?: string | null;
          period_start?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          id?: string;
          kpi_snapshot?: Json | null;
          markdown_payload?: string | null;
          pdf_url?: string | null;
          period_end?: string | null;
          period_label?: string | null;
          period_start?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      content_outputs: {
        Row: {
          created_at: string;
          id: string;
          payload: Json;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          payload: Json;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          payload?: Json;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      credit_ledger: {
        Row: {
          cost: number;
          created_at: string;
          id: string;
          meta: Json | null;
          tool: string;
          user_id: string;
        };
        Insert: {
          cost: number;
          created_at?: string;
          id?: string;
          meta?: Json | null;
          tool: string;
          user_id: string;
        };
        Update: {
          cost?: number;
          created_at?: string;
          id?: string;
          meta?: Json | null;
          tool?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      feature_entitlements: {
        Row: {
          created_at: string;
          enabled: boolean;
          expires_at: string | null;
          feature_key: string;
          granted_by: string | null;
          id: string;
          limit_override: number | null;
          notes: string | null;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          enabled?: boolean;
          expires_at?: string | null;
          feature_key: string;
          granted_by?: string | null;
          id?: string;
          limit_override?: number | null;
          notes?: string | null;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          enabled?: boolean;
          expires_at?: string | null;
          feature_key?: string;
          granted_by?: string | null;
          id?: string;
          limit_override?: number | null;
          notes?: string | null;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feature_entitlements_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      generated_assets: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          metadata: Json;
          mime_type: string | null;
          organization_id: string;
          size_bytes: number | null;
          storage_bucket: string | null;
          storage_path: string | null;
          title: string;
          tool_run_id: string | null;
          updated_by: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          metadata?: Json;
          mime_type?: string | null;
          organization_id: string;
          size_bytes?: number | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          title: string;
          tool_run_id?: string | null;
          updated_by?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          metadata?: Json;
          mime_type?: string | null;
          organization_id?: string;
          size_bytes?: number | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          title?: string;
          tool_run_id?: string | null;
          updated_by?: string | null;
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
      health_checks: {
        Row: {
          checked_at: string;
          endpoint_name: string;
          id: string;
          response_time_ms: number | null;
          status: string;
          status_code: number | null;
        };
        Insert: {
          checked_at?: string;
          endpoint_name: string;
          id?: string;
          response_time_ms?: number | null;
          status: string;
          status_code?: number | null;
        };
        Update: {
          checked_at?: string;
          endpoint_name?: string;
          id?: string;
          response_time_ms?: number | null;
          status?: string;
          status_code?: number | null;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          company: string | null;
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
          value: number | null;
        };
        Insert: {
          company?: string | null;
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
          value?: number | null;
        };
        Update: {
          company?: string | null;
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
      mission_steps: {
        Row: {
          completed_at: string | null;
          created_at: string;
          description: string | null;
          id: string;
          mission_id: string;
          sort_order: number;
          status: Database["public"]["Enums"]["step_status"];
          title: string;
          tool_key: string | null;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          mission_id: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["step_status"];
          title: string;
          tool_key?: string | null;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          mission_id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["step_status"];
          title?: string;
          tool_key?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mission_steps_mission_id_fkey";
            columns: ["mission_id"];
            isOneToOne: false;
            referencedRelation: "missions";
            referencedColumns: ["id"];
          },
        ];
      };
      missions: {
        Row: {
          assigned_at: string;
          completed_at: string | null;
          created_at: string;
          description: string | null;
          id: string;
          lane: Database["public"]["Enums"]["workspace_lane"];
          sort_order: number;
          status: Database["public"]["Enums"]["mission_status"];
          title: string;
          updated_at: string;
          updated_by: string | null;
          workspace_id: string;
        };
        Insert: {
          assigned_at?: string;
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          lane?: Database["public"]["Enums"]["workspace_lane"];
          sort_order?: number;
          status?: Database["public"]["Enums"]["mission_status"];
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          workspace_id: string;
        };
        Update: {
          assigned_at?: string;
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          lane?: Database["public"]["Enums"]["workspace_lane"];
          sort_order?: number;
          status?: Database["public"]["Enums"]["mission_status"];
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "missions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id"];
          },
          {
            foreignKeyName: "missions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      n8n_error_log: {
        Row: {
          error_message: string | null;
          error_node: string | null;
          execution_id: string | null;
          id: string;
          occurred_at: string;
          workflow_name: string;
        };
        Insert: {
          error_message?: string | null;
          error_node?: string | null;
          execution_id?: string | null;
          id?: string;
          occurred_at?: string;
          workflow_name: string;
        };
        Update: {
          error_message?: string | null;
          error_node?: string | null;
          execution_id?: string | null;
          id?: string;
          occurred_at?: string;
          workflow_name?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          message: string | null;
          read: boolean | null;
          session_id: string | null;
          tool_id: string | null;
          type: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message?: string | null;
          read?: boolean | null;
          session_id?: string | null;
          tool_id?: string | null;
          type?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string | null;
          read?: boolean | null;
          session_id?: string | null;
          tool_id?: string | null;
          type?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      onboarding_responses: {
        Row: {
          biggest_blocker: string | null;
          business_name: string | null;
          business_type: string | null;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          current_revenue: string | null;
          goal: string | null;
          id: string;
          location: string | null;
          niche: string | null;
          offer: string | null;
          organization_id: string | null;
          stage: Database["public"]["Enums"]["app_stage"] | null;
          target_customer: string | null;
          updated_at: string;
          user_id: string;
          website_url: string | null;
        };
        Insert: {
          biggest_blocker?: string | null;
          business_name?: string | null;
          business_type?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          current_revenue?: string | null;
          goal?: string | null;
          id?: string;
          location?: string | null;
          niche?: string | null;
          offer?: string | null;
          organization_id?: string | null;
          stage?: Database["public"]["Enums"]["app_stage"] | null;
          target_customer?: string | null;
          updated_at?: string;
          user_id: string;
          website_url?: string | null;
        };
        Update: {
          biggest_blocker?: string | null;
          business_name?: string | null;
          business_type?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          current_revenue?: string | null;
          goal?: string | null;
          id?: string;
          location?: string | null;
          niche?: string | null;
          offer?: string | null;
          organization_id?: string | null;
          stage?: Database["public"]["Enums"]["app_stage"] | null;
          target_customer?: string | null;
          updated_at?: string;
          user_id?: string;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "onboarding_responses_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      onboarding_sessions: {
        Row: {
          answers: Json;
          created_at: string;
          id: string;
          mode: string | null;
          status: string;
          step: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          answers?: Json;
          created_at?: string;
          id?: string;
          mode?: string | null;
          status?: string;
          step?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          answers?: Json;
          created_at?: string;
          id?: string;
          mode?: string | null;
          status?: string;
          step?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      business_context: {
        Row: {
          activity: Json;
          constraints: Json;
          created_at: string;
          customer: Json;
          goals: Json;
          id: string;
          identity: Json;
          model: Json;
          motion: Json;
          organization_id: string;
          stage: Json;
          updated_at: string;
          verdicts: Json;
          version: number;
          workspace_id: string | null;
        };
        Insert: {
          activity?: Json;
          constraints?: Json;
          created_at?: string;
          customer?: Json;
          goals?: Json;
          id?: string;
          identity?: Json;
          model?: Json;
          motion?: Json;
          organization_id: string;
          stage?: Json;
          updated_at?: string;
          verdicts?: Json;
          version?: number;
          workspace_id?: string | null;
        };
        Update: {
          activity?: Json;
          constraints?: Json;
          created_at?: string;
          customer?: Json;
          goals?: Json;
          id?: string;
          identity?: Json;
          model?: Json;
          motion?: Json;
          organization_id?: string;
          stage?: Json;
          updated_at?: string;
          verdicts?: Json;
          version?: number;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "business_context_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      operator_memory: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          memory_type: string;
          pruned: boolean | null;
          session_id: string | null;
          tags: string[] | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          memory_type?: string;
          pruned?: boolean | null;
          session_id?: string | null;
          tags?: string[] | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          memory_type?: string;
          pruned?: boolean | null;
          session_id?: string | null;
          tags?: string[] | null;
          user_id?: string;
        };
        Relationships: [];
      };
      operator_prompts: {
        Row: {
          component: string;
          created_at: string;
          id: string;
          is_known_component: boolean | null;
          system_prompt: string;
          updated_at: string;
          version: string;
        };
        Insert: {
          component: string;
          created_at?: string;
          id?: string;
          is_known_component?: boolean | null;
          system_prompt: string;
          updated_at?: string;
          version?: string;
        };
        Update: {
          component?: string;
          created_at?: string;
          id?: string;
          is_known_component?: boolean | null;
          system_prompt?: string;
          updated_at?: string;
          version?: string;
        };
        Relationships: [];
      };
      operator_sessions: {
        Row: {
          clarification_sent: boolean | null;
          clarification_text: string | null;
          created_at: string;
          id: string;
          last_confidence: number | null;
          message: string | null;
          session_id: string;
          top_intents: Json | null;
          type: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          clarification_sent?: boolean | null;
          clarification_text?: string | null;
          created_at?: string;
          id?: string;
          last_confidence?: number | null;
          message?: string | null;
          session_id: string;
          top_intents?: Json | null;
          type?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          clarification_sent?: boolean | null;
          clarification_text?: string | null;
          created_at?: string;
          id?: string;
          last_confidence?: number | null;
          message?: string | null;
          session_id?: string;
          top_intents?: Json | null;
          type?: string | null;
          updated_at?: string;
          user_id?: string | null;
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
          created_by: string | null;
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
        };
        Insert: {
          business_type?: string | null;
          created_at?: string;
          created_by?: string | null;
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
        };
        Update: {
          business_type?: string | null;
          created_at?: string;
          created_by?: string | null;
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
        };
        Relationships: [];
      };
      plan_tier_limits: {
        Row: {
          allowed_tools: string[];
          created_at: string;
          monthly_generation_limit: number | null;
          plan: string;
          price_usd: number;
          updated_at: string;
        };
        Insert: {
          allowed_tools?: string[];
          created_at?: string;
          monthly_generation_limit?: number | null;
          plan: string;
          price_usd?: number;
          updated_at?: string;
        };
        Update: {
          allowed_tools?: string[];
          created_at?: string;
          monthly_generation_limit?: number | null;
          plan?: string;
          price_usd?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          onboarding_complete: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          onboarding_complete?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          onboarding_complete?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      stripe_webhook_events: {
        Row: {
          id: string;
          processed_at: string;
          type: string;
        };
        Insert: {
          id: string;
          processed_at?: string;
          type: string;
        };
        Update: {
          id?: string;
          processed_at?: string;
          type?: string;
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
          status: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          organization_id: string;
          plan?: Database["public"]["Enums"]["plan_tier"];
          status?: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          organization_id?: string;
          plan?: Database["public"]["Enums"]["plan_tier"];
          status?: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
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
      support_tickets: {
        Row: {
          created_at: string;
          id: string;
          issue_summary: string;
          session_id: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          issue_summary: string;
          session_id?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          issue_summary?: string;
          session_id?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tool_outputs: {
        Row: {
          created_at: string;
          formatted_output: string | null;
          id: string;
          output_type: string;
          raw_output: string | null;
          read: boolean | null;
          session_id: string | null;
          tool_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          formatted_output?: string | null;
          id?: string;
          output_type?: string;
          raw_output?: string | null;
          read?: boolean | null;
          session_id?: string | null;
          tool_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          formatted_output?: string | null;
          id?: string;
          output_type?: string;
          raw_output?: string | null;
          read?: boolean | null;
          session_id?: string | null;
          tool_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tool_runs: {
        Row: {
          completed_at: string | null;
          created_at: string;
          duration_ms: number | null;
          error: string | null;
          feedback: string | null;
          feedback_at: string | null;
          id: string;
          input: Json;
          organization_id: string;
          output: Json | null;
          status: Database["public"]["Enums"]["tool_run_status"];
          surface: Database["public"]["Enums"]["tool_surface"];
          title: string | null;
          tokens_used: number | null;
          tool_key: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          duration_ms?: number | null;
          error?: string | null;
          feedback?: string | null;
          feedback_at?: string | null;
          id?: string;
          input?: Json;
          organization_id: string;
          output?: Json | null;
          status?: Database["public"]["Enums"]["tool_run_status"];
          surface: Database["public"]["Enums"]["tool_surface"];
          title?: string | null;
          tokens_used?: number | null;
          tool_key: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          duration_ms?: number | null;
          error?: string | null;
          feedback?: string | null;
          feedback_at?: string | null;
          id?: string;
          input?: Json;
          organization_id?: string;
          output?: Json | null;
          status?: Database["public"]["Enums"]["tool_run_status"];
          surface?: Database["public"]["Enums"]["tool_surface"];
          title?: string | null;
          tokens_used?: number | null;
          tool_key?: string;
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
      usage_events: {
        Row: {
          created_at: string;
          credits_used: number;
          duration_ms: number | null;
          event_type: string;
          id: string;
          metadata: Json;
          model: string | null;
          organization_id: string | null;
          resource_key: string | null;
          status: string;
          tokens_in: number | null;
          tokens_out: number | null;
          user_id: string;
          workspace_id: string | null;
        };
        Insert: {
          created_at?: string;
          credits_used?: number;
          duration_ms?: number | null;
          event_type: string;
          id?: string;
          metadata?: Json;
          model?: string | null;
          organization_id?: string | null;
          resource_key?: string | null;
          status?: string;
          tokens_in?: number | null;
          tokens_out?: number | null;
          user_id: string;
          workspace_id?: string | null;
        };
        Update: {
          created_at?: string;
          credits_used?: number;
          duration_ms?: number | null;
          event_type?: string;
          id?: string;
          metadata?: Json;
          model?: string | null;
          organization_id?: string | null;
          resource_key?: string | null;
          status?: string;
          tokens_in?: number | null;
          tokens_out?: number | null;
          user_id?: string;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "usage_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usage_events_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id"];
          },
          {
            foreignKeyName: "usage_events_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_tracking: {
        Row: {
          count: number;
          created_at: string;
          id: string;
          organization_id: string;
          period: string;
          tool_key: string;
          updated_at: string;
        };
        Insert: {
          count?: number;
          created_at?: string;
          id?: string;
          organization_id: string;
          period: string;
          tool_key: string;
          updated_at?: string;
        };
        Update: {
          count?: number;
          created_at?: string;
          id?: string;
          organization_id?: string;
          period?: string;
          tool_key?: string;
          updated_at?: string;
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
      user_ai_config: {
        Row: {
          brand_voice: Json | null;
          company_name: string | null;
          created_at: string;
          icp: Json | null;
          logo_url: string | null;
          niche: string | null;
          primary_color: string | null;
          tone: string | null;
          updated_at: string;
          user_id: string;
          value_props: Json | null;
          writing_style: string | null;
        };
        Insert: {
          brand_voice?: Json | null;
          company_name?: string | null;
          created_at?: string;
          icp?: Json | null;
          logo_url?: string | null;
          niche?: string | null;
          primary_color?: string | null;
          tone?: string | null;
          updated_at?: string;
          user_id: string;
          value_props?: Json | null;
          writing_style?: string | null;
        };
        Update: {
          brand_voice?: Json | null;
          company_name?: string | null;
          created_at?: string;
          icp?: Json | null;
          logo_url?: string | null;
          niche?: string | null;
          primary_color?: string | null;
          tone?: string | null;
          updated_at?: string;
          user_id?: string;
          value_props?: Json | null;
          writing_style?: string | null;
        };
        Relationships: [];
      };
      user_integrations: {
        Row: {
          created_at: string;
          encrypted_value: string | null;
          id: string;
          integration_key: string;
          status: string;
          updated_at: string;
          user_id: string;
          value_hint: string | null;
        };
        Insert: {
          created_at?: string;
          encrypted_value?: string | null;
          id?: string;
          integration_key: string;
          status?: string;
          updated_at?: string;
          user_id: string;
          value_hint?: string | null;
        };
        Update: {
          created_at?: string;
          encrypted_value?: string | null;
          id?: string;
          integration_key?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
          value_hint?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      website_analyses: {
        Row: {
          created_at: string;
          error: string | null;
          id: string;
          organization_id: string;
          result: Json | null;
          status: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          id?: string;
          organization_id: string;
          result?: Json | null;
          status?: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          id?: string;
          organization_id?: string;
          result?: Json | null;
          status?: string;
          updated_at?: string;
          url?: string;
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
      workflow_logs: {
        Row: {
          created_at: string;
          error_message: string | null;
          execution_id: string;
          id: string;
          log_type: string;
          timestamp: string;
          workflow_name: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          execution_id?: string;
          id?: string;
          log_type: string;
          timestamp?: string;
          workflow_name?: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          execution_id?: string;
          id?: string;
          log_type?: string;
          timestamp?: string;
          workflow_name?: string;
        };
        Relationships: [];
      };
      workflow_runs: {
        Row: {
          created_at: string;
          duration_ms: number | null;
          error: string | null;
          id: string;
          input: Json;
          n8n_execution_id: string | null;
          output: Json | null;
          status: string;
          trigger_event: string | null;
          updated_at: string;
          user_id: string;
          workflow_name: string;
          workspace_id: string | null;
        };
        Insert: {
          created_at?: string;
          duration_ms?: number | null;
          error?: string | null;
          id?: string;
          input?: Json;
          n8n_execution_id?: string | null;
          output?: Json | null;
          status?: string;
          trigger_event?: string | null;
          updated_at?: string;
          user_id: string;
          workflow_name: string;
          workspace_id?: string | null;
        };
        Update: {
          created_at?: string;
          duration_ms?: number | null;
          error?: string | null;
          id?: string;
          input?: Json;
          n8n_execution_id?: string | null;
          output?: Json | null;
          status?: string;
          trigger_event?: string | null;
          updated_at?: string;
          user_id?: string;
          workflow_name?: string;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_runs_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id"];
          },
          {
            foreignKeyName: "workflow_runs_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_intake: {
        Row: {
          challenge: string | null;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          idea: string | null;
          lane: Database["public"]["Enums"]["workspace_lane"] | null;
          raw_answers: Json;
          stage: string | null;
          updated_at: string;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          challenge?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          idea?: string | null;
          lane?: Database["public"]["Enums"]["workspace_lane"] | null;
          raw_answers?: Json;
          stage?: string | null;
          updated_at?: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          challenge?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          idea?: string | null;
          lane?: Database["public"]["Enums"]["workspace_lane"] | null;
          raw_answers?: Json;
          stage?: string | null;
          updated_at?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_intake_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id"];
          },
          {
            foreignKeyName: "workspace_intake_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspaces: {
        Row: {
          created_at: string;
          current_mission_id: string | null;
          id: string;
          lane: Database["public"]["Enums"]["workspace_lane"];
          mode: string;
          name: string;
          organization_id: string;
          owner_id: string;
          provisioning_status: string;
          stage: Database["public"]["Enums"]["business_stage"];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          current_mission_id?: string | null;
          id?: string;
          lane?: Database["public"]["Enums"]["workspace_lane"];
          mode?: string;
          name: string;
          organization_id: string;
          owner_id: string;
          provisioning_status?: string;
          stage?: Database["public"]["Enums"]["business_stage"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          current_mission_id?: string | null;
          id?: string;
          lane?: Database["public"]["Enums"]["workspace_lane"];
          mode?: string;
          name?: string;
          organization_id?: string;
          owner_id?: string;
          provisioning_status?: string;
          stage?: Database["public"]["Enums"]["business_stage"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workspaces_current_mission_id_fkey";
            columns: ["current_mission_id"];
            isOneToOne: false;
            referencedRelation: "missions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspaces_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      ai_operator_config: {
        Row: {
          brand_voice_keywords: Json | null;
          created_at: string | null;
          gtm_strategy_summary: string | null;
          id: string | null;
          llm_model: string | null;
          llm_prompt_version: string | null;
          operator_name: string | null;
          operator_tone: string | null;
          primary_niche: string | null;
          raw_llm_response: Json | null;
          recommended_tools: Json | null;
          source_intake_id: string | null;
          status: string | null;
          top_3_pain_points: Json | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          brand_voice_keywords?: Json | null;
          created_at?: string | null;
          gtm_strategy_summary?: string | null;
          id?: string | null;
          llm_model?: string | null;
          llm_prompt_version?: string | null;
          operator_name?: string | null;
          operator_tone?: string | null;
          primary_niche?: string | null;
          raw_llm_response?: Json | null;
          recommended_tools?: Json | null;
          source_intake_id?: string | null;
          status?: string | null;
          top_3_pain_points?: Json | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          brand_voice_keywords?: Json | null;
          created_at?: string | null;
          gtm_strategy_summary?: string | null;
          id?: string | null;
          llm_model?: string | null;
          llm_prompt_version?: string | null;
          operator_name?: string | null;
          operator_tone?: string | null;
          primary_niche?: string | null;
          raw_llm_response?: Json | null;
          recommended_tools?: Json | null;
          source_intake_id?: string | null;
          status?: string | null;
          top_3_pain_points?: Json | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_credit_balance: {
        Row: {
          generations_used: number | null;
          monthly_limit: number | null;
          user_id: string | null;
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
          value_last4?: never;
        };
        Update: {
          created_at?: string | null;
          id?: string | null;
          integration_key?: string | null;
          is_connected?: never;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          value_last4?: never;
        };
        Relationships: [];
      };
      users: {
        Row: {
          created_at: string | null;
          email: string | null;
          organization_id: string | null;
          plan_tier: string | null;
          plan_tier_enum: string | null;
          user_id: string | null;
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
      workspace_members: {
        Row: {
          created_at: string | null;
          id: string | null;
          organization_id: string | null;
          role: Database["public"]["Enums"]["org_role"] | null;
          user_id: string | null;
          workspace_id: string | null;
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
    };
    Functions: {
      get_org_entitlements: {
        Args: { _org_id: string };
        Returns: {
          enabled: boolean;
          feature_key: string;
          limit_value: number;
        }[];
      };
      get_user_plan: { Args: { _org_id: string }; Returns: string };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      increment_usage: {
        Args: {
          p_organization_id: string;
          p_period: string;
          p_tool_key: string;
        };
        Returns: undefined;
      };
      is_org_admin: {
        Args: { _org_id: string; _user_id: string };
        Returns: boolean;
      };
      is_org_member: {
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
      agent_run_status: "running" | "succeeded" | "failed";
      agent_type: "operator" | "intake" | "strategy" | "content" | "automation" | "qa";
      app_plan: "Starter" | "Launch" | "Operate" | "Scale";
      app_role: "user" | "admin";
      app_stage: "Idea" | "Validate" | "Launch" | "Operate" | "Scale";
      business_stage: "Idea" | "Validate" | "Launch" | "Operate" | "Scale";
      lead_stage: "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
      mission_status: "active" | "completed" | "skipped" | "paused";
      org_role: "owner" | "admin" | "member";
      plan_tier: "starter" | "launch" | "operate" | "scale";
      step_status: "pending" | "in_progress" | "completed" | "skipped";
      subscription_status: "trialing" | "active" | "past_due" | "canceled" | "incomplete";
      tool_run_status: "queued" | "running" | "succeeded" | "failed";
      tool_surface: "launchpad" | "nova";
      workspace_lane: "Idea" | "Offer" | "Customer" | "Systems";
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
      agent_run_status: ["running", "succeeded", "failed"],
      agent_type: ["operator", "intake", "strategy", "content", "automation", "qa"],
      app_plan: ["Starter", "Launch", "Operate", "Scale"],
      app_role: ["user", "admin"],
      app_stage: ["Idea", "Validate", "Launch", "Operate", "Scale"],
      business_stage: ["Idea", "Validate", "Launch", "Operate", "Scale"],
      lead_stage: ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"],
      mission_status: ["active", "completed", "skipped", "paused"],
      org_role: ["owner", "admin", "member"],
      plan_tier: ["starter", "launch", "operate", "scale"],
      step_status: ["pending", "in_progress", "completed", "skipped"],
      subscription_status: ["trialing", "active", "past_due", "canceled", "incomplete"],
      tool_run_status: ["queued", "running", "succeeded", "failed"],
      tool_surface: ["launchpad", "nova"],
      workspace_lane: ["Idea", "Offer", "Customer", "Systems"],
    },
  },
} as const;
