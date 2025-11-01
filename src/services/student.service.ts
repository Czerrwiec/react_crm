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

    async getActiveStudents() {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('active', true)
            .order('last_name')

        if (error) throw error
        return data.map(mapStudent)
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
        // Przekształć camelCase → snake_case
        const { data, error } = await supabase
            .from('students')
            .insert({
                first_name: student.firstName,
                last_name: student.lastName,
                phone: student.phone,
                email: student.email,
                pkk_number: student.pkkNumber,
                city: student.city,
                instructor_id: student.instructorId,
                course_price: student.coursePrice,
                course_paid: student.coursePaid,
                theory_passed: student.theoryPassed,
                internal_exam_passed: student.internalExamPassed,
                is_supplementary_course: student.isSupplementaryCourse,
                car: student.car,
                active: student.active,
                total_hours_driven: student.totalHoursDriven,
                course_start_date: student.courseStartDate,
                notes: student.notes,
            })
            .select()
            .single()

        if (error) throw error
        return mapStudent(data)
    },

    async updateStudent(id: string, updates: Partial<Student>) {
        // Przekształć camelCase → snake_case
        const snakeCaseUpdates: any = {}

        if (updates.firstName !== undefined) snakeCaseUpdates.first_name = updates.firstName
        if (updates.lastName !== undefined) snakeCaseUpdates.last_name = updates.lastName
        if (updates.phone !== undefined) snakeCaseUpdates.phone = updates.phone
        if (updates.email !== undefined) snakeCaseUpdates.email = updates.email
        if (updates.pkkNumber !== undefined) snakeCaseUpdates.pkk_number = updates.pkkNumber
        if (updates.city !== undefined) snakeCaseUpdates.city = updates.city
        if (updates.instructorId !== undefined) snakeCaseUpdates.instructor_id = updates.instructorId
        if (updates.coursePrice !== undefined) snakeCaseUpdates.course_price = updates.coursePrice
        if (updates.coursePaid !== undefined) snakeCaseUpdates.course_paid = updates.coursePaid
        if (updates.theoryPassed !== undefined) snakeCaseUpdates.theory_passed = updates.theoryPassed
        if (updates.internalExamPassed !== undefined) snakeCaseUpdates.internal_exam_passed = updates.internalExamPassed
        if (updates.isSupplementaryCourse !== undefined) snakeCaseUpdates.is_supplementary_course = updates.isSupplementaryCourse
        if (updates.car !== undefined) snakeCaseUpdates.car = updates.car
        if (updates.active !== undefined) snakeCaseUpdates.active = updates.active
        if (updates.totalHoursDriven !== undefined) snakeCaseUpdates.total_hours_driven = updates.totalHoursDriven
        if (updates.courseStartDate !== undefined) snakeCaseUpdates.course_start_date = updates.courseStartDate
        if (updates.notes !== undefined) snakeCaseUpdates.notes = updates.notes

        const { data, error } = await supabase
            .from('students')
            .update(snakeCaseUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return mapStudent(data)
    },

    async deleteStudent(id: string) {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id)

        if (error) throw error
    },
}