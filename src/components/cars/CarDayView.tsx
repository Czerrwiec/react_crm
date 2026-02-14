import { useState } from 'react';
import { format, addDays, subDays, isToday, startOfWeek } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CarTimeGrid from './CarTimeGrid';
import type { Car, CarReservation, Student } from '@/types';

interface CarDayViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  reservations: CarReservation[];
  cars: Car[];
  students: Student[];
  onReservationClick: (reservation: CarReservation) => void;
  onAddReservation: (hour: number, minute: number) => void;
  onOpenMonthView: () => void;
  canAdd: boolean; // NEW - czy może dodawać rezerwacje
}

export default function CarDayView({
  currentDate,
  onDateChange,
  reservations,
  cars,
  students,
  onReservationClick,
  onAddReservation,
  onOpenMonthView,
  canAdd,
}: CarDayViewProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onDateChange(addDays(currentDate, 1));
    }
    if (isRightSwipe) {
      onDateChange(subDays(currentDate, 1));
    }
  };

  const todayReservations = reservations.filter(
    (res) => res.date === format(currentDate, 'yyyy-MM-dd')
  );

  // Generuj dni tygodnia
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const totalReservations = todayReservations.length;

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="ml-12 text-sm font-semibold capitalize md:ml-0">
            {format(currentDate, 'LLLL', { locale: pl })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenMonthView}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Week carousel */}
        <div className="flex justify-between gap-1 px-2 py-3">
          {weekDays.map((day, idx) => {
            const isSelected = format(day, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
            const isDayToday = isToday(day);
            const isSunday = idx === 6;
            const dayReservations = reservations.filter(r => r.date === format(day, 'yyyy-MM-dd'));
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateChange(day)}
                className={`
                  flex flex-1 flex-col items-center justify-center rounded-lg p-2 text-center
                  ${isSelected 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : isDayToday
                    ? 'bg-blue-100 text-blue-700'
                    : isSunday
                    ? 'text-red-500'
                    : 'text-gray-700'
                  }
                  ${!isSelected && 'hover:bg-gray-100'}
                `}
              >
                <div className="text-[10px] font-medium uppercase">
                  {format(day, 'EEE', { locale: pl })}
                </div>
                <div className="text-lg font-bold">
                  {format(day, 'd')}
                </div>
                {dayReservations.length > 0 && (
                  <div className="mt-0.5 flex gap-0.5">
                    {Array.from({ length: Math.min(dayReservations.length, 5) }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} 
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="border-t px-4 py-2">
          <div className="text-center text-sm">
            <span className="font-semibold capitalize text-gray-700">
              {format(currentDate, 'EEEE', { locale: pl })}
            </span>
            {totalReservations > 0 && (
              <>
                <span className="text-gray-400"> • </span>
                <span className="font-bold text-blue-600">{totalReservations} rezerwacji</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Day View */}
      <div
        className="flex-1 overflow-y-auto"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <CarTimeGrid
          reservations={todayReservations}
          cars={cars}
          students={students}
          onReservationClick={onReservationClick}
          onTimeSlotClick={canAdd ? onAddReservation : () => {}}
          currentDate={currentDate}
        />
      </div>

      {/* FAB - tylko dla admin */}
      {canAdd && (
        <button
          onClick={() => onAddReservation(new Date().getHours(), 0)}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg active:scale-95 transition-transform"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
}
