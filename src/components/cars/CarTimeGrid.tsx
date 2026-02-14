import type { Car, CarReservation, Student } from '@/types';

interface CarTimeGridProps {
  reservations: CarReservation[];
  cars: Car[];
  students: Student[];
  onReservationClick: (reservation: CarReservation) => void;
  onTimeSlotClick: (hour: number, minute: number) => void;
  currentDate: Date;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 - 22:00

export default function CarTimeGrid({
  reservations,
  cars,
  students,
  onReservationClick,
  onTimeSlotClick,
  currentDate,
}: CarTimeGridProps) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentOffset = (currentHour - 6) * 60 + currentMinute;
  const isInRange = currentHour >= 6 && currentHour <= 22;
  const isToday = now.toDateString() === currentDate.toDateString();

  const getReservationStyle = (reservation: CarReservation) => {
    const [startHour, startMinute] = reservation.startTime.split(':').map(Number);
    const [endHour, endMinute] = reservation.endTime.split(':').map(Number);

    const startOffset = (startHour - 6) * 60 + startMinute + 6; // +6px offset - zmień tutaj dla rezerwacji
    const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

    return {
      top: `${startOffset}px`,
      height: `${duration}px`,
    };
  };

  // Funkcja sprawdzająca overlap
  const getOverlappingGroups = () => {
    const sorted = [...reservations].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const groups: CarReservation[][] = [];

    sorted.forEach((res) => {
      const [resStart] = res.startTime.split(':').map(Number);
      const [resEnd] = res.endTime.split(':').map(Number);
      const resStartMin = resStart * 60 + parseInt(res.startTime.split(':')[1]);
      const resEndMin = resEnd * 60 + parseInt(res.endTime.split(':')[1]);

      let placed = false;
      for (const group of groups) {
        const overlaps = group.some((existing) => {
          const [exStart] = existing.startTime.split(':').map(Number);
          const [exEnd] = existing.endTime.split(':').map(Number);
          const exStartMin = exStart * 60 + parseInt(existing.startTime.split(':')[1]);
          const exEndMin = exEnd * 60 + parseInt(existing.endTime.split(':')[1]);

          return resStartMin < exEndMin && resEndMin > exStartMin;
        });

        if (overlaps) {
          group.push(res);
          placed = true;
          break;
        }
      }

      if (!placed) {
        groups.push([res]);
      }
    });

    return groups;
  };

  const groups = getOverlappingGroups();
  const reservationPositions = new Map<string, { column: number; totalColumns: number }>();

  groups.forEach((group) => {
    group.forEach((res, idx) => {
      reservationPositions.set(res.id, {
        column: idx,
        totalColumns: group.length,
      });
    });
  });

  const getCarColor = (carId: string) => {
    const car = cars.find(c => c.id === carId);
    return car?.color || '#3b82f6';
  };

  const getCarName = (carId: string) => {
    const car = cars.find(c => c.id === carId);
    return car?.name || 'Nieznany';
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

  return (
    <div className="relative px-4 py-2">
      {/* Hour lines */}
      {HOURS.map((hour) => (
        <div key={hour}>
          {/* Full hour */}
          <div
            className="relative h-[30px] border-b border-gray-300"
            onClick={() => onTimeSlotClick(hour, 0)}
          >
            <span className="absolute -top-2 left-0 text-xs font-medium text-gray-600">
              {String(hour).padStart(2, '0')}:00
            </span>
          </div>
          {/* Half hour */}
          <div
            className="relative h-[30px] border-b border-gray-200 border-dashed"
            onClick={() => onTimeSlotClick(hour, 30)}
          >
            <span className="absolute -top-2 left-0 text-[10px] text-gray-400">
              {String(hour).padStart(2, '0')}:30
            </span>
          </div>
        </div>
      ))}

      {/* Reservations */}
      <div className="absolute left-16 right-4 top-0">
        {/* NOW indicator */}
        {isInRange && isToday && (
          <div
            className="absolute left-0 right-0 z-10"
            style={{ top: `${currentOffset}px` }}
          >
            <div className="flex items-center">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm" />
              <div className="h-0.5 flex-1 bg-red-500" />
            </div>
          </div>
        )}

        {reservations.map((reservation) => {
          const carColor = getCarColor(reservation.carId);
          const carName = getCarName(reservation.carId);
          const studentNames = getStudentNames(reservation.studentIds);
          const studentCity = getStudentCity(reservation.studentIds);
          const position = reservationPositions.get(reservation.id) || { column: 0, totalColumns: 1 };

          const [startH, startM] = reservation.startTime.split(':').map(Number);
          const [endH, endM] = reservation.endTime.split(':').map(Number);
          const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
          const showCity = durationMinutes >= 120;

          const width = `calc((100% - 8px) / ${position.totalColumns})`;
          const left = `calc(${position.column} * (100% - 8px) / ${position.totalColumns})`;

          return (
            <button
              key={reservation.id}
              className="absolute rounded-lg border-l-[5px] border-t border-t-gray-100 bg-white p-2.5 text-left shadow-md transition-transform active:scale-95"
              style={{
                ...getReservationStyle(reservation),
                borderLeftColor: carColor,
                width,
                left,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onReservationClick(reservation);
              }}
            >
              <div className="text-sm font-bold leading-tight" style={{ color: carColor }}>
                {carName}
              </div>
              <div className="mt-0.5 text-xs text-gray-700 font-medium line-clamp-1">
                {studentNames || 'Bez kursantów'}
              </div>
              {showCity && studentCity && (
                <div className="mt-0.5 text-xs text-gray-500">
                  {studentCity}
                </div>
              )}
              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                <span className="font-medium">{reservation.startTime.slice(0, 5)}</span>
                <span>→</span>
                <span className="font-medium">{reservation.endTime.slice(0, 5)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
