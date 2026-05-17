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
      academies: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          code: string
          description: string | null
          icon: string | null
          id: string
          rarity: string | null
          title: string
          xp: number | null
        }
        Insert: {
          code: string
          description?: string | null
          icon?: string | null
          id?: string
          rarity?: string | null
          title: string
          xp?: number | null
        }
        Update: {
          code?: string
          description?: string | null
          icon?: string | null
          id?: string
          rarity?: string | null
          title?: string
          xp?: number | null
        }
        Relationships: []
      }
      ai_memories: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          importance: number | null
          is_active: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          importance?: number | null
          is_active?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          importance?: number | null
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          academy_id: string | null
          body_fat: number | null
          chest: number | null
          created_at: string | null
          hips: number | null
          id: string
          muscle_mass: number | null
          notes: string | null
          professor_feedback: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          waist: number | null
          weight: number | null
        }
        Insert: {
          academy_id?: string | null
          body_fat?: number | null
          chest?: number | null
          created_at?: string | null
          hips?: number | null
          id?: string
          muscle_mass?: number | null
          notes?: string | null
          professor_feedback?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          waist?: number | null
          weight?: number | null
        }
        Update: {
          academy_id?: string | null
          body_fat?: number | null
          chest?: number | null
          created_at?: string | null
          hips?: number | null
          id?: string
          muscle_mass?: number | null
          notes?: string | null
          professor_feedback?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          waist?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          ai_suggested: boolean | null
          created_at: string
          ends_at: string | null
          id: string
          notes: string | null
          starts_at: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          ai_suggested?: boolean | null
          created_at?: string
          ends_at?: string | null
          id?: string
          notes?: string | null
          starts_at: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          ai_suggested?: boolean | null
          created_at?: string
          ends_at?: string | null
          id?: string
          notes?: string | null
          starts_at?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      coaches: {
        Row: {
          avatar_url: string | null
          bio: string | null
          certifications: string[] | null
          created_at: string
          hourly_price: number | null
          id: string
          name: string
          rating: number | null
          specialty: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          hourly_price?: number | null
          id?: string
          name: string
          rating?: number | null
          specialty: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          hourly_price?: number | null
          id?: string
          name?: string
          rating?: number | null
          specialty?: string
        }
        Relationships: []
      }
      community_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          order_index: number
          sets: Json
          training_log_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          order_index: number
          sets: Json
          training_log_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          order_index?: number
          sets?: Json
          training_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_training_log_id_fkey"
            columns: ["training_log_id"]
            isOneToOne: false
            referencedRelation: "training_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          equipment_required: string[] | null
          id: string
          muscle_group: string
          name: string
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          equipment_required?: string[] | null
          id?: string
          muscle_group: string
          name: string
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          equipment_required?: string[] | null
          id?: string
          muscle_group?: string
          name?: string
          video_url?: string | null
        }
        Relationships: []
      }
      hammer_goals: {
        Row: {
          created_at: string
          created_by: string | null
          current_value: number
          end_date: string | null
          id: string
          sector_id: string | null
          start_date: string
          target_value: number
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_value?: number
          end_date?: string | null
          id?: string
          sector_id?: string | null
          start_date?: string
          target_value?: number
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_value?: number
          end_date?: string | null
          id?: string
          sector_id?: string | null
          start_date?: string
          target_value?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "hammer_goals_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "hammer_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      hammer_notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hammer_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          position: string | null
          sector_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          position?: string | null
          sector_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          position?: string | null
          sector_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hammer_profiles_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "hammer_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      hammer_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["hammer_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["hammer_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["hammer_role"]
          user_id?: string
        }
        Relationships: []
      }
      hammer_sales: {
        Row: {
          client_name: string
          commission: number | null
          created_at: string
          created_by: string | null
          employee_id: string | null
          id: string
          plan: string | null
          sale_date: string
          value: number
        }
        Insert: {
          client_name: string
          commission?: number | null
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          id?: string
          plan?: string | null
          sale_date?: string
          value?: number
        }
        Update: {
          client_name?: string
          commission?: number | null
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          id?: string
          plan?: string | null
          sale_date?: string
          value?: number
        }
        Relationships: []
      }
      hammer_sectors: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      hammer_tasks: {
        Row: {
          approved: boolean | null
          approved_by: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          feedback: string | null
          id: string
          photo_url: string | null
          priority: string
          rejection_note: string | null
          sector_id: string | null
          status: string
          title: string
        }
        Insert: {
          approved?: boolean | null
          approved_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          feedback?: string | null
          id?: string
          photo_url?: string | null
          priority?: string
          rejection_note?: string | null
          sector_id?: string | null
          status?: string
          title: string
        }
        Update: {
          approved?: boolean | null
          approved_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          feedback?: string | null
          id?: string
          photo_url?: string | null
          priority?: string
          rejection_note?: string | null
          sector_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "hammer_tasks_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "hammer_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      hydration_logs: {
        Row: {
          id: string
          logged_at: string
          ml: number
          user_id: string
        }
        Insert: {
          id?: string
          logged_at?: string
          ml: number
          user_id: string
        }
        Update: {
          id?: string
          logged_at?: string
          ml?: number
          user_id?: string
        }
        Relationships: []
      }
      live_participants: {
        Row: {
          joined_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          coach_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          scheduled_at: string
          status: string | null
          stream_url: string | null
          title: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          scheduled_at: string
          status?: string | null
          stream_url?: string | null
          title: string
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          scheduled_at?: string
          status?: string | null
          stream_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string
          fats: number | null
          food_name: string | null
          id: string
          photo_url: string | null
          protein: number | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fats?: number | null
          food_name?: string | null
          id?: string
          photo_url?: string | null
          protein?: number | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fats?: number | null
          food_name?: string | null
          id?: string
          photo_url?: string | null
          protein?: number | null
          user_id?: string
        }
        Relationships: []
      }
      neural_metrics: {
        Row: {
          adaptation_potential: number | null
          created_at: string
          fitness_score: number | null
          id: string
          recovery_score: number | null
          risk_analysis: string | null
          user_id: string
        }
        Insert: {
          adaptation_potential?: number | null
          created_at?: string
          fitness_score?: number | null
          id?: string
          recovery_score?: number | null
          risk_analysis?: string | null
          user_id: string
        }
        Update: {
          adaptation_potential?: number | null
          created_at?: string
          fitness_score?: number | null
          id?: string
          recovery_score?: number | null
          risk_analysis?: string | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_data: {
        Row: {
          created_at: string
          dietary_habits: string | null
          equipment: string[] | null
          experience_level: string | null
          goal: string | null
          id: string
          injuries: string[] | null
          sleep_quality: number | null
          stress_level: number | null
          user_id: string
          weekly_availability: number | null
        }
        Insert: {
          created_at?: string
          dietary_habits?: string | null
          equipment?: string[] | null
          experience_level?: string | null
          goal?: string | null
          id?: string
          injuries?: string[] | null
          sleep_quality?: number | null
          stress_level?: number | null
          user_id: string
          weekly_availability?: number | null
        }
        Update: {
          created_at?: string
          dietary_habits?: string | null
          equipment?: string[] | null
          experience_level?: string | null
          goal?: string | null
          id?: string
          injuries?: string[] | null
          sleep_quality?: number | null
          stress_level?: number | null
          user_id?: string
          weekly_availability?: number | null
        }
        Relationships: []
      }
      periodization_phases: {
        Row: {
          created_at: string
          ends_on: string
          focus: string | null
          id: string
          intensity: string | null
          notes: string | null
          phase_name: string
          starts_on: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          focus?: string | null
          id?: string
          intensity?: string | null
          notes?: string | null
          phase_name: string
          starts_on: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          focus?: string | null
          id?: string
          intensity?: string | null
          notes?: string | null
          phase_name?: string
          starts_on?: string
          user_id?: string
        }
        Relationships: []
      }
      physical_assessments: {
        Row: {
          ai_summary: string | null
          alignment_score: number | null
          asymmetries: Json | null
          created_at: string
          findings: Json | null
          frontal_url: string | null
          generated_plan_id: string | null
          id: string
          lateral_url: string | null
          posterior_url: string | null
          posture_grade: string | null
          recommendations: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          alignment_score?: number | null
          asymmetries?: Json | null
          created_at?: string
          findings?: Json | null
          frontal_url?: string | null
          generated_plan_id?: string | null
          id?: string
          lateral_url?: string | null
          posterior_url?: string | null
          posture_grade?: string | null
          recommendations?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          alignment_score?: number | null
          asymmetries?: Json | null
          created_at?: string
          findings?: Json | null
          frontal_url?: string | null
          generated_plan_id?: string | null
          id?: string
          lateral_url?: string | null
          posterior_url?: string | null
          posture_grade?: string | null
          recommendations?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          academy_id: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          academy_id?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          academy_id?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_logs: {
        Row: {
          bedtime: string | null
          created_at: string
          hours: number
          id: string
          notes: string | null
          quality: number | null
          recorded_for: string
          user_id: string
          wake_time: string | null
        }
        Insert: {
          bedtime?: string | null
          created_at?: string
          hours: number
          id?: string
          notes?: string | null
          quality?: number | null
          recorded_for?: string
          user_id: string
          wake_time?: string | null
        }
        Update: {
          bedtime?: string | null
          created_at?: string
          hours?: number
          id?: string
          notes?: string | null
          quality?: number | null
          recorded_for?: string
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      training_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          mood: string | null
          readiness_score: number | null
          started_at: string
          status: string | null
          total_volume: number | null
          user_id: string
          workout_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mood?: string | null
          readiness_score?: number | null
          started_at?: string
          status?: string | null
          total_volume?: number | null
          user_id: string
          workout_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mood?: string | null
          readiness_score?: number | null
          started_at?: string
          status?: string | null
          total_volume?: number | null
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          academy_id: string | null
          created_at: string
          goal: string | null
          id: string
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          academy_id?: string | null
          created_at?: string
          goal?: string | null
          id?: string
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          academy_id?: string | null
          created_at?: string
          goal?: string | null
          id?: string
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_fatigue_status: {
        Row: {
          fatigue_score: number | null
          id: string
          last_calculation: string
          neural_adaptation_rate: number | null
          overtraining_risk: string | null
          readiness_score: number | null
          recovery_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          fatigue_score?: number | null
          id?: string
          last_calculation?: string
          neural_adaptation_rate?: number | null
          overtraining_risk?: string | null
          readiness_score?: number | null
          recovery_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          fatigue_score?: number | null
          id?: string
          last_calculation?: string
          neural_adaptation_rate?: number | null
          overtraining_risk?: string | null
          readiness_score?: number | null
          recovery_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          expires_at: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wearable_data: {
        Row: {
          calories: number | null
          created_at: string
          heart_rate_avg: number | null
          hrv_ms: number | null
          id: string
          recorded_for: string
          sleep_minutes: number | null
          source: string
          steps: number | null
          user_id: string
          vo2max: number | null
        }
        Insert: {
          calories?: number | null
          created_at?: string
          heart_rate_avg?: number | null
          hrv_ms?: number | null
          id?: string
          recorded_for?: string
          sleep_minutes?: number | null
          source?: string
          steps?: number | null
          user_id: string
          vo2max?: number | null
        }
        Update: {
          calories?: number | null
          created_at?: string
          heart_rate_avg?: number | null
          hrv_ms?: number | null
          id?: string
          recorded_for?: string
          sleep_minutes?: number | null
          source?: string
          steps?: number | null
          user_id?: string
          vo2max?: number | null
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          rest_seconds: number | null
          target_reps_range: string | null
          target_rpe: number | null
          target_sets: number
          workout_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          order_index: number
          rest_seconds?: number | null
          target_reps_range?: string | null
          target_rpe?: number | null
          target_sets: number
          workout_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          rest_seconds?: number | null
          target_reps_range?: string | null
          target_rpe?: number | null
          target_sets?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_progress: {
        Row: {
          academy_id: string | null
          completed_at: string | null
          duration_minutes: number | null
          effort_rating: number | null
          id: string
          notes: string | null
          user_id: string | null
          workout_id: string | null
        }
        Insert: {
          academy_id?: string | null
          completed_at?: string | null
          duration_minutes?: number | null
          effort_rating?: number | null
          id?: string
          notes?: string | null
          user_id?: string | null
          workout_id?: string | null
        }
        Update: {
          academy_id?: string | null
          completed_at?: string | null
          duration_minutes?: number | null
          effort_rating?: number | null
          id?: string
          notes?: string | null
          user_id?: string | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_progress_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_progress_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          academy_id: string | null
          created_at: string
          day_index: number | null
          id: string
          phase: string | null
          title: string
          training_plan_id: string
        }
        Insert: {
          academy_id?: string | null
          created_at?: string
          day_index?: number | null
          id?: string
          phase?: string | null
          title: string
          training_plan_id: string
        }
        Update: {
          academy_id?: string | null
          created_at?: string
          day_index?: number | null
          id?: string
          phase?: string | null
          title?: string
          training_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_training_plan_id_fkey"
            columns: ["training_plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      hammer_has_role: {
        Args: {
          _role: Database["public"]["Enums"]["hammer_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      hammer_role: "admin" | "employee"
      user_role: "admin" | "professor" | "aluno"
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
      hammer_role: ["admin", "employee"],
      user_role: ["admin", "professor", "aluno"],
    },
  },
} as const
