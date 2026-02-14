import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReservationsList from './ReservationsList';
import type { Car, CarReservation, Student } from '@/types';

interface CarMonthViewProps {
  currentDate: Date;
  reservations: CarReservation[];
  cars: Car[];
  students: Student[];
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

export default function CarMonthView({
  currentDate,
  reservations,
  cars,
  students,
  onSelectDate,
  onClose,
}: CarMonthViewProps) {
  const [viewDate, setViewDate] = useState(currentDate);
  const [selectedDay, setSelectedDay] = useState<Date | null>(currentDate); // Zaznacz dzień z którego przyszliśmy
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const minSwipeDistance = 50;

  const onTouchStartHandler = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMoveHandler = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setViewDate(addMonths(viewDate, 1));
      setSelectedDay(null);
    }
    if (isRightSwipe) {
      setViewDate(subMonths(viewDate, 1));
      setSelectedDay(null);
    }
  };

  const getReservationCount = (date: Date) => {
    return reservations.filter((r) => r.date === format(date, 'yyyy-MM-dd')).length;
  };

  const selectedDayReservations = selectedDay
    ? reservations.filter((r) => r.date === format(selectedDay, 'yyyy-MM-dd'))
    : [];

  // Suma rezerwacji w miesiącu
  const totalMonthReservations = reservations.filter((r) => {
    const resDate = new Date(r.date);
    return resDate >= monthStart && resDate <= monthEnd;
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewDate(subMonths(viewDate, 1));
              setSelectedDay(null);
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <h2 className="text-lg font-semibold capitalize">
            {format(viewDate, 'LLLL yyyy', { locale: pl })}
          </h2>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewDate(addMonths(viewDate, 1));
              setSelectedDay(null);
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Month summary */}
        <div className="border-t px-4 py-2 text-center text-sm text-gray-600">
          Rezerwacji w miesiącu: <span className="font-bold text-blue-600">{totalMonthReservations}</span>
        </div>
      </div>

      {/* Calendar */}
      <div 
        className="flex-1 overflow-y-auto"
        onTouchStart={onTouchStartHandler}
        onTouchMove={onTouchMoveHandler}
        onTouchEnd={onTouchEndHandler}
      >
        <div className="p-4">
          {/* Weekday headers */}
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
            {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells */}
            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Days */}
            {days.map((day) => {
              const reservationCount = getReservationCount(day);
              const today = isToday(day);
              const selected = selectedDay && isSameDay(day, selectedDay);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`
                    relative aspect-square rounded-lg p-2 text-center text-sm font-semibold
                    ${today ? 'ring-2 ring-blue-600' : ''}
                    ${selected ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'}
                    transition-all active:scale-95
                  `}
                >
                  {format(day, 'd')}
                  
                  {/* Kropki na dole */}
                  {reservationCount > 0 && (
                    <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                      {Array.from({ length: Math.min(reservationCount, 3) }).map((_, i) => (
                        <div 
                          key={i} 
                          className="h-1 w-1 rounded-full bg-blue-500" 
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista rezerwacji pod kalendarzem */}
        {selectedDay && (
          <ReservationsList
            date={selectedDay}
            reservations={selectedDayReservations}
            cars={cars}
            students={students}
            onSelectDate={() => {
              onSelectDate(selectedDay);
              onClose();
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <Button 
          onClick={selectedDay ? () => {
            onSelectDate(selectedDay);
            onClose();
          } : onClose} 
          className="w-full"
        >
          {selectedDay ? 'Zobacz dzień' : 'Powrót do dnia'}
        </Button>
      </div>
    </div>
  );
}
