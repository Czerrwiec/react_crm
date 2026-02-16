import { useState, useEffect, useRef } from 'react';
import { instructorService } from '@/services/instructor.service';
import { lessonService } from '@/services/lesson.service';
import { studentService } from '@/services/student.service';
import { Select } from '@/components/ui/select';
import MobileDayView from '@/components/mobile/MobileDayView';
import MobileMonthView from '@/components/mobile/MobileMonthView';
import LessonDialog from '@/components/LessonDialog';
import LessonDetailDialog from '@/components/LessonDetailDialog';
import type { Lesson, User } from '@/types';

export default function AdminMobileCalendar() {
  const [view, setView] = useState<'day' | 'month'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [instructors, setInstructors] = useState<User[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [studentNamesMap, setStudentNamesMap] = useState<Map<string, string>>(new Map());
  
  // Track loaded month range (start and end)
  const loadedRangeRef = useRef<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  // Dialogs
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [preselectedTime, setPreselectedTime] = useState<string | undefined>();

  // Load instructors on mount
  useEffect(() => {
    loadInstructors();
    loadStudents();
  }, []);

  // Load from localStorage or use first instructor
  useEffect(() => {
    if (instructors.length > 0) {
      const savedId = localStorage.getItem('admin-selected-instructor');
      if (savedId && instructors.some(i => i.id === savedId)) {
        setSelectedInstructorId(savedId);
      } else {
        // Default to first instructor
        setSelectedInstructorId(instructors[0].id);
      }
    }
  }, [instructors]);

  // Load lessons when instructor changes or when currentDate is outside loaded range
  useEffect(() => {
    if (!selectedInstructorId) return;

    const { start, end } = loadedRangeRef.current;
    
    // Load if:
    // 1. Never loaded before (start === null)
    // 2. currentDate is outside loaded range
    const needsLoad = 
      !start || 
      !end || 
      currentDate < start || 
      currentDate > end;

    if (needsLoad) {
      loadLessons();
    }
  }, [selectedInstructorId, currentDate]);

  const loadInstructors = async () => {
    try {
      const data = await instructorService.getInstructors();
      // Filter only active instructors
      const activeInstructors = data.filter((i) => i.active);
      setInstructors(activeInstructors);
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await studentService.getStudents();
      
      const namesMap = new Map(
        data.map((s) => [s.id, `${s.firstName} ${s.lastName}`])
      );
      setStudentNamesMap(namesMap);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadLessons = async () => {
    try {
      // Load 3 months: previous, current, next
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

      // Load all 3 months in parallel
      const [prevData, currentData, nextData] = await Promise.all([
        lessonService.getLessonsByInstructor(selectedInstructorId, prevMonth),
        lessonService.getLessonsByInstructor(selectedInstructorId, currentMonth),
        lessonService.getLessonsByInstructor(selectedInstructorId, nextMonth),
      ]);

      // Merge all lessons and remove duplicates
      const allLessons = [...prevData, ...currentData, ...nextData];
      const uniqueLessons = Array.from(
        new Map(allLessons.map(lesson => [lesson.id, lesson])).values()
      );

      setLessons(uniqueLessons);
      
      // Update loaded range
      loadedRangeRef.current = {
        start: prevMonth,
        end: new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0), // Last day of next month
      };
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const handleInstructorChange = (id: string) => {
    setSelectedInstructorId(id);
    localStorage.setItem('admin-selected-instructor', id);
    // Reset loaded range to force reload for new instructor
    loadedRangeRef.current = { start: null, end: null };
  };

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setDetailDialogOpen(true);
  };

  const handleAddLesson = (hour: number, minute: number) => {
    setEditingLesson(null);
    setPreselectedTime(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    setLessonDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setDetailDialogOpen(false);
    setLessonDialogOpen(true);
  };

  const handleDeleteLesson = async () => {
    setDetailDialogOpen(false);
    await loadLessons();
  };

  if (!selectedInstructorId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Instructor Dropdown - Same line as hamburger */}
      <div className="sticky top-0 z-20 border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Space for hamburger menu - it's positioned absolute by layout */}
          <div className="w-10" />
          
          {/* Dropdown */}
          <Select
            id="instructor-select"
            value={selectedInstructorId}
            onChange={(e) => handleInstructorChange(e.target.value)}
            className="h-10 flex-1 text-base"
          >
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.firstName} {instructor.lastName}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Calendar Views */}
      {view === 'month' ? (
        <MobileMonthView
          currentDate={currentDate}
          lessons={lessons}
          studentNamesMap={studentNamesMap}
          instructorId={selectedInstructorId}
          onSelectDate={(date) => {
            setCurrentDate(date);
            setView('day');
          }}
          onClose={() => setView('day')}
          onMonthChange={(date) => {
            // Update currentDate when month changes to trigger lesson reload
            setCurrentDate(date);
          }}
        />
      ) : (
        <MobileDayView
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          lessons={lessons}
          studentNamesMap={studentNamesMap}
          onLessonClick={handleLessonClick}
          onAddLesson={handleAddLesson}
          onOpenMonthView={() => setView('month')}
          instructorId={selectedInstructorId}
        />
      )}

      {/* Dialogs */}
      <LessonDialog
        open={lessonDialogOpen}
        onOpenChange={setLessonDialogOpen}
        lesson={editingLesson}
        instructorId={selectedInstructorId}
        preselectedDate={currentDate}
        preselectedTime={preselectedTime}
        onSuccess={loadLessons}
      />

      <LessonDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        lesson={selectedLesson}
        studentNames={studentNamesMap}
        onEdit={handleEditLesson}
        onSuccess={handleDeleteLesson}
      />
    </div>
  );
}
