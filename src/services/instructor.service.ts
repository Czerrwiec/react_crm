import { supabase } from '@/lib/supabase'
import { mapUser } from '@/lib/mappers'
import type { User } from '@/types'

export const instructorService = {
    async getInstructors() {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'instructor')
            // .eq('active', true)
            .order('last_name')

        if (error) throw error
        return data.map(mapUser)
    },

    async getAllInstructors() {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'instructor')
            .order('last_name')

        if (error) throw error
        return data.map(mapUser)
    },

    async getInstructorWithStudentCount() {
        const { data, error } = await supabase
            .from('users')
            .select(`*,students:students!students_instructor_id_fkey(count)`)
            .eq('role', 'instructor')
            .order('last_name')

        if (error) throw error

        return data.map((instructor) => ({
            ...mapUser(instructor),
            studentCount: instructor.students?.[0]?.count || 0,
        }))
    },

    async getInstructor(id: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return mapUser(data)
    },

    async createInstructor(instructor: {
        email: string
        password: string
        firstName: string
        lastName: string
        phone?: string
    }) {
        // Uwaga: To wymaga Edge Function lub Admin API
        // Na razie placeholder - zaimplementuj według Twojego backendu
        const { data, error } = await supabase.auth.signUp({
            email: instructor.email,
            password: instructor.password,
        })

        if (error) throw error
        if (!data.user) throw new Error('Failed to create user')

        // Dodaj do tabeli users
        await supabase.rpc('create_instructor', {
            p_user_id: data.user.id,
            p_email: instructor.email,
            p_first_name: instructor.firstName,
            p_last_name: instructor.lastName,
            p_phone: instructor.phone || null,
        })

        return data.user.id
    },

    async updateInstructor(id: string, updates: Partial<User>) {
        const snakeCaseUpdates: any = {}

        if (updates.firstName !== undefined) snakeCaseUpdates.first_name = updates.firstName
        if (updates.lastName !== undefined) snakeCaseUpdates.last_name = updates.lastName
        if (updates.phone !== undefined) snakeCaseUpdates.phone = updates.phone
        if (updates.email !== undefined) snakeCaseUpdates.email = updates.email
        if (updates.active !== undefined) snakeCaseUpdates.active = updates.active

        const { data, error } = await supabase
            .from('users')
            .update(snakeCaseUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return mapUser(data)
    },

    async deleteInstructor(id: string) {
        // Sprawdź czy ma aktywnych kursantów
        const { data: students } = await supabase
            .from('students')
            .select('id')
            .eq('instructor_id', id)
            .eq('active', true)

        if (students && students.length > 0) {
            throw new Error('Nie można usunąć instruktora, który ma aktywnych kursantów')
        }

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)

        if (error) throw error
    },
}