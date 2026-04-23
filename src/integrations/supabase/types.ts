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
      reservation_email_jobs: {
        Row: {
          attempt_count: number
          created_at: string
          id: string
          job_type: Database["public"]["Enums"]["email_job_type"]
          last_error: string | null
          reservation_id: string
          restaurant_id: string
          scheduled_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["email_job_status"]
          to_email: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          id?: string
          job_type: Database["public"]["Enums"]["email_job_type"]
          last_error?: string | null
          reservation_id: string
          restaurant_id: string
          scheduled_at: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_job_status"]
          to_email: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          id?: string
          job_type?: Database["public"]["Enums"]["email_job_type"]
          last_error?: string | null
          reservation_id?: string
          restaurant_id?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_job_status"]
          to_email?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_email_jobs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_email_jobs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          email: string | null
          end_at: string
          guest_count: number
          id: string
          name: string
          phone: string | null
          restaurant_id: string
          start_at: string
          status: Database["public"]["Enums"]["reservation_status"]
          table_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          end_at: string
          guest_count: number
          id?: string
          name: string
          phone?: string | null
          restaurant_id: string
          start_at: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          end_at?: string
          guest_count?: number
          id?: string
          name?: string
          phone?: string | null
          restaurant_id?: string
          start_at?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_locations: {
        Row: {
          address: string | null
          contact_number: string | null
          created_at: string
          id: string
          label: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          label: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          label?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_locations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_members: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          capacity: number
          created_at: string
          id: string
          max_occupancy: number
          min_occupancy: number
          name: string
          restaurant_id: string
          table_number: number
          updated_at: string
        }
        Insert: {
          capacity: number
          created_at?: string
          id?: string
          max_occupancy: number
          min_occupancy: number
          name: string
          restaurant_id: string
          table_number: number
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          max_occupancy?: number
          min_occupancy?: number
          name?: string
          restaurant_id?: string
          table_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          brand_logo_url: string | null
          contact_number: string | null
          created_at: string
          id: string
          name: string
          table_admin_hash: string | null
          table_admin_salt: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          brand_logo_url?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          name: string
          table_admin_hash?: string | null
          table_admin_salt?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          brand_logo_url?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          name?: string
          table_admin_hash?: string | null
          table_admin_salt?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_restaurant_member: {
        Args: { _restaurant_id: string }
        Returns: boolean
      }
    }
    Enums: {
      email_job_status: "pending" | "sent" | "failed" | "cancelled"
      email_job_type: "reminder_1h"
      reservation_status: "booked" | "cancelled"
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
      email_job_status: ["pending", "sent", "failed", "cancelled"],
      email_job_type: ["reminder_1h"],
      reservation_status: ["booked", "cancelled"],
    },
  },
} as const
