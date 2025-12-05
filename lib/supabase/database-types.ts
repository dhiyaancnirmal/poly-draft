export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          fid: number | null
          display_name: string | null
          wallet_address: string | null
          username: string | null
          auth_method: 'farcaster' | 'wallet'
          avatar_url: string | null
          bio: string | null
          wins: number
          total_leagues: number
          total_points: number
          created_at: string
          updated_at: string
          last_active: string
        }
        Insert: {
          id?: string
          fid?: number | null
          display_name?: string | null
          wallet_address?: string | null
          username?: string | null
          auth_method?: 'farcaster' | 'wallet'
          avatar_url?: string | null
          bio?: string | null
          wins?: number
          total_leagues?: number
          total_points?: number
          created_at?: string
          updated_at?: string
          last_active?: string
        }
        Update: {
          id?: string
          fid?: number | null
          display_name?: string | null
          wallet_address?: string | null
          username?: string | null
          auth_method?: 'farcaster' | 'wallet'
          avatar_url?: string | null
          bio?: string | null
          wins?: number
          total_leagues?: number
          total_points?: number
          created_at?: string
          updated_at?: string
          last_active?: string
        }
      }
      leagues: {
        Row: {
          id: string
          on_chain_id: number | null
          name: string
          description: string | null
          creator_address: string
          creator_id: string | null
          creator_wallet: string | null
          max_players: number
          max_participants: number
          status: 'open' | 'drafting' | 'active' | 'ended' | 'cancelled'
          mode: 'social' | 'live' | 'competitive'
          draft_started_at: string | null
          draft_completed_at: string | null
          start_date: string
          end_date: string
          duration_periods: number
          picks_per_period: number
          price_per_market_cents: number
          total_buy_in_cents: number
          join_code: string
          type: 'daily' | 'weekly'
          created_by: string
          end_time: string
          pick_time_limit: number
          auto_pick_enabled: boolean
          market_categories: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          on_chain_id?: number | null
          name: string
          description?: string | null
          creator_address: string
          creator_id?: string | null
          creator_wallet?: string | null
          max_players?: number
          max_participants: number
          start_date: string
          end_date: string
          duration_periods: number
          picks_per_period: number
          price_per_market_cents?: number
          total_buy_in_cents: number
          join_code: string
          type: 'daily' | 'weekly'
          created_by: string
          status?: 'open' | 'drafting' | 'active' | 'ended' | 'cancelled'
          mode?: 'social' | 'live' | 'competitive'
          draft_started_at?: string | null
          draft_completed_at?: string | null
          end_time: string
          pick_time_limit?: number
          auto_pick_enabled?: boolean
          market_categories?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          on_chain_id?: number | null
          name?: string
          description?: string | null
          creator_address?: string
          creator_id?: string | null
          creator_wallet?: string | null
          max_players?: number
          max_participants?: number
          start_date?: string
          end_date?: string
          duration_periods?: number
          picks_per_period?: number
          price_per_market_cents?: number
          total_buy_in_cents?: number
          join_code?: string
          type?: 'daily' | 'weekly'
          created_by?: string
          status?: 'open' | 'drafting' | 'active' | 'ended' | 'cancelled'
          mode?: 'social' | 'live' | 'competitive'
          draft_started_at?: string | null
          draft_completed_at?: string | null
          end_time?: string
          pick_time_limit?: number
          auto_pick_enabled?: boolean
          market_categories?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      league_members: {
        Row: {
          id: string
          league_id: string
          user_id: string
          team_name: string | null
          wallet_address: string
          draft_order: number | null
          has_picked_current_round: boolean
          joined_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          league_id: string
          user_id: string
          team_name?: string | null
          wallet_address: string
          draft_order?: number | null
          has_picked_current_round?: boolean
          joined_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          user_id?: string
          team_name?: string | null
          wallet_address?: string
          draft_order?: number | null
          has_picked_current_round?: boolean
          joined_at?: string
          updated_at?: string
        }
      }
      markets: {
        Row: {
          id: string
          polymarket_id: string
          title: string
          description: string | null
          category: string | null
          subcategory: string | null
          tags: string[] | null
          end_time: string | null
          is_active: boolean
          is_resolved: boolean
          image_url: string | null
          volume: string
          liquidity: string
          created_at: string
          updated_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          polymarket_id: string
          title: string
          description?: string | null
          category?: string | null
          subcategory?: string | null
          tags?: string[] | null
          end_time?: string | null
          is_active?: boolean
          is_resolved?: boolean
          image_url?: string | null
          volume?: string
          liquidity?: string
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          polymarket_id?: string
          title?: string
          description?: string | null
          category?: string | null
          subcategory?: string | null
          tags?: string[] | null
          end_time?: string | null
          is_active?: boolean
          is_resolved?: boolean
          image_url?: string | null
          volume?: string
          liquidity?: string
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
      }
      outcomes: {
        Row: {
          id: string
          market_id: string
          side: 'YES' | 'NO'
          token_id: string | null
          current_price: string
          implied_probability: string
          volume: string
          liquidity: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          market_id: string
          side: 'YES' | 'NO'
          token_id?: string | null
          current_price?: string
          implied_probability?: string
          volume?: string
          liquidity?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          market_id?: string
          side?: 'YES' | 'NO'
          token_id?: string | null
          current_price?: string
          implied_probability?: string
          volume?: string
          liquidity?: string
          created_at?: string
          updated_at?: string
        }
      }
      market_resolutions: {
        Row: {
          id: string
          market_id: string
          winning_outcome: 'YES' | 'NO' | null
          final_price_yes: string | null
          final_price_no: string | null
          resolved_at: string
          resolution_source: 'polymarket' | 'manual' | 'oracle'
          confidence_score: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          market_id: string
          winning_outcome?: 'YES' | 'NO' | null
          final_price_yes?: string | null
          final_price_no?: string | null
          resolved_at?: string
          resolution_source?: 'polymarket' | 'manual' | 'oracle'
          confidence_score?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          market_id?: string
          winning_outcome?: 'YES' | 'NO' | null
          final_price_yes?: string | null
          final_price_no?: string | null
          resolved_at?: string
          resolution_source?: 'polymarket' | 'manual' | 'oracle'
          confidence_score?: string | null
          notes?: string | null
        }
      }
      draft_state: {
        Row: {
          id: string
          league_id: string
          current_pick_number: number
          current_round: number
          current_user_id: string | null
          time_remaining: number | null
          is_paused: boolean
          is_completed: boolean
          total_rounds: number | null
          picks_per_round: number
          draft_type: 'snake' | 'linear' | 'auction'
          last_activity: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          league_id: string
          current_pick_number?: number
          current_round?: number
          current_user_id?: string | null
          time_remaining?: number | null
          is_paused?: boolean
          is_completed?: boolean
          total_rounds?: number | null
          picks_per_round?: number
          draft_type?: 'snake' | 'linear' | 'auction'
          last_activity?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          current_pick_number?: number
          current_round?: number
          current_user_id?: string | null
          time_remaining?: number | null
          is_paused?: boolean
          is_completed?: boolean
          total_rounds?: number | null
          picks_per_round?: number
          draft_type?: 'snake' | 'linear' | 'auction'
          last_activity?: string
          created_at?: string
          updated_at?: string
        }
      }
      picks: {
        Row: {
          id: string
          league_id: string
          user_id: string
          wallet_address: string
          market_id: string
          outcome_id: string
          market_id_text: string
          outcome_side: 'YES' | 'NO'
          round: number
          pick_number: number
          draft_order: number | null
          resolved: boolean
          correct: boolean | null
          points_earned: number
          picked_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          league_id: string
          user_id: string
          wallet_address: string
          market_id: string
          outcome_id: string
          market_id_text: string
          outcome_side: 'YES' | 'NO'
          round: number
          pick_number: number
          draft_order?: number | null
          resolved?: boolean
          correct?: boolean | null
          points_earned?: number
          picked_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          league_id?: string
          user_id?: string
          wallet_address?: string
          market_id?: string
          outcome_id?: string
          market_id_text?: string
          outcome_side?: 'YES' | 'NO'
          round?: number
          pick_number?: number
          draft_order?: number | null
          resolved?: boolean
          correct?: boolean | null
          points_earned?: number
          picked_at?: string
          resolved_at?: string | null
        }
      }
      scores: {
        Row: {
          id: string
          league_id: string
          user_id: string
          wallet_address: string
          points: number
          rank: number | null
          is_winner: boolean
          correct_picks: number
          total_picks: number
          average_pick_time: number | null
          best_streak: number
          current_streak: number
          updated_at: string
        }
        Insert: {
          id?: string
          league_id: string
          user_id: string
          wallet_address: string
          points?: number
          rank?: number | null
          is_winner?: boolean
          correct_picks?: number
          total_picks?: number
          average_pick_time?: number | null
          best_streak?: number
          current_streak?: number
          updated_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          user_id?: string
          wallet_address?: string
          points?: number
          rank?: number | null
          is_winner?: boolean
          correct_picks?: number
          total_picks?: number
          average_pick_time?: number | null
          best_streak?: number
          current_streak?: number
          updated_at?: string
        }
      }
      draft_transactions: {
        Row: {
          id: string
          league_id: string
          user_id: string
          transaction_type: 'pick' | 'skip' | 'auto_pick' | 'join' | 'leave' | 'pause' | 'resume'
          data: Json | null
          pick_number: number | null
          round: number | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          league_id: string
          user_id: string
          transaction_type: 'pick' | 'skip' | 'auto_pick' | 'join' | 'leave' | 'pause' | 'resume'
          data?: Json | null
          pick_number?: number | null
          round?: number | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          user_id?: string
          transaction_type?: 'pick' | 'skip' | 'auto_pick' | 'join' | 'leave' | 'pause' | 'resume'
          data?: Json | null
          pick_number?: number | null
          round?: number | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      user_presence: {
        Row: {
          id: string
          league_id: string
          user_id: string
          is_online: boolean
          is_drafting: boolean
          last_seen: string
          session_id: string | null
        }
        Insert: {
          id?: string
          league_id: string
          user_id: string
          is_online?: boolean
          is_drafting?: boolean
          last_seen?: string
          session_id?: string | null
        }
        Update: {
          id?: string
          league_id?: string
          user_id?: string
          is_online?: boolean
          is_drafting?: boolean
          last_seen?: string
          session_id?: string | null
        }
      }
    }
    Views: {
      league_standings: {
        Row: {
          league_id: string
          league_name: string
          user_id: string
          display_name: string | null
          wallet_address: string | null
          points: number | null
          rank: number | null
          correct_picks: number | null
          total_picks: number | null
          is_winner: boolean | null
          joined_at: string
          draft_order: number | null
        }
      }
      user_statistics: {
        Row: {
          id: string
          display_name: string | null
          wallet_address: string | null
          wins: number
          total_leagues: number
          total_points: number
          active_leagues: number
          total_picks_made: number
          correct_predictions: number
          accuracy_percentage: number | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types for commonly used table types
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type League = Database['public']['Tables']['leagues']['Row']
export type LeagueInsert = Database['public']['Tables']['leagues']['Insert']
export type LeagueUpdate = Database['public']['Tables']['leagues']['Update']

export type LeagueMember = Database['public']['Tables']['league_members']['Row']
export type LeagueMemberInsert = Database['public']['Tables']['league_members']['Insert']
export type LeagueMemberUpdate = Database['public']['Tables']['league_members']['Update']

export type Market = Database['public']['Tables']['markets']['Row']
export type MarketInsert = Database['public']['Tables']['markets']['Insert']
export type MarketUpdate = Database['public']['Tables']['markets']['Update']

export type Outcome = Database['public']['Tables']['outcomes']['Row']
export type OutcomeInsert = Database['public']['Tables']['outcomes']['Insert']
export type OutcomeUpdate = Database['public']['Tables']['outcomes']['Update']

export type MarketResolution = Database['public']['Tables']['market_resolutions']['Row']
export type MarketResolutionInsert = Database['public']['Tables']['market_resolutions']['Insert']
export type MarketResolutionUpdate = Database['public']['Tables']['market_resolutions']['Update']

export type DraftState = Database['public']['Tables']['draft_state']['Row']
export type DraftStateInsert = Database['public']['Tables']['draft_state']['Insert']
export type DraftStateUpdate = Database['public']['Tables']['draft_state']['Update']

export type Pick = Database['public']['Tables']['picks']['Row']
export type PickInsert = Database['public']['Tables']['picks']['Insert']
export type PickUpdate = Database['public']['Tables']['picks']['Update']

export type Score = Database['public']['Tables']['scores']['Row']
export type ScoreInsert = Database['public']['Tables']['scores']['Insert']
export type ScoreUpdate = Database['public']['Tables']['scores']['Update']

export type DraftTransaction = Database['public']['Tables']['draft_transactions']['Row']
export type DraftTransactionInsert = Database['public']['Tables']['draft_transactions']['Insert']
export type DraftTransactionUpdate = Database['public']['Tables']['draft_transactions']['Update']

export type UserPresence = Database['public']['Tables']['user_presence']['Row']
export type UserPresenceInsert = Database['public']['Tables']['user_presence']['Insert']
export type UserPresenceUpdate = Database['public']['Tables']['user_presence']['Update']

// View types
export type LeagueStandings = Database['public']['Views']['league_standings']['Row']
export type UserStatistics = Database['public']['Views']['user_statistics']['Row']

// Union types for enum values
export type LeagueStatus = League['status']
export type LeagueMode = League['mode']
export type AuthMethod = User['auth_method']
export type OutcomeSide = Outcome['side']
export type DraftType = DraftState['draft_type']
export type TransactionType = DraftTransaction['transaction_type']
export type ResolutionSource = MarketResolution['resolution_source']