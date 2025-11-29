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
    // Pobierz instruktorów
    const { data: instructors, error: instructorsError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'instructor')
        .order('last_name');

    if (instructorsError) throw instructorsError;

    // Pobierz wszystkich studentów
    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, instructor_ids');

    if (studentsError) throw studentsError;

    // Policz studentów dla każdego instruktora
    return instructors.map((instructor) => {
        const studentCount = students.filter(
            (student) => student.instructor_ids && student.instructor_ids.includes(instructor.id)
        ).length;

        return {
            ...mapUser(instructor),
            studentCount,
        };
    });
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
        // Wywołaj Edge Function
        const { data, error } = await supabase.functions.invoke('create-instructor-user', {
            body: {
                email: instructor.email,
                password: instructor.password,
                firstName: instructor.firstName,
                lastName: instructor.lastName,
                phone: instructor.phone,
            }
        })

        if (error) throw error
        if (!data?.success) throw new Error(data?.error || 'Failed to create instructor')

        return data.userId
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