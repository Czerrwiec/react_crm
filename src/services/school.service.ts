import { supabase } from '@/lib/supabase'
import { mapSchoolInfo } from '@/lib/mappers'
import type { SchoolInfo } from '@/types'

export const schoolService = {
    async getSchoolInfo() {
        const { data, error } = await supabase
            .from('school_info')
            .select('*')
            .limit(1)
            .single()

        if (error) throw error
        return mapSchoolInfo(data)
    },

    async updateSchoolInfo(updates: Partial<SchoolInfo>) {
        // Najpierw pobierz ID
        const { data: existingData, error: fetchError } = await supabase
            .from('school_info')
            .select('id')
            .limit(1)
            .single()

        if (fetchError) throw fetchError

        const snakeCaseUpdates: any = {}

        if (updates.nip !== undefined) snakeCaseUpdates.nip = updates.nip
        if (updates.name !== undefined) snakeCaseUpdates.name = updates.name
        if (updates.city !== undefined) snakeCaseUpdates.city = updates.city
        if (updates.street !== undefined) snakeCaseUpdates.street = updates.street
        if (updates.postalCode !== undefined) snakeCaseUpdates.postal_code = updates.postalCode
        if (updates.phone !== undefined) snakeCaseUpdates.phone = updates.phone

        snakeCaseUpdates.updated_at = new Date().toISOString()

        // Update z WHERE clause
        const { data, error } = await supabase
            .from('school_info')
            .update(snakeCaseUpdates)
            .eq('id', existingData.id) // WAŻNE: dodaj WHERE
            .select()
            .single()

        if (error) throw error
        return mapSchoolInfo(data)
    },
}