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
        const { data, error } = await supabase
            .from('payments')
            .insert({
                student_id: payment.studentId,
                amount: payment.amount,
                type: payment.type,
                method: payment.method,
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
}