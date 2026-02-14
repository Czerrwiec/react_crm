import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Car, CarReservation, Student } from '@/types';

interface ReservationsListProps {
  date: Date;
  reservations: CarReservation[];
  cars: Car[];
  students: Student[];
  onSelectDate: () => void;
}

export default function ReservationsList({
  date,
  reservations,
  cars,
  students,
}: ReservationsListProps) {
  const getCarInfo = (carId: string) => {
    const car = cars.find(c => c.id === carId);
    return {
      name: car?.name || 'Nieznany',
      color: car?.color || '#3b82f6',
    };
  };

  const getStudentNames = (studentIds: string[]) => {
    return studentIds
      .map(id => {
        const student = students.find(s => s.id === id);
        return student ? `${student.firstName} ${student.lastName}` : 'Nieznany';
      })
      .join(', ');
  };

  const getStudentCity = (studentIds: string[]) => {
    if (studentIds.length === 0) return null;
    const student = students.find(s => s.id === studentIds[0]);
    return student?.city || null;
  };

  // Sortuj po czasie
  const sortedReservations = [...reservations].sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );

  return (
    <div className="border-t bg-gray-50 px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          {format(date, 'd MMMM yyyy', { locale: pl })}
        </h3>
        <span className="text-xs text-gray-500">
          {reservations.length} {reservations.length === 1 ? 'rezerwacja' : 'rezerwacji'}
        </span>
      </div>
      
      {sortedReservations.length > 0 ? (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {sortedReservations.map((reservation) => {
            const carInfo = getCarInfo(reservation.carId);
            const studentNames = getStudentNames(reservation.studentIds);
            const studentCity = getStudentCity(reservation.studentIds);

            return (
              <div 
                key={reservation.id} 
                className="rounded-lg border-l-4 bg-white p-3 shadow-sm"
                style={{ borderLeftColor: carInfo.color }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div 
                      className="font-semibold text-sm"
                      style={{ color: carInfo.color }}
                    >
                      {carInfo.name}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-700">
                      {studentNames || 'Bez kursantów'}
                      {studentCity && <span className="text-gray-500"> • {studentCity}</span>}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-600">
                    {reservation.startTime.slice(0, 5)} - {reservation.endTime.slice(0, 5)}
                  </div>
                </div>
                {reservation.notes && (
                  <div className="mt-2 text-xs text-gray-500 italic">
                    {reservation.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-gray-400">
          Brak rezerwacji tego dnia
        </div>
      )}
    </div>
  );
}
