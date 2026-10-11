export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AdminRole = 'admin' | 'support'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'VET' | 'AUXILIAR' | 'CLINIC'
          full_name: string
          phone: string | null
          avatar_path: string | null
          onboarding_completed: boolean
          notification_prefs: Json | null
          account_status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED'
          suspended_until: string | null
          suspension_reason: string | null
          status_changed_by: string | null
          status_changed_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'VET' | 'AUXILIAR' | 'CLINIC'
          full_name: string
          phone?: string | null
          avatar_path?: string | null
          onboarding_completed?: boolean
          notification_prefs?: Json | null
          account_status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED'
          suspended_until?: string | null
          suspension_reason?: string | null
          status_changed_by?: string | null
          status_changed_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      vets: {
        Row: {
          id: string
          professional_type: 'VET' | 'AUXILIAR'
          crmv: string | null
          crmv_state: string | null
          crmv_verified: boolean
          verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_INFO'
          verified_at: string | null
          verified_by: string | null
          verification_note: string | null
          bio: string | null
          job_types: string[] | null
          equipment: string[] | null
          max_distance_km: number | null
          available: boolean
          city: string | null
          base_location: Json | null
          rating_avg: number | null
          rating_count: number
        }
        Insert: Partial<Database['public']['Tables']['vets']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['vets']['Row']>
        Relationships: []
      }
      clinics: {
        Row: {
          id: string
          name: string
          cnpj: string | null
          verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_INFO'
          verified_at: string | null
          verified_by: string | null
          verification_note: string | null
          address: string | null
          city: string | null
          location: Json | null
          about: string | null
          rating_avg: number | null
          rating_count: number
        }
        Insert: Partial<Database['public']['Tables']['clinics']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['clinics']['Row']>
        Relationships: []
      }
      specialties: {
        Row: {
          id: string
          name: string
          icon: string | null
          active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['specialties']['Row']>
        Update: Partial<Database['public']['Tables']['specialties']['Row']>
        Relationships: []
      }
      vet_specialties: {
        Row: {
          vet_id: string
          specialty_id: string
        }
        Insert: { vet_id: string; specialty_id: string }
        Update: Partial<{ vet_id: string; specialty_id: string }>
        Relationships: []
      }
      requests: {
        Row: {
          id: string
          clinic_id: string
          specialty_id: string | null
          type: string
          target_professional: 'VET' | 'AUXILIAR'
          description: string
          start_date: string | null
          end_date: string | null
          price: number | null
          urgent: boolean
          status: 'DRAFT' | 'OPEN' | 'FILLED' | 'CANCELED' | 'CLOSED'
          accepted_vet_id: string | null
          published_at: string | null
          moderation_status: 'VISIBLE' | 'HIDDEN'
          moderation_reason: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['requests']['Row']> & { clinic_id: string; description: string }
        Update: Partial<Database['public']['Tables']['requests']['Row']>
        Relationships: []
      }
      interests: {
        Row: {
          id: string
          request_id: string
          vet_id: string
          message: string | null
          status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['interests']['Row']>
        Update: Partial<Database['public']['Tables']['interests']['Row']>
        Relationships: []
      }
      invitations: {
        Row: {
          id: string
          request_id: string
          vet_id: string
          status: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['invitations']['Row']>
        Update: Partial<Database['public']['Tables']['invitations']['Row']>
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          request_id: string
          reviewer_id: string
          reviewed_id: string
          rating: number
          comment: string | null
          moderation_status: 'VISIBLE' | 'HIDDEN'
          moderation_reason: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['reviews']['Row']>
        Update: Partial<Database['public']['Tables']['reviews']['Row']>
        Relationships: []
      }
      vet_documents: {
        Row: {
          id: string
          vet_id: string
          document_type: string
          file_path: string
          file_name: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['vet_documents']['Row']>
        Update: Partial<Database['public']['Tables']['vet_documents']['Row']>
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          target_type: 'PROFILE' | 'REQUEST' | 'REVIEW'
          target_id: string
          reason: 'FAKE_PROFILE' | 'INAPPROPRIATE_CONTENT' | 'NO_SHOW' | 'PAYMENT_ISSUE' | 'HARASSMENT' | 'SPAM' | 'OTHER'
          description: string | null
          status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED'
          priority: 'LOW' | 'NORMAL' | 'HIGH'
          assigned_to: string | null
          resolution_note: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['reports']['Row']>
        Update: Partial<Database['public']['Tables']['reports']['Row']>
        Relationships: []
      }
      staff_notes: {
        Row: {
          id: string
          target_type: string
          target_id: string
          author_id: string
          body: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['staff_notes']['Row']>
        Update: Partial<Database['public']['Tables']['staff_notes']['Row']>
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          title: string
          body: string
          audience: Json
          url: string | null
          status: 'DRAFT' | 'SENT'
          recipients_count: number
          created_by: string
          sent_at: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['announcements']['Row']>
        Update: Partial<Database['public']['Tables']['announcements']['Row']>
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string
          actor_role: string | null
          action: string
          entity: string
          entity_id: string | null
          reason: string | null
          before: Json | null
          after: Json | null
          metadata: Json | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['audit_logs']['Row']>
        Update: never
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          user_id: string
          amount_cents: number
          type: 'PUBLICATION' | 'SUBSCRIPTION'
          method: string
          status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED'
          gateway_id: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['payments']['Row']>
        Update: Partial<Database['public']['Tables']['payments']['Row']>
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: 'TRIAL' | 'ACTIVE' | 'OVERDUE' | 'CANCELED'
          current_period_end: string | null
          trial_end: string | null
          method: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['subscriptions']['Row']>
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>
        Relationships: []
      }
      clinic_credits: {
        Row: {
          id: string
          clinic_id: string
          amount: number
          reason: string
          granted_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['clinic_credits']['Row']>
        Update: Partial<Database['public']['Tables']['clinic_credits']['Row']>
        Relationships: []
      }
      payment_events: {
        Row: {
          id: string
          gateway_id: string | null
          event_type: string
          status: 'PROCESSED' | 'ERROR' | 'PENDING'
          payload: Json | null
          error: string | null
          processed_at: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['payment_events']['Row']>
        Update: Partial<Database['public']['Tables']['payment_events']['Row']>
        Relationships: []
      }
      app_config: {
        Row: {
          key: string
          value: Json
          description: string | null
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['app_config']['Row']>
        Update: Partial<Database['public']['Tables']['app_config']['Row']>
        Relationships: []
      }
      pricing: {
        Row: {
          id: string
          key: string
          amount_cents: number
          title: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['pricing']['Row']>
        Update: Partial<Database['public']['Tables']['pricing']['Row']>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
    Functions: {
      admin_dashboard_metrics: {
        Args: {
          p_from?: string
          p_to?: string
        }
        Returns: Json
      }
      admin_search_users: {
        Args: {
          p_query?: string
          p_role?: string
          p_status?: string
          p_verification?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      admin_get_user: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
      admin_set_verification: {
        Args: {
          p_user_id: string
          p_status: string
          p_note?: string
        }
        Returns: boolean
      }
      admin_suspend_user: {
        Args: {
          p_user_id: string
          p_until: string
          p_reason: string
        }
        Returns: boolean
      }
      admin_ban_user: {
        Args: {
          p_user_id: string
          p_reason: string
        }
        Returns: boolean
      }
      admin_reactivate_user: {
        Args: {
          p_user_id: string
          p_reason: string
        }
        Returns: boolean
      }
      admin_update_user_fields: {
        Args: {
          p_user_id: string
          p_fields: Json
          p_reason: string
        }
        Returns: boolean
      }
      admin_set_request_moderation: {
        Args: {
          p_request_id: string
          p_status: string
          p_reason: string
        }
        Returns: boolean
      }
      admin_cancel_request: {
        Args: {
          p_request_id: string
          p_reason: string
          p_give_credit?: boolean
        }
        Returns: boolean
      }
      admin_set_review_moderation: {
        Args: {
          p_review_id: string
          p_status: string
          p_reason: string
        }
        Returns: boolean
      }
      admin_update_report: {
        Args: {
          p_report_id: string
          p_status?: string
          p_priority?: string
          p_assigned_to?: string
          p_note?: string
        }
        Returns: boolean
      }
      admin_add_note: {
        Args: {
          p_target_type: string
          p_target_id: string
          p_body: string
        }
        Returns: boolean
      }
      admin_grant_credits: {
        Args: {
          p_clinic_id: string
          p_amount: number
          p_reason: string
        }
        Returns: boolean
      }
      admin_extend_trial: {
        Args: {
          p_user_id: string
          p_days: number
          p_reason: string
        }
        Returns: boolean
      }
      admin_update_config: {
        Args: {
          p_key: string
          p_value: Json
          p_reason: string
        }
        Returns: boolean
      }
      admin_update_price: {
        Args: {
          p_key: string
          p_amount_cents: number
          p_reason: string
        }
        Returns: boolean
      }
      admin_upsert_specialty: {
        Args: {
          p_id?: string
          p_name: string
          p_icon?: string
          p_active?: boolean
        }
        Returns: string
      }
      admin_set_specialty_active: {
        Args: {
          p_id: string
          p_active: boolean
        }
        Returns: boolean
      }
      admin_create_announcement: {
        Args: {
          p_title: string
          p_body: string
          p_audience: Json
          p_url?: string
        }
        Returns: string
      }
      admin_send_announcement: {
        Args: {
          p_id: string
        }
        Returns: boolean
      }
      admin_list_audit: {
        Args: {
          p_filters?: Json
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
    }
  }
}
