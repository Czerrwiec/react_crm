import { supabase } from '@/lib/supabase'
import { mapCar, mapCarReservation } from '@/lib/mappers'
import type { Car, CarReservation } from '@/types'

export const carService = {
    async getCars() {
        const { data, error } = await supabase
            .from('cars')
            .select('*')
            .eq('active', true)
            .order('name')

        if (error) throw error
        return data.map(mapCar)
    },

    async getAllCars() {
        const { data, error } = await supabase
            .from('cars')
            .select('*')
            .order('name')

        if (error) throw error
        return data.map(mapCar)
    },

    async getCar(id: string) {
        const { data, error } = await supabase
            .from('cars')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return mapCar(data)
    },

    async createCar(car: Omit<Car, 'id'>) {
        const { data, error } = await supabase
            .from('cars')
            .insert({
                name: car.name,
                year: car.year,
                inspection_date: car.inspectionDate,
                insurance_date: car.insuranceDate,
                active: car.active,
            })
            .select()
            .single()

        if (error) throw error
        return mapCar(data)
    },

    async updateCar(id: string, updates: Partial<Car>) {
        const snakeCaseUpdates: any = {}

        if (updates.name !== undefined) snakeCaseUpdates.name = updates.name
        if (updates.year !== undefined) snakeCaseUpdates.year = updates.year
        if (updates.inspectionDate !== undefined) snakeCaseUpdates.inspection_date = updates.inspectionDate
        if (updates.insuranceDate !== undefined) snakeCaseUpdates.insurance_date = updates.insuranceDate
        if (updates.active !== undefined) snakeCaseUpdates.active = updates.active

        const { data, error } = await supabase
            .from('cars')
            .update(snakeCaseUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return mapCar(data)
    },

    async deleteCar(id: string) {
        const { error } = await supabase
            .from('cars')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    // Reservations
    async getReservationsByMonth(month: Date) {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)

        const { data, error } = await supabase
            .from('car_reservations')
            .select('*')
            .gte('date', startOfMonth.toISOString().split('T')[0])
            .lte('date', endOfMonth.toISOString().split('T')[0])
            .order('date')
            .order('start_time')

        if (error) throw error
        return data.map(mapCarReservation)
    },

    async createReservation(reservation: Omit<CarReservation, 'id' | 'createdAt'>) {
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('car_reservations')
            .insert({
                car_id: reservation.carId,
                student_ids: reservation.studentIds,
                date: reservation.date,
                start_time: reservation.startTime,
                end_time: reservation.endTime,
                notes: reservation.notes,
                created_by: user?.id,
            })
            .select()
            .single()

        if (error) throw error
        return mapCarReservation(data)
    },

    async updateReservation(id: string, updates: Partial<CarReservation>) {
        const snakeCaseUpdates: any = {}

        if (updates.carId !== undefined) snakeCaseUpdates.car_id = updates.carId
        if (updates.studentIds !== undefined) snakeCaseUpdates.student_ids = updates.studentIds
        if (updates.date !== undefined) snakeCaseUpdates.date = updates.date
        if (updates.startTime !== undefined) snakeCaseUpdates.start_time = updates.startTime
        if (updates.endTime !== undefined) snakeCaseUpdates.end_time = updates.endTime
        if (updates.notes !== undefined) snakeCaseUpdates.notes = updates.notes

        const { data, error } = await supabase
            .from('car_reservations')
            .update(snakeCaseUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return mapCarReservation(data)
    },

    async deleteReservation(id: string) {
        const { error } = await supabase
            .from('car_reservations')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async getReservationByStudent(studentId: string) {
        const { data, error } = await supabase
            .from('car_reservations')
            .select('*')
            .contains('student_ids', [studentId])
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date', { ascending: true })
            .limit(1)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return data ? mapCarReservation(data) : null
    },
}