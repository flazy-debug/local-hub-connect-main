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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      disputes: {
        Row: {
          admin_response: string | null
          buyer_id: string
          created_at: string
          id: string
          order_id: string
          reason: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          buyer_id: string
          created_at?: string
          id?: string
          order_id: string
          reason: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          buyer_id?: string
          created_at?: string
          id?: string
          order_id?: string
          reason?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          id: string
          seller_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          id?: string
          seller_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          id?: string
          seller_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          buyer_id: string | null
          buyer_name: string
          buyer_neighborhood: string
          buyer_phone: string
          created_at: string
          delivery_method: string
          id: string
          items: Json
          order_number: string
          seller_id: string
          shipping_proof_image: string | null
          shipping_proof_note: string | null
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          buyer_name: string
          buyer_neighborhood: string
          buyer_phone: string
          created_at?: string
          delivery_method?: string
          id?: string
          items?: Json
          order_number?: string
          seller_id: string
          shipping_proof_image?: string | null
          shipping_proof_note?: string | null
          status?: string
          total: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          buyer_name?: string
          buyer_neighborhood?: string
          buyer_phone?: string
          created_at?: string
          delivery_method?: string
          id?: string
          items?: Json
          order_number?: string
          seller_id?: string
          shipping_proof_image?: string | null
          shipping_proof_note?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          condition: string
          created_at: string
          delivery_available: boolean
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          name: string
          neighborhood: string
          pickup_address: string | null
          pickup_available: boolean
          price: number
          promo_price: number | null
          seller_id: string
          stock: number
          updated_at: string
        }
        Insert: {
          category: string
          condition?: string
          created_at?: string
          delivery_available?: boolean
          description?: string
          id?: string
          images?: string[] | null
          is_active?: boolean
          name: string
          neighborhood: string
          pickup_address?: string | null
          pickup_available?: boolean
          price: number
          promo_price?: number | null
          seller_id: string
          stock?: number
          updated_at?: string
        }
        Update: {
          category?: string
          condition?: string
          created_at?: string
          delivery_available?: boolean
          description?: string
          id?: string
          images?: string[] | null
          is_active?: boolean
          name?: string
          neighborhood?: string
          pickup_address?: string | null
          pickup_available?: boolean
          price?: number
          promo_price?: number | null
          seller_id?: string
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          facebook_url: string | null
          id: string
          instagram_url: string | null
          neighborhood: string | null
          phone: string | null
          pro_expires_at: string | null
          referral_code: string | null
          shop_description: string | null
          shop_name: string | null
          shop_slug: string | null
          subscription_type: string
          tiktok_url: string | null
          updated_at: string
          user_id: string
          verification_status: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          neighborhood?: string | null
          phone?: string | null
          pro_expires_at?: string | null
          referral_code?: string | null
          shop_description?: string | null
          shop_name?: string | null
          shop_slug?: string | null
          subscription_type?: string
          tiktok_url?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          neighborhood?: string | null
          phone?: string | null
          pro_expires_at?: string | null
          referral_code?: string | null
          shop_description?: string | null
          shop_name?: string | null
          shop_slug?: string | null
          subscription_type?: string
          tiktok_url?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_percent: number
          id: string
          is_active: boolean
          max_uses: number | null
          seller_id: string
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_percent?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          seller_id: string
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_percent?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          seller_id?: string
          uses_count?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      reviews: {
        Row: {
          buyer_id: string
          buyer_name: string
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
        }
        Insert: {
          buyer_id: string
          buyer_name: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
        }
        Update: {
          buyer_id?: string
          buyer_name?: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_total: number
          commission_fee: number
          created_at: string
          id: string
          order_id: string
          payment_gateway_ref: string | null
          seller_id: string
          seller_payout: number
          status: string
          updated_at: string
        }
        Insert: {
          amount_total: number
          commission_fee: number
          created_at?: string
          id?: string
          order_id: string
          payment_gateway_ref?: string | null
          seller_id: string
          seller_payout: number
          status?: string
          updated_at?: string
        }
        Update: {
          amount_total?: number
          commission_fee?: number
          created_at?: string
          id?: string
          order_id?: string
          payment_gateway_ref?: string | null
          seller_id?: string
          seller_payout?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "seller" | "buyer"
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
      app_role: ["admin", "moderator", "seller", "buyer"],
    },
  },
} as const
