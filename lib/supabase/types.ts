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
                    created_at: string
                    email: string | null
                    display_name: string | null
                    wallet_address: string | null
                    fid: number | null
                    auth_method: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    email?: string | null
                    display_name?: string | null
                    wallet_address?: string | null
                    fid?: number | null
                    auth_method?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    email?: string | null
                    display_name?: string | null
                    wallet_address?: string | null
                    fid?: number | null
                    auth_method?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
