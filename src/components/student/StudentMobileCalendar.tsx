import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { Student, Lesson } from '@/types';

interface StudentMobileCalendarProps {
  studentId: string;
  student: Student;
  onBack: () => void;
}

export default function StudentMobileCalendar({
  studentId,
  student,
  onBack,
}: StudentMobileCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date()); // Auto-select today
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [instructorsMap, setInstructorsMap] = useState<Map<string, string>>(new Map());
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    loadLessons();
    loadInstructors();
  }, [viewDate, studentId]);

  const loadLessons = async () => {
    try {
      const prevMonth = subMonths(viewDate, 1);
      const nextMonth = addMonths(viewDate, 1);

      const startDate = format(startOfMonth(prevMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(nextMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .contains('student_ids', [studentId])
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');

      if (error) throw error;
      
      // Map snake_case from Supabase to camelCase
      const mappedLessons: Lesson[] = (data || []).map((lesson: any) => ({
        id: lesson.id,
        date: lesson.date,
        startTime: lesson.start_time,
        endTime: lesson.end_time,
        duration: lesson.duration,
        status: lesson.status,
        instructorId: lesson.instructor_id,
        studentIds: lesson.student_ids || [],
        notes: lesson.notes,
        createdAt: lesson.created_at,
        updatedAt: lesson.updated_at,
      }));
      
      setLessons(mappedLessons);
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const loadInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('role', 'instructor');

      if (error) throw error;

      const map = new Map(
        data?.map((i) => [i.id, `${i.first_name} ${i.last_name}`]) || []
      );
      setInstructorsMap(map);
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  };

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

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
      const newMonth = addMonths(viewDate, 1);
      setViewDate(newMonth);
      // Reset selected day when changing month
      setSelectedDay(null);
    }
    if (isRightSwipe) {
      const newMonth = subMonths(viewDate, 1);
      setViewDate(newMonth);
      // Reset selected day when changing month
      setSelectedDay(null);
    }
  };

  const getLessonsForDay = (date: Date) => {
    return lessons.filter((l) => l.date === format(date, 'yyyy-MM-dd'));
  };

  const selectedDayLessons = selectedDay 
    ? getLessonsForDay(selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Ukończona';
      case 'scheduled':
        return 'Zaplanowana';
      case 'cancelled':
        return 'Anulowana';
      default:
        return status;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3">
        {/* Space for hamburger menu (left) */}
        <div className="w-10" />
        
        <h1 className="text-lg font-semibold">
          {student.firstName} {student.lastName}
        </h1>
        
        {/* Back arrow (right) - returns to info tab */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-10 w-10 p-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setViewDate(subMonths(viewDate, 1));
            setSelectedDay(null); // Reset selected day
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-base font-semibold">
          {format(viewDate, 'LLLL yyyy', { locale: pl })}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setViewDate(addMonths(viewDate, 1));
            setSelectedDay(null); // Reset selected day
          }}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div 
        className="border-b bg-white p-4"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((day, idx) => (
            <div
              key={day}
              className={`text-center text-xs font-medium ${
                idx === 6 ? 'text-red-500' : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before month starts */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}

          {/* Days */}
          {days.map((day) => {
            const dayLessons = getLessonsForDay(day);
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const isCurrentDay = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`relative flex aspect-square min-h-[44px] flex-col items-center justify-center rounded-lg border transition-colors ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : isCurrentDay
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    day.getDay() === 0
                      ? 'text-red-500'
                      : isSelected || isCurrentDay
                      ? 'text-blue-700'
                      : 'text-gray-900'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Dots for lessons */}
                {dayLessons.length > 0 && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {dayLessons.slice(0, 3).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-1 w-1 rounded-full bg-blue-600"
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lessons List */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedDay ? (
          <>
            {selectedDayLessons.length > 0 ? (
              <div className="space-y-3">
                {selectedDayLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="rounded-lg border bg-white p-4 shadow-sm"
                  >
                    {/* Time & Duration */}
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-base font-semibold text-gray-900">
                        {lesson.startTime.slice(0, 5)} - {lesson.endTime.slice(0, 5)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {lesson.duration}h
                      </div>
                    </div>

                    {/* Instructor */}
                    <div className="mb-2 text-sm text-gray-700">
                      {instructorsMap.get(lesson.instructorId) || 'Nieznany instruktor'}
                    </div>

                    {/* Status */}
                    <Badge className={getStatusColor(lesson.status)}>
                      {getStatusLabel(lesson.status)}
                    </Badge>

                    {/* Notes */}
                    {lesson.notes && (
                      <div className="mt-2 text-xs text-gray-500 italic">
                        {lesson.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">
                Brak lekcji tego dnia
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">
            Wybierz dzień aby zobaczyć lekcje
          </div>
        )}
      </div>
    </div>
  );
}
