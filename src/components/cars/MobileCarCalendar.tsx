import { useState } from 'react';
import CarDayView from './CarDayView';
import CarMonthView from './CarMonthView';
import type { Car, CarReservation, Student } from '@/types';

interface MobileCarCalendarProps {
  cars: Car[];
  reservations: CarReservation[];
  students: Student[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onReservationClick: (reservation: CarReservation) => void;
  onAddReservation: (hour: number, minute: number) => void;
  onLoadReservations: () => void;
  canAdd: boolean; // NEW
}

export default function MobileCarCalendar({
  cars,
  reservations,
  students,
  currentDate,
  onDateChange,
  onReservationClick,
  onAddReservation,
  canAdd,
}: MobileCarCalendarProps) {
  const [view, setView] = useState<'day' | 'month'>('day');

  if (view === 'month') {
    return (
      <CarMonthView
        currentDate={currentDate}
        reservations={reservations}
        cars={cars}
        students={students}
        onSelectDate={(date) => {
          onDateChange(date);
          setView('day');
        }}
        onClose={() => setView('day')}
      />
    );
  }

  return (
    <CarDayView
      currentDate={currentDate}
      onDateChange={onDateChange}
      reservations={reservations}
      cars={cars}
      students={students}
      onReservationClick={onReservationClick}
      onAddReservation={onAddReservation}
      onOpenMonthView={() => setView('month')}
      canAdd={canAdd}
    />
  );
}
