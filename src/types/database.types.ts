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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          performed_by: string
          resource: string | null
          resource_id: string | null
          transaction_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          performed_by: string
          resource?: string | null
          resource_id?: string | null
          transaction_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          performed_by?: string
          resource?: string | null
          resource_id?: string | null
          transaction_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          created_at: string | null
          date: string
          end_time: string
          id: string
          model_id: string
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          model_id: string
          start_time: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          model_id?: string
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_status_history: {
        Row: {
          booking_id: string
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: string
          old_status: string | null
        }
        Insert: {
          booking_id: string
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: string
          old_status?: string | null
        }
        Update: {
          booking_id?: string
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: string
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          advance_amount: number | null
          amount: number | null
          booking_date: string | null
          booking_number: string
          client_id: string
          client_notes: string | null
          created_at: string | null
          end_date: string
          end_time: string | null
          event_type: string | null
          id: string
          location: string | null
          model_id: string
          model_notes: string | null
          number_of_models: number | null
          payment_status: string | null
          project_details: Json | null
          project_title: string
          project_type: string | null
          special_requirements: string | null
          start_date: string
          start_time: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          advance_amount?: number | null
          amount?: number | null
          booking_date?: string | null
          booking_number?: string
          client_id: string
          client_notes?: string | null
          created_at?: string | null
          end_date?: string
          end_time?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          model_id: string
          model_notes?: string | null
          number_of_models?: number | null
          payment_status?: string | null
          project_details?: Json | null
          project_title?: string
          project_type?: string | null
          special_requirements?: string | null
          start_date?: string
          start_time?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          advance_amount?: number | null
          amount?: number | null
          booking_date?: string | null
          booking_number?: string
          client_id?: string
          client_notes?: string | null
          created_at?: string | null
          end_date?: string
          end_time?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          model_id?: string
          model_notes?: string | null
          number_of_models?: number | null
          payment_status?: string | null
          project_details?: Json | null
          project_title?: string
          project_type?: string | null
          special_requirements?: string | null
          start_date?: string
          start_time?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      chat_attachments: {
        Row: {
          created_at: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          message_type: string
          room_id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          message_type?: string
          room_id: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          message_type?: string
          room_id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          booking_id: string | null
          client_id: string
          closed_at: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_message: string | null
          last_message_at: string | null
          last_message_id: string | null
          model_id: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          closed_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          last_message_id?: string | null
          model_id: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          closed_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          last_message_id?: string | null
          model_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_rooms_last_message"
            columns: ["last_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          created_at: string | null
          device_token: string
          id: string
          last_seen: string | null
          platform: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_token: string
          id?: string
          last_seen?: string | null
          platform: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_token?: string
          id?: string
          last_seen?: string | null
          platform?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          attempts: number | null
          body: string
          created_at: string | null
          error_message: string | null
          id: string
          last_attempt_at: string | null
          next_retry_at: string | null
          recipient_email: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          body: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          next_retry_at?: string | null
          recipient_email: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          body?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          next_retry_at?: string | null
          recipient_email?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          model_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          model_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          invoice_number: string
          invoice_url: string | null
          issued_at: string | null
          payment_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          invoice_number?: string
          invoice_url?: string | null
          issued_at?: string | null
          payment_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          invoice_number?: string
          invoice_url?: string | null
          issued_at?: string | null
          payment_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      model_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          model_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          model_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_categories_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      model_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_type: string
          document_url: string
          id: string
          is_verified: boolean | null
          model_id: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_type: string
          document_url: string
          id?: string
          is_verified?: boolean | null
          model_id: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_type?: string
          document_url?: string
          id?: string
          is_verified?: boolean | null
          model_id?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_documents_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      model_media: {
        Row: {
          caption: string | null
          category: string | null
          created_at: string | null
          id: string
          media_type: string | null
          media_url: string
          model_id: string
          sort_order: number | null
        }
        Insert: {
          caption?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url: string
          model_id: string
          sort_order?: number | null
        }
        Update: {
          caption?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string
          model_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "model_media_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      model_skills: {
        Row: {
          created_at: string | null
          id: string
          model_id: string
          skill_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_id: string
          skill_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          model_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_skills_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      model_social_links: {
        Row: {
          created_at: string | null
          id: string
          model_id: string
          platform: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_id: string
          platform: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          model_id?: string
          platform?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_social_links_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          age: number | null
          availabilityStatus: string | null
          biography: string | null
          chest: string | null
          city: string
          created_at: string | null
          email: string | null
          experience: string | null
          eyeColor: string | null
          gender: string | null
          hairColor: string | null
          height: number | null
          hips: string | null
          id: string
          instagramUrl: string | null
          isPremium: boolean | null
          languages: string[] | null
          measurements: Json | null
          name: string
          phone: string | null
          rating: number | null
          reviews_count: number | null
          shoeSize: string | null
          skinTone: string | null
          starting_price: number | null
          state: string
          subscription: Json | null
          updated_at: string | null
          userId: string
          videoUrl: string | null
          waist: string | null
        }
        Insert: {
          age?: number | null
          availabilityStatus?: string | null
          biography?: string | null
          chest?: string | null
          city: string
          created_at?: string | null
          email?: string | null
          experience?: string | null
          eyeColor?: string | null
          gender?: string | null
          hairColor?: string | null
          height?: number | null
          hips?: string | null
          id?: string
          instagramUrl?: string | null
          isPremium?: boolean | null
          languages?: string[] | null
          measurements?: Json | null
          name: string
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          shoeSize?: string | null
          skinTone?: string | null
          starting_price?: number | null
          state: string
          subscription?: Json | null
          updated_at?: string | null
          userId: string
          videoUrl?: string | null
          waist?: string | null
        }
        Update: {
          age?: number | null
          availabilityStatus?: string | null
          biography?: string | null
          chest?: string | null
          city?: string
          created_at?: string | null
          email?: string | null
          experience?: string | null
          eyeColor?: string | null
          gender?: string | null
          hairColor?: string | null
          height?: number | null
          hips?: string | null
          id?: string
          instagramUrl?: string | null
          isPremium?: boolean | null
          languages?: string[] | null
          measurements?: Json | null
          name?: string
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          shoeSize?: string | null
          skinTone?: string | null
          starting_price?: number | null
          state?: string
          subscription?: Json | null
          updated_at?: string | null
          userId?: string
          videoUrl?: string | null
          waist?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "models_userId_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          booking_enabled: boolean | null
          created_at: string | null
          email_enabled: boolean | null
          marketing_enabled: boolean | null
          payment_enabled: boolean | null
          push_enabled: boolean | null
          sms_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_enabled?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          marketing_enabled?: boolean | null
          payment_enabled?: boolean | null
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_enabled?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          marketing_enabled?: boolean | null
          payment_enabled?: boolean | null
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          delivery_status: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          notification_type: string
          read_at: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          delivery_status?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          delivery_status?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_status_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: string
          old_status: string | null
          payment_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: string
          old_status?: string | null
          payment_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: string
          old_status?: string | null
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_status_history_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          description: string | null
          id: string
          model_id: string | null
          payment_gateway: string | null
          session_id: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          model_id?: string | null
          payment_gateway?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          model_id?: string | null
          payment_gateway?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_images: {
        Row: {
          caption: string | null
          category: string | null
          created_at: string | null
          id: string
          image_url: string
          model_id: string
          sort_order: number | null
        }
        Insert: {
          caption?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          model_id: string
          sort_order?: number | null
        }
        Update: {
          caption?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          model_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_images_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatarUrl: string | null
          created_at: string | null
          email: string | null
          favorites: string[] | null
          id: string
          name: string | null
          phone: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatarUrl?: string | null
          created_at?: string | null
          email?: string | null
          favorites?: string[] | null
          id: string
          name?: string | null
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatarUrl?: string | null
          created_at?: string | null
          email?: string | null
          favorites?: string[] | null
          id?: string
          name?: string | null
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string | null
          gateway_refund_id: string | null
          id: string
          payment_id: string
          reason: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          gateway_refund_id?: string | null
          id?: string
          payment_id: string
          reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          gateway_refund_id?: string | null
          id?: string
          payment_id?: string
          reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      review_images: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          review_id: string
          sort_order: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          review_id: string
          sort_order?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          review_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string | null
          id: string
          reason: string
          reported_by: string
          review_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason: string
          reported_by: string
          review_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string
          reported_by?: string
          review_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_votes: {
        Row: {
          created_at: string | null
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          is_helpful?: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          client_id: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          is_hidden: boolean | null
          model_id: string
          moderated_by: string | null
          moderation_reason: string | null
          rating: number
          review: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_hidden?: boolean | null
          model_id: string
          moderated_by?: string | null
          moderation_reason?: string | null
          rating: number
          review: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_hidden?: boolean | null
          model_id?: string
          moderated_by?: string | null
          moderation_reason?: string | null
          rating?: number
          review?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          categoryId: string | null
          id: string
          name: string
        }
        Insert: {
          categoryId?: string | null
          id?: string
          name: string
        }
        Update: {
          categoryId?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string | null
          end_date: string | null
          id: string
          payment_id: string | null
          plan_name: string
          start_date: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          end_date?: string | null
          id?: string
          payment_id?: string | null
          plan_name: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          end_date?: string | null
          id?: string
          payment_id?: string | null
          plan_name?: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          failure_reason: string | null
          gateway: string
          gateway_order_id: string | null
          gateway_payment_id: string | null
          gateway_response: Json | null
          gateway_transaction_id: string | null
          id: string
          payment_id: string
          processed_at: string | null
          status: string
          transaction_reference: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          gateway?: string
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          payment_id: string
          processed_at?: string | null
          status?: string
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          gateway?: string
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          payment_id?: string
          processed_at?: string | null
          status?: string
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          last_login: string | null
          phone: string | null
          role: string
          status: string
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          last_login?: string | null
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          last_login?: string | null
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_recalculate_model_stats: {
        Args: { p_model_id: string }
        Returns: undefined
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
