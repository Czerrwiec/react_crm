import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import {
	format,
	parse,
	startOfWeek,
	getDay,
	addMonths,
	subMonths,
	addWeeks,
	subWeeks,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { lessonService } from '@/services/lesson.service';
import { instructorService } from '@/services/instructor.service';
import { studentService } from '@/services/student.service';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import LessonDialog from '@/components/LessonDialog';
import LessonDetailDialog from '@/components/LessonDetailDialog';
import type { Lesson, User, Student } from '@/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar.css';

const locales = { pl };

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek: () => startOfWeek(new Date(), { locale: pl }),
	getDay,
	locales,
});

interface CalendarEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
	resource: Lesson;
}

export default function CalendarPage() {
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [instructors, setInstructors] = useState<User[]>([]);
	const [students, setStudents] = useState<Student[]>([]);
	const [selectedInstructor, setSelectedInstructor] = useState<string>('all');
	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedDay, setSelectedDay] = useState(new Date()); // Dzień wyświetlany w sidebarz
	const [loading, setLoading] = useState(true);
	const [view, setView] = useState<View>('month');

	// Dialogs
	const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
	const [detailDialogOpen, setDetailDialogOpen] = useState(false);
	const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
	const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

	useEffect(() => {
		loadInitialData();
	}, []);

	useEffect(() => {
		if (instructors.length > 0) {
			loadLessons();
		}
	}, [selectedInstructor, currentDate]);

	const loadInitialData = async () => {
		try {
			const [instructorsData, studentsData] = await Promise.all([
				instructorService.getInstructors(),
				studentService.getStudents(),
			]);
			setInstructors(instructorsData);
			setStudents(studentsData);

			if (instructorsData.length > 0) {
				setSelectedInstructor(instructorsData[0].id);
			}
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadLessons = async () => {
		try {
			const data =
				selectedInstructor === 'all'
					? await lessonService.getAllLessons(currentDate)
					: await lessonService.getLessonsByInstructor(
							selectedInstructor,
							currentDate
					  );

			setLessons(data);
		} catch (error) {
			console.error('Error loading lessons:', error);
		}
	};

	const studentNamesMap = new Map(
		students.map((s) => [s.id, `${s.firstName} ${s.lastName}`])
	);

	const events: CalendarEvent[] = lessons.map((lesson) => {
		const [startHour, startMinute] = lesson.startTime.split(':').map(Number);
		const [endHour, endMinute] = lesson.endTime.split(':').map(Number);

		const date = new Date(lesson.date);
		const start = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			startHour,
			startMinute
		);
		const end = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			endHour,
			endMinute
		);

		const studentNames = lesson.studentIds
			.map((id) => studentNamesMap.get(id) || 'Nieznany')
			.join(', ');

		return {
			id: lesson.id,
			title: studentNames || 'Bez kursanta',
			start,
			end,
			resource: lesson,
		};
	});

	const eventStyleGetter = (event: CalendarEvent) => {
		const lesson = event.resource;
		let backgroundColor = '#3174ad';

		switch (lesson.status) {
			case 'scheduled':
				backgroundColor = '#f59e0b';
				break;
			case 'completed':
				backgroundColor = '#10b981';
				break;
			case 'cancelled':
				backgroundColor = '#6b7280';
				break;
		}

		return {
			style: {
				backgroundColor,
				borderRadius: '4px',
				opacity: 0.9,
				color: 'white',
				border: '0px',
				display: 'block',
			},
		};
	};

	const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
		let newDate = new Date(currentDate);

		if (direction === 'today') {
			newDate = new Date();
			setSelectedDay(new Date()); // Także zaznacz dzisiejszy dzień
		} else if (direction === 'prev') {
			if (view === 'month') newDate = subMonths(currentDate, 1);
			else newDate = subWeeks(currentDate, 1);
		} else {
			if (view === 'month') newDate = addMonths(currentDate, 1);
			else newDate = addWeeks(currentDate, 1);
		}

		setCurrentDate(newDate);
	};

	const handleEventClick = (event: CalendarEvent) => {
		setSelectedLesson(event.resource);
		setDetailDialogOpen(true);
	};

	const handleDayClick = (date: Date) => {
		setSelectedDay(date);
	};

	const handleAddLesson = () => {
		setEditingLesson(null);
		setLessonDialogOpen(true);
	};

	const handleEditLesson = (lesson: Lesson) => {
		setEditingLesson(lesson);
		setLessonDialogOpen(true);
	};

	const getDateRangeText = () => {
		if (view === 'month') {
			return format(currentDate, 'LLLL yyyy', { locale: pl });
		} else {
			const start = startOfWeek(currentDate, { locale: pl });
			const end = new Date(start);
			end.setDate(start.getDate() + 6);
			return `${format(start, 'd MMM', { locale: pl })} - ${format(
				end,
				'd MMM yyyy',
				{ locale: pl }
			)}`;
		}
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	const canAddLesson = selectedInstructor && selectedInstructor !== 'all';

	return (
		<div className="flex h-full flex-col p-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Kalendarz</h1>
				<div className="flex items-center gap-4">
					<Select
						value={selectedInstructor}
						onChange={(e) => setSelectedInstructor(e.target.value)}>
						<option value="all">Wszyscy instruktorzy</option>
						{instructors.map((instructor) => (
							<option key={instructor.id} value={instructor.id}>
								{instructor.firstName} {instructor.lastName}
							</option>
						))}
					</Select>
					<Button onClick={handleAddLesson} disabled={!canAddLesson}>
						<Plus className="mr-2 h-4 w-4" />
						Dodaj lekcję
					</Button>
				</div>
			</div>

			{!canAddLesson && (
				<div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
					Wybierz konkretnego instruktora, aby dodać lekcję
				</div>
			)}

			{/* Custom toolbar */}
			<div className="mb-4 flex items-center justify-between rounded-lg border bg-white p-4">
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleNavigate('today')}>
						Dziś
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleNavigate('prev')}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleNavigate('next')}>
						<ChevronRight className="h-4 w-4" />
					</Button>
					<span className="ml-4 text-lg font-semibold capitalize">
						{getDateRangeText()}
					</span>
				</div>

				<div className="flex gap-2">
					<Button
						variant={view === 'month' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setView('month')}>
						Miesiąc
					</Button>
					<Button
						variant={view === 'week' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setView('week')}>
						Tydzień
					</Button>
				</div>
			</div>

			{/* Calendar views */}
			{view === 'month' ? (
				<div className="grid flex-1 gap-4 md:grid-cols-[2fr,1fr]">
					{/* Month view - compact */}
					<div className="rounded-lg border bg-white p-3">
						<Calendar
							localizer={localizer}
							events={events}
							startAccessor="start"
							endAccessor="end"
							style={{ height: 'calc(100vh - 350px)', minHeight: '500px' }}
							date={currentDate}
							view="month"
							onNavigate={() => {}}
							onSelectSlot={(slotInfo) => handleDayClick(slotInfo.start)}
							selectable
							toolbar={false}
							eventPropGetter={eventStyleGetter}
							onSelectEvent={handleEventClick}
						/>
					</div>

					{/* Day view - sidebar */}
					<div className="rounded-lg border bg-white p-3">
						<div className="mb-2 text-center font-semibold">
							{format(selectedDay, 'd MMMM yyyy', { locale: pl })}
						</div>
						<Calendar
							localizer={localizer}
							events={events.filter(
								(e) =>
									format(e.start, 'yyyy-MM-dd') ===
									format(selectedDay, 'yyyy-MM-dd')
							)}
							startAccessor="start"
							endAccessor="end"
							style={{ height: 'calc(100vh - 350px)', minHeight: '500px' }}
							date={selectedDay}
							view="day"
							onNavigate={() => {}}
							toolbar={false}
							step={30}
							timeslots={2}
							min={new Date(2024, 0, 1, 6, 0)}
							max={new Date(2024, 0, 1, 22, 0)}
							eventPropGetter={eventStyleGetter}
							onSelectEvent={handleEventClick}
						/>
					</div>
				</div>
			) : (
				<div className="flex-1 rounded-lg border bg-white p-3">
					<Calendar
						localizer={localizer}
						events={events}
						startAccessor="start"
						endAccessor="end"
						style={{ height: 'calc(100vh - 350px)', minHeight: '500px' }}
						date={currentDate}
						view="week"
						onNavigate={() => {}}
						toolbar={false}
						step={30}
						timeslots={2}
						min={new Date(2024, 0, 1, 6, 0)}
						max={new Date(2024, 0, 1, 22, 0)}
						eventPropGetter={eventStyleGetter}
						onSelectEvent={handleEventClick}
					/>
				</div>
			)}

			<div className="mt-4 flex gap-4 text-sm">
				<div className="flex items-center gap-2">
					<div
						className="h-4 w-4 rounded"
						style={{ backgroundColor: '#f59e0b' }}
					/>
					<span>Zaplanowana</span>
				</div>
				<div className="flex items-center gap-2">
					<div
						className="h-4 w-4 rounded"
						style={{ backgroundColor: '#10b981' }}
					/>
					<span>Ukończona</span>
				</div>
				<div className="flex items-center gap-2">
					<div
						className="h-4 w-4 rounded"
						style={{ backgroundColor: '#6b7280' }}
					/>
					<span>Anulowana</span>
				</div>
			</div>

			{/* Dialogs */}
			{canAddLesson && (
				<LessonDialog
					open={lessonDialogOpen}
					onOpenChange={setLessonDialogOpen}
					instructorId={selectedInstructor}
					lesson={editingLesson}
					preselectedDate={selectedDay}
					onSuccess={loadLessons}
				/>
			)}

			<LessonDetailDialog
				open={detailDialogOpen}
				onOpenChange={setDetailDialogOpen}
				lesson={selectedLesson}
				studentNames={studentNamesMap}
				onEdit={handleEditLesson}
				onSuccess={loadLessons}
			/>
		</div>
	);
}
