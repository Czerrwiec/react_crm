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
                registration_number: car.registrationNumber, 
                inspection_date: car.inspectionDate,
                insurance_date: car.insuranceDate,
                active: car.active,
                color: car.color,
            })
            .select()
            .single();

        if (error) throw error;
        return mapCar(data);
    },

    async updateCar(id: string, updates: Partial<Car>) {
        const snakeCaseUpdates: any = {};

        if (updates.name !== undefined) snakeCaseUpdates.name = updates.name;
        if (updates.year !== undefined) snakeCaseUpdates.year = updates.year;
        if (updates.registrationNumber !== undefined) snakeCaseUpdates.registration_number = updates.registrationNumber; // NOWE
        if (updates.inspectionDate !== undefined) snakeCaseUpdates.inspection_date = updates.inspectionDate;
        if (updates.insuranceDate !== undefined) snakeCaseUpdates.insurance_date = updates.insuranceDate;
        if (updates.active !== undefined) snakeCaseUpdates.active = updates.active;
        if (updates.color !== undefined) snakeCaseUpdates.color = updates.color;

        const { data, error } = await supabase
            .from('cars')
            .update(snakeCaseUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapCar(data);
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

        // Wyślij notyfikacje - używaj RAW data (snake_case)
        if (data) {
            await this.sendReservationNotification('created', data, user?.id)
        }

        return mapCarReservation(data)
    },

    async updateReservation(id: string, updates: Partial<CarReservation>) {
        const { data: { user } } = await supabase.auth.getUser()

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

        // Wyślij notyfikacje - używaj RAW data (snake_case)
        if (data) {
            await this.sendReservationNotification('updated', data, user?.id)
        }

        return mapCarReservation(data)
    },

    async deleteReservation(id: string) {
        const { data: { user } } = await supabase.auth.getUser()

        // Pobierz dane rezerwacji przed usunięciem
        const { data: reservation } = await supabase
            .from('car_reservations')
            .select('*')
            .eq('id', id)
            .single()

        const { error } = await supabase
            .from('car_reservations')
            .delete()
            .eq('id', id)

        if (error) throw error

        // Wyślij notyfikacje do innych adminów
        if (reservation) {
            await this.sendReservationNotification('deleted', reservation, user?.id)
        }
        return true
    },

    async getReservationByStudent(studentId: string) {
        const { data, error } = await supabase
            .from('car_reservations')
            .select('*')
            .contains('student_ids', [studentId])
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date', { ascending: true })
            .limit(1)

        // Jeśli brak wyników - zwróć null zamiast rzucać błąd
        if (error && error.code === 'PGRST116') return null
        if (error) throw error

        // Jeśli data jest pusta lub nie ma wyników
        if (!data || data.length === 0) return null

        return mapCarReservation(data[0])
    },

    async sendReservationNotification(action: 'created' | 'updated' | 'deleted', reservation: any, currentUserId?: string) {
        try {
            // Pobierz wszystkich adminów oprócz tego który wykonał akcję
            const { data: admins } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'admin')
                .neq('id', currentUserId || 'none') // Zmień na 'none' jeśli brak ID

            if (!admins || admins.length === 0) return

            let actorName = 'Nieznany';
            let actorRole = '';
            if (currentUserId) {
                const { data: actor } = await supabase
                    .from('users')
                    .select('first_name, last_name, role')
                    .eq('id', currentUserId)
                    .single();

                if (actor) {
                    actorName = `${actor.first_name} ${actor.last_name}`;
                    actorRole = actor.role === 'admin' ? 'Admin' : 'Instruktor';
                }
            }

            // Pobierz nazwę samochodu - reservation ma snake_case pola z DB
            const carId = reservation.car_id || reservation.carId
            const { data: car } = await supabase
                .from('cars')
                .select('name')
                .eq('id', carId)
                .single()

            const carName = car?.name || 'Nieznany samochód'
            const reservationDate = reservation.date
            const date = new Date(reservationDate).toLocaleDateString('pl-PL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            })
            const startTime = reservation.start_time || reservation.startTime

            let title = ''
            let message = ''
            let type = ''

            switch (action) {
                case 'created':
                    title = 'Nowa rezerwacja samochodu'
                    message = `${actorName} (${actorRole}) dodał rezerwację: ${carName} na ${date}, godz. ${startTime}`
                    type = 'car_reservation_created'
                    break
                case 'updated':
                    title = 'Edycja rezerwacji samochodu'
                    message = `${actorName} (${actorRole}) zaktualizował rezerwację: ${carName} na ${date}, godz. ${startTime}`
                    type = 'car_reservation_updated'
                    break
                case 'deleted':
                    title = 'Usunięcie rezerwacji samochodu'
                    message = `${actorName} (${actorRole}) usunął rezerwację: ${carName} z ${date}, godz. ${startTime}`
                    type = 'car_reservation_deleted'
                    break
            }

            // Wyślij notyfikacje do wszystkich adminów
            const notifications = admins.map((admin) => ({
                user_id: admin.id,
                type,
                title,
                message,
                related_id: reservation.id,
                created_by: currentUserId,
                read: false,
            }))

            const { error: notifError } = await supabase
                .from('notifications')
                .insert(notifications)

            if (notifError) {
                console.error('Error inserting notifications:', notifError)
            }
        } catch (error) {
            console.error('Error sending reservation notification:', error)
        }
    },
}