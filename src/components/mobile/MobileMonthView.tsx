import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Lesson } from '@/types';

interface MobileMonthViewProps {
  currentDate: Date;
  lessons: Lesson[];
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

export default function MobileMonthView({
  currentDate,
  lessons,
  onSelectDate,
  onClose,
}: MobileMonthViewProps) {
  const [viewDate, setViewDate] = useState(currentDate);
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
    }
    if (isRightSwipe) {
      setViewDate(subMonths(viewDate, 1));
    }
  };

  const getLessonHours = (date: Date) => {
    return lessons
      .filter((l) => l.date === format(date, 'yyyy-MM-dd'))
      .reduce((sum, l) => sum + l.duration, 0);
  };

  const getIntensity = (hours: number) => {
    if (hours === 0) return 'bg-white';
    if (hours < 4) return 'bg-blue-100';
    if (hours < 8) return 'bg-blue-300';
    if (hours < 10) return 'bg-blue-500 text-white';
    return 'bg-blue-600 text-white';
  };

  // Suma godzin w miesiącu
  const totalMonthHours = lessons
    .filter((l) => {
      const lessonDate = new Date(l.date);
      return lessonDate >= monthStart && lessonDate <= monthEnd;
    })
    .reduce((sum, l) => sum + l.duration, 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewDate(subMonths(viewDate, 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <h2 className="text-lg font-semibold capitalize">
            {format(viewDate, 'LLLL yyyy', { locale: pl })}
          </h2>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewDate(addMonths(viewDate, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Month summary */}
        <div className="border-t px-4 py-2 text-center text-sm text-gray-600">
          Liczba godzin w miesiącu: <span className="font-bold text-blue-600">{totalMonthHours}h</span>
        </div>
      </div>

      {/* Calendar */}
      <div 
        className="flex-1 overflow-y-auto p-4"
        onTouchStart={onTouchStartHandler}
        onTouchMove={onTouchMoveHandler}
        onTouchEnd={onTouchEndHandler}
      >
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
            const dayHours = getLessonHours(day);
            const today = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  onSelectDate(day);
                  onClose();
                }}
                className={`
                  relative aspect-square rounded-lg p-2 text-center text-sm font-semibold
                  ${getIntensity(dayHours)}
                  ${today ? 'ring-2 ring-blue-600' : ''}
                  transition-all active:scale-95
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <Button onClick={onClose} className="w-full" variant="outline">
          Powrót do dnia
        </Button>
      </div>
    </div>
  );
}
