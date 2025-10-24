import { supabase } from '@/lib/supabase'
import type { Student } from '@/types'
import { mapStudent, mapStudentWithInstructor } from '@/lib/mappers'

export const studentService = {
    async getStudents() {
        const { data, error } = await supabase
            .from('students')
            .select(`
        *,
        instructor:users!instructor_id(first_name, last_name)
      `)
            .order('last_name')

        if (error) throw error
        return data.map(mapStudentWithInstructor)
    },

    async getStudent(id: string) {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return mapStudent(data)
    },

    async createStudent(student: Omit<Student, 'id'>) {
        const { data, error } = await supabase
            .from('students')
            .insert(student)
            .select()
            .single()

        if (error) throw error
        return mapStudent(data)
    },

    async updateStudent(id: string, updates: Partial<Student>) {
        const { data, error } = await supabase
            .from('students')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return mapStudent(data)
    },
}