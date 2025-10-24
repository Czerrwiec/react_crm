import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'

export const authService = {
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
        return data
    },

    async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    getCurrentUser() {
        return supabase.auth.getUser()
    },

    async getUserRole(): Promise<UserRole | null> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (error) throw error
        return data?.role as UserRole | null
    },

    onAuthStateChange(callback: (user: any) => void) {
        return supabase.auth.onAuthStateChange((_event, session) => {
            callback(session?.user ?? null)
        })
    },
}