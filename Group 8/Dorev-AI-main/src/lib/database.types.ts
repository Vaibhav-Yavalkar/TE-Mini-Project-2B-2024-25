export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          gmb_location_id: string | null
          place_id: string | null
          address: string | null
          phone: string | null
          email: string | null
          website: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"] | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          gmb_location_id?: string | null
          place_id?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"] | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          gmb_location_id?: string | null
          place_id?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"] | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          business_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          is_active: boolean | null
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          business_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          business_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      review_collection_settings: {
        Row: {
          id: number
          business_name: string | null
          google_place_id: string | null
          discount_code: string | null
          discount_amount: string | null
          discount_type: string | null
          primary_color: string | null
          logo_url: string | null
          redirect_to_google: boolean | null
          send_email_coupon: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: number
          business_name?: string | null
          google_place_id?: string | null
          discount_code?: string | null
          discount_amount?: string | null
          discount_type?: string | null
          primary_color?: string | null
          logo_url?: string | null
          redirect_to_google?: boolean | null
          send_email_coupon?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          business_name?: string | null
          google_place_id?: string | null
          discount_code?: string | null
          discount_amount?: string | null
          discount_type?: string | null
          primary_color?: string | null
          logo_url?: string | null
          redirect_to_google?: boolean | null
          send_email_coupon?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          rating: number
          content: string
          customer_name: string
          customer_email: string
          customer_phone: string
          date: string
          sentiment: Database["public"]["Enums"]["review_sentiment"]
          is_public: boolean
          business_id: string
          created_at: string
          updated_at: string
          resolved: boolean
          response: string | null
          coupon_code: string | null
        }
        Insert: {
          id?: string
          rating: number
          content: string
          customer_name: string
          customer_email: string
          customer_phone: string
          date: string
          sentiment: Database["public"]["Enums"]["review_sentiment"]
          is_public?: boolean
          business_id: string
          created_at?: string
          updated_at?: string
          resolved?: boolean
          response?: string | null
          coupon_code?: string | null
        }
        Update: {
          id?: string
          rating?: number
          content?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          date?: string
          sentiment?: Database["public"]["Enums"]["review_sentiment"]
          is_public?: boolean
          business_id?: string
          created_at?: string
          updated_at?: string
          resolved?: boolean
          response?: string | null
          coupon_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      session_logs: {
        Row: {
          id: string
          user_id: string
          business_id: string | null
          action: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id?: string | null
          action: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string | null
          action?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      qr_codes: {
        Row: {
          id: string
          business_id: string
          name: string
          url: string
          scans_count: number
          created_at: string
          updated_at: string
          expires_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          url: string
          scans_count?: number
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          url?: string
          scans_count?: number
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          is_active?: boolean
        }
      }
    }
    Views: {
      business_overview: {
        Row: {
          business_id: string | null
          business_name: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"] | null
          is_active: boolean | null
          total_users: number | null
          primary_color: string | null
          send_discount_codes: boolean | null
          auto_respond_to_reviews: boolean | null
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          user_id: string | null
          full_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          business_id: string | null
          business_name: string | null
          last_login: string | null
          total_actions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      review_sentiment: "positive" | "neutral" | "negative"
      subscription_tier: "free" | "basic" | "premium" | "enterprise"
      user_role: "super_admin" | "business_owner" | "staff"
    }
  }
}