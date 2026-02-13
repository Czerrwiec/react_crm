import type { Lesson } from '@/types';

interface TimeGridProps {
  lessons: Lesson[];
  studentNamesMap: Map<string, string>;
  onLessonClick: (lesson: Lesson) => void;
  onTimeSlotClick: (hour: number, minute: number) => void;
  currentDate: Date;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 - 22:00

export default function TimeGrid({
  lessons,
  studentNamesMap,
  onLessonClick,
  onTimeSlotClick,
  currentDate,
}: TimeGridProps) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentOffset = (currentHour - 6) * 60 + currentMinute;
  const isInRange = currentHour >= 6 && currentHour <= 22;
  const isToday = now.toDateString() === currentDate.toDateString();

  const getLessonStyle = (lesson: Lesson) => {
    const [startHour, startMinute] = lesson.startTime.split(':').map(Number);
    const [endHour, endMinute] = lesson.endTime.split(':').map(Number);

    const startOffset = (startHour - 6) * 60 + startMinute;
    const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

    return {
      top: `${startOffset}px`,
      height: `${duration}px`,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'border-l-amber-500';
      case 'completed':
        return 'border-l-green-500';
      case 'cancelled':
        return 'border-l-gray-400';
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <div className="relative px-4 py-2">
      {/* Hour lines with half-hour marks */}
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

      {/* Lessons */}
      <div className="absolute left-16 right-4 top-0">
        {/* NOW indicator - tylko na dzisiejszym dniu */}
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

        {lessons.map((lesson) => {
          const studentNames = lesson.studentIds
            .map((id) => studentNamesMap.get(id) || 'Nieznany')
            .join(', ');

          return (
            <button
              key={lesson.id}
              className={`absolute w-full rounded-lg border-l-[5px] border-t border-t-gray-100 bg-white p-2.5 text-left shadow-md ${getStatusColor(
                lesson.status
              )} transition-transform active:scale-95`}
              style={getLessonStyle(lesson)}
              onClick={(e) => {
                e.stopPropagation();
                onLessonClick(lesson);
              }}
            >
              <div className="text-sm font-bold leading-tight text-gray-900">
                {studentNames || 'Bez kursanta'}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                <span>{lesson.startTime.slice(0, 5)}</span>
                <span>→</span>
                <span>{lesson.endTime.slice(0, 5)}</span>
                <span className="ml-auto font-medium">{lesson.duration}h</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
