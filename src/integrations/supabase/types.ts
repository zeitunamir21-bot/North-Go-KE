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
      bookings: {
        Row: {
          booking_status: string
          created_at: string
          customer_name: string
          destination: string
          discount_amount: number
          id: string
          phone: string
          pickup_location: string
          promo_code: string | null
          seat_numbers: number[]
          seats: number
          status: string
          trip_id: string
          user_id: string | null
        }
        Insert: {
          booking_status?: string
          created_at?: string
          customer_name: string
          destination: string
          discount_amount?: number
          id?: string
          phone: string
          pickup_location: string
          promo_code?: string | null
          seat_numbers?: number[]
          seats?: number
          status?: string
          trip_id: string
          user_id?: string | null
        }
        Update: {
          booking_status?: string
          created_at?: string
          customer_name?: string
          destination?: string
          discount_amount?: number
          id?: string
          phone?: string
          pickup_location?: string
          promo_code?: string | null
          seat_numbers?: number[]
          seats?: number
          status?: string
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          approved_at: string | null
          created_at: string
          full_name: string
          id: string
          phone: string
          photos: string[]
          plate_number: string | null
          status: string
          user_id: string
          vehicle_name: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone: string
          photos?: string[]
          plate_number?: string | null
          status?: string
          user_id: string
          vehicle_name?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          photos?: string[]
          plate_number?: string | null
          status?: string
          user_id?: string
          vehicle_name?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          discount_amount: number | null
          discount_pct: number | null
          id: string
          max_uses: number | null
          updated_at: string
          uses: number
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_pct?: number | null
          id?: string
          max_uses?: number | null
          updated_at?: string
          uses?: number
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_pct?: number | null
          id?: string
          max_uses?: number | null
          updated_at?: string
          uses?: number
          valid_until?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          customer_name: string
          driver_id: string
          id: string
          stars: number
          trip_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_name: string
          driver_id: string
          id?: string
          stars: number
          trip_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_name?: string
          driver_id?: string
          id?: string
          stars?: number
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          available_seats: number
          created_at: string
          departure_time: string
          driver_name: string
          driver_phone: string
          id: string
          notes: string | null
          owner_id: string | null
          pickup_point: string
          price: number
          route: string
          status: string
          total_seats: number
          updated_at: string
          vehicle_name: string
        }
        Insert: {
          available_seats?: number
          created_at?: string
          departure_time: string
          driver_name?: string
          driver_phone: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          pickup_point: string
          price?: number
          route: string
          status?: string
          total_seats?: number
          updated_at?: string
          vehicle_name?: string
        }
        Update: {
          available_seats?: number
          created_at?: string
          departure_time?: string
          driver_name?: string
          driver_phone?: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          pickup_point?: string
          price?: number
          route?: string
          status?: string
          total_seats?: number
          updated_at?: string
          vehicle_name?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_promo: {
        Args: { p_code: string; p_subtotal: number }
        Returns: Json
      }
      cancel_booking: {
        Args: { p_booking_id: string }
        Returns: {
          booking_status: string
          created_at: string
          customer_name: string
          destination: string
          discount_amount: number
          id: string
          phone: string
          pickup_location: string
          promo_code: string | null
          seat_numbers: number[]
          seats: number
          status: string
          trip_id: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_booking_details: { Args: { p_booking_id: string }; Returns: Json }
      get_driver_public: { Args: { p_driver_id: string }; Returns: Json }
      get_driver_ratings_public: {
        Args: { p_driver_id: string }
        Returns: Json
      }
      get_my_bookings: { Args: never; Returns: Json }
      get_platform_stats: { Args: never; Returns: Json }
      get_taken_seats: { Args: { p_trip_id: string }; Returns: number[] }
      get_top_reviews: { Args: { p_limit?: number }; Returns: Json }
      get_trip_driver_public: { Args: { p_trip_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved_driver: { Args: { _user_id: string }; Returns: boolean }
      mask_name: { Args: { p_name: string }; Returns: string }
      redeem_promo: { Args: { p_code: string }; Returns: undefined }
      reserve_seats:
        | {
            Args: {
              p_customer_name: string
              p_destination: string
              p_phone: string
              p_pickup_location: string
              p_seats: number
              p_trip_id: string
            }
            Returns: {
              booking_status: string
              created_at: string
              customer_name: string
              destination: string
              discount_amount: number
              id: string
              phone: string
              pickup_location: string
              promo_code: string | null
              seat_numbers: number[]
              seats: number
              status: string
              trip_id: string
              user_id: string | null
            }
            SetofOptions: {
              from: "*"
              to: "bookings"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_customer_name: string
              p_destination: string
              p_phone: string
              p_pickup_location: string
              p_seat_numbers?: number[]
              p_seats: number
              p_trip_id: string
            }
            Returns: {
              booking_status: string
              created_at: string
              customer_name: string
              destination: string
              discount_amount: number
              id: string
              phone: string
              pickup_location: string
              promo_code: string | null
              seat_numbers: number[]
              seats: number
              status: string
              trip_id: string
              user_id: string | null
            }
            SetofOptions: {
              from: "*"
              to: "bookings"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_customer_name: string
              p_destination: string
              p_phone: string
              p_pickup_location: string
              p_seat_numbers: number[]
              p_seats: number
              p_trip_id: string
              p_user_id: string
            }
            Returns: {
              booking_status: string
              created_at: string
              customer_name: string
              destination: string
              discount_amount: number
              id: string
              phone: string
              pickup_location: string
              promo_code: string | null
              seat_numbers: number[]
              seats: number
              status: string
              trip_id: string
              user_id: string | null
            }
            SetofOptions: {
              from: "*"
              to: "bookings"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      reserve_seats_with_promo: {
        Args: {
          p_customer_name: string
          p_destination: string
          p_phone: string
          p_pickup_location: string
          p_promo_code: string
          p_seat_numbers: number[]
          p_seats: number
          p_subtotal: number
          p_trip_id: string
        }
        Returns: {
          booking_status: string
          created_at: string
          customer_name: string
          destination: string
          discount_amount: number
          id: string
          phone: string
          pickup_location: string
          promo_code: string | null
          seat_numbers: number[]
          seats: number
          status: string
          trip_id: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_rating: {
        Args: {
          p_booking_id: string
          p_comment: string
          p_customer_name: string
          p_driver_id: string
          p_stars: number
          p_trip_id: string
        }
        Returns: {
          comment: string | null
          created_at: string
          customer_name: string
          driver_id: string
          id: string
          stars: number
          trip_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "ratings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "user" | "driver"
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
      app_role: ["admin", "user", "driver"],
    },
  },
} as const
