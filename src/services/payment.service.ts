import { supabase } from '@/lib/supabase'
import type { Payment } from '@/types'
import { mapPayment } from '@/lib/mappers'

export const paymentService = {
    async getPaymentsByStudent(studentId: string) {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data.map(mapPayment)
    },

    async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>) {
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('payments')
            .insert({
                student_id: payment.studentId,
                amount: payment.amount,
                type: payment.type,
                method: payment.method,
                created_by: user?.id, // Dodaj ID zalogowanego użytkownika
            })
            .select()
            .single()

        if (error) throw error
        return mapPayment(data)
    },

    async deletePayment(id: string) {
        const { error } = await supabase
            .from('payments')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async getCreatedByName(createdById: string | null) {
        if (!createdById) return null

        try {
            const { data, error } = await supabase
                .from('users')
                .select('first_name, last_name')
                .eq('id', createdById)
                .single()

            if (error) return null
            return `${data.first_name} ${data.last_name}`
        } catch {
            return null
        }
    },

    async canEditPayment(paymentId: string) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return false

        try {
            const payment = await supabase
                .from('payments')
                .select('created_by')
                .eq('id', paymentId)
                .single()

            const userRole = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()

            if (userRole.data?.role === 'admin') return true
            return payment.data?.created_by === user.id
        } catch {
            return false
        }
    },

    async updatePayment(payment: Payment) {
        if (payment.id) {
            const canEdit = await this.canEditPayment(payment.id)
            if (!canEdit) {
                throw new Error('Tylko admin może edytować tę płatność')
            }
        }

        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('payments')
            .update({
                amount: payment.amount,
                type: payment.type,
                method: payment.method,
                updated_by: user?.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id!)
            .select()
            .single()

        if (error) throw error
        return mapPayment(data)
    },
}