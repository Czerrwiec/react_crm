import { supabase } from '@/lib/supabase'
import { mapLesson } from '@/lib/mappers'
import type { Lesson } from '@/types'

export const lessonService = {
    async getLessonsByInstructor(instructorId: string, month: Date) {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)

        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('instructor_id', instructorId)
            .gte('date', startOfMonth.toISOString().split('T')[0])
            .lte('date', endOfMonth.toISOString().split('T')[0])
            .order('date')
            .order('start_time')

        if (error) throw error
        return data.map(mapLesson)
    },

    async getAllLessons(month: Date) {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)

        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .gte('date', startOfMonth.toISOString().split('T')[0])
            .lte('date', endOfMonth.toISOString().split('T')[0])
            .order('date')
            .order('start_time')

        if (error) throw error
        return data.map(mapLesson)
    },

    async createLesson(lesson: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>) {
        const { data, error } = await supabase
            .from('lessons')
            .insert({
                student_ids: lesson.studentIds,
                instructor_id: lesson.instructorId,
                date: lesson.date,
                start_time: lesson.startTime,
                end_time: lesson.endTime,
                duration: lesson.duration,
                status: lesson.status,
                notes: lesson.notes,
            })
            .select()
            .single()

        if (error) throw error
        return mapLesson(data)
    },

    async updateLesson(id: string, updates: Partial<Lesson>) {
        const snakeCaseUpdates: any = {}

        if (updates.studentIds !== undefined) snakeCaseUpdates.student_ids = updates.studentIds
        if (updates.instructorId !== undefined) snakeCaseUpdates.instructor_id = updates.instructorId
        if (updates.date !== undefined) snakeCaseUpdates.date = updates.date
        if (updates.startTime !== undefined) snakeCaseUpdates.start_time = updates.startTime
        if (updates.endTime !== undefined) snakeCaseUpdates.end_time = updates.endTime
        if (updates.duration !== undefined) snakeCaseUpdates.duration = updates.duration
        if (updates.status !== undefined) snakeCaseUpdates.status = updates.status
        if (updates.notes !== undefined) snakeCaseUpdates.notes = updates.notes

        const { data, error } = await supabase
            .from('lessons')
            .update(snakeCaseUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return mapLesson(data)
    },

    async deleteLesson(id: string) {
        const { error } = await supabase
            .from('lessons')
            .delete()
            .eq('id', id)

        if (error) throw error
    },
}