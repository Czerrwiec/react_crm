import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
	addDays,
	subDays,
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
// import { useAuth } from '@/hooks/useAuth';

const EventComponent = ({ event }: any) => {
	const lines = event.resource?.displayLines || [event.title];

	return (
		<div
			style={{
				height: '100%',
				overflow: 'hidden',
				fontSize: '12px',
				lineHeight: '1.3',
			}}>
			{lines.map((line: string, idx: number) => (
				<div
					key={idx}
					style={{
						fontWeight: idx === 0 ? 'bold' : 'normal',
						fontSize: idx === 0 ? '12px' : '11px',
						whiteSpace: 'normal', // WAŻNE - pozwala na zawijanie
						wordBreak: 'break-word',
					}}>
					{line}
				</div>
			))}
		</div>
	);
};

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
	// const { user } = useAuth();
	const location = useLocation();
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [instructors, setInstructors] = useState<User[]>([]);
	const [students, setStudents] = useState<Student[]>([]);
	const [selectedInstructor, setSelectedInstructor] = useState<string>('all');
	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedDay, setSelectedDay] = useState(new Date());
	const [loading, setLoading] = useState(true);
	const [view, setView] = useState<View>('month');
	const [highlightedLessonId, setHighlightedLessonId] = useState<string | null>(
		null
	);
	const [instructorsMap, setInstructorsMap] = useState<Map<string, string>>(
		new Map()
	);

	// Dialogs
	const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
	const [detailDialogOpen, setDetailDialogOpen] = useState(false);
	const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
	const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

	useEffect(() => {
		loadInitialData();
	}, []);

	useEffect(() => {
		loadLessons(); // Wywołuj zawsze, nie tylko gdy instructors.length > 0
	}, [selectedInstructor, currentDate, instructorsMap.size]);

	// Check for lessonId from navigation state
	useEffect(() => {
		if (location.state?.lessonId && lessons.length > 0) {
			setHighlightedLessonId(location.state.lessonId);

			// Find the lesson and navigate to its date
			const lesson = lessons.find((l) => l.id === location.state.lessonId);
			if (lesson) {
				const lessonDate = new Date(lesson.date);
				setCurrentDate(lessonDate);
				setSelectedDay(lessonDate);
				setView('week'); // Switch to week view for better visibility
			}

			// Clear highlight after 3 seconds
			setTimeout(() => setHighlightedLessonId(null), 3000);
		}
	}, [location.state, lessons]);

	const loadInitialData = async () => {
		try {
			const [instructorsData, studentsData] = await Promise.all([
				instructorService.getInstructors(),
				studentService.getStudents(),
			]);
			setInstructors(instructorsData);
			setStudents(studentsData);

			// Stwórz mapę instruktorów
			const map = new Map(
				instructorsData.map((i) => [i.id, `${i.firstName} ${i.lastName}`])
			);
			setInstructorsMap(map);
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadLessons = async () => {
		try {
			const prevMonth = new Date(
				currentDate.getFullYear(),
				currentDate.getMonth() - 1,
				1
			);
			const nextMonth = new Date(
				currentDate.getFullYear(),
				currentDate.getMonth() + 1,
				1
			);

			if (selectedInstructor === 'all') {
				const [prevLessons, currentLessons, nextLessons] = await Promise.all([
					lessonService.getAllLessons(prevMonth),
					lessonService.getAllLessons(currentDate),
					lessonService.getAllLessons(nextMonth),
				]);

				const allLessons = [...prevLessons, ...currentLessons, ...nextLessons];
				const uniqueLessons = Array.from(
					new Map(allLessons.map((lesson) => [lesson.id, lesson])).values()
				);

				setLessons(uniqueLessons);
			} else {
				const [prevLessons, currentLessons, nextLessons] = await Promise.all([
					lessonService.getLessonsByInstructor(selectedInstructor, prevMonth),
					lessonService.getLessonsByInstructor(selectedInstructor, currentDate),
					lessonService.getLessonsByInstructor(selectedInstructor, nextMonth),
				]);

				const allLessons = [...prevLessons, ...currentLessons, ...nextLessons];
				const uniqueLessons = Array.from(
					new Map(allLessons.map((lesson) => [lesson.id, lesson])).values()
				);

				setLessons(uniqueLessons);
			}
		} catch (error) {
			console.error('Error loading lessons:', error);
		}
	};

	const studentNamesMap = new Map(
		students.map((s) => [s.id, `${s.firstName} ${s.lastName}`])
	);

	const generateEvents = (forView: View) => {
		if (instructorsMap.size === 0 || lessons.length === 0) return [];

		return lessons.map((lesson) => {
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

			// Format duration
			const h = Math.floor(lesson.duration);
			const m = Math.round((lesson.duration - h) * 60);
			const durationText = m > 0 ? `${h}h ${m}m` : `${h}h`;

			// Instruktor name
			const instructorName =
				instructorsMap.get(lesson.instructorId) || 'Nieznany';

			// Linie do wyświetlenia w week/day view
			const displayLines =
				forView === 'week' || forView === 'day'
					? [
							`${durationText} - ${instructorName}`,
							`Kursanci: ${studentNames || 'Brak'}`,
					  ]
					: [studentNames || 'Bez kursanta'];

			return {
				id: lesson.id,
				title: studentNames || 'Bez kursanta',
				start,
				end,
				resource: {
					...lesson,
					displayLines,
				},
			};
		});
	};

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

		const isHighlighted = highlightedLessonId === lesson.id;

		return {
			style: {
				backgroundColor,
				borderRadius: '4px',
				opacity: 0.9,
				color: 'white',
				border: isHighlighted ? '3px solid #ef4444' : '0px',
				boxShadow: isHighlighted ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none',
				display: 'block',
			},
		};
	};

	const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
		let newDate = new Date(currentDate);

		if (direction === 'today') {
			newDate = new Date();
			setSelectedDay(new Date());
		} else if (direction === 'prev') {
			if (view === 'month') {
				newDate = subMonths(currentDate, 1);
			} else if (view === 'week') {
				newDate = subWeeks(currentDate, 1);
			} else if (view === 'day') {
				newDate = subDays(currentDate, 1);
			}
		} else {
			if (view === 'month') {
				newDate = addMonths(currentDate, 1);
			} else if (view === 'week') {
				newDate = addWeeks(currentDate, 1);
			} else if (view === 'day') {
				newDate = addDays(currentDate, 1);
			}
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
		setSelectedInstructor(lesson.instructorId);
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

	const dayPropGetter = (date: Date) => {
		const isSelectedDay =
			format(date, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');

		return {
			className: isSelectedDay ? 'rbc-selected-day' : '',
		};
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	const canAddLesson = selectedInstructor && selectedInstructor !== 'all';

	const handleViewChange = (newView: View) => {
		setView(newView);

		// Gdy przełączamy na dzień/tydzień, ustaw currentDate na wybrany dzień
		if (newView === 'day' || newView === 'week') {
			setCurrentDate(selectedDay);
		}
	};

	const messages = {
		week: 'Tydzień',
		work_week: 'Tydzień pracy',
		day: 'Dzień',
		month: 'Miesiąc',
		previous: 'Poprzedni',
		next: 'Następny',
		today: 'Dziś',
		agenda: 'Agenda',
		showMore: (total: number) => `+${total}`,
	};

	return (
		<div className="flex h-full flex-col p-4 sm:p-8 pt-16">
			{!canAddLesson && (
				<div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
					Wybierz konkretnego instruktora, aby dodać lekcję
				</div>
			)}

			{/* Custom toolbar - RESPONSIVE */}
			<div className="mb-4 rounded-lg border bg-white p-3 sm:p-4">
				{/* Mobile - stacked layout */}
				<div className="flex flex-col gap-3 md:hidden">
					{/* Row 1: Dropdown + Button */}
					<div className="flex gap-2">
						<Select
							value={selectedInstructor}
							onChange={(e) => setSelectedInstructor(e.target.value)}
							className="flex-1">
							<option value="all">Wszyscy instruktorzy</option>
							{instructors.map((instructor) => (
								<option key={instructor.id} value={instructor.id}>
									{instructor.firstName} {instructor.lastName}
								</option>
							))}
						</Select>
						<Button
							onClick={handleAddLesson}
							disabled={!canAddLesson}
							size="sm">
							<Plus className="h-4 w-4" />
						</Button>
					</div>

					{/* Row 2: Navigation */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-1">
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
						</div>
						{view != 'day' && (
							<span className="text-sm font-semibold">
								{getDateRangeText()}
							</span>
						)}
					</div>

					{/* Row 3: View switcher */}
					<div className="flex gap-2">
						<Button
							variant={view === 'month' ? 'default' : 'outline'}
							size="sm"
							className="flex-1"
							onClick={() => handleViewChange('month')}>
							Miesiąc
						</Button>
						{/* <Button
							variant={view === 'week' ? 'default' : 'outline'}
							size="sm"
							className="flex-1"
							onClick={() => handleViewChange('week')}>
							Tydzień
						</Button> */}
						<Button
							variant={view === 'day' ? 'default' : 'outline'}
							size="sm"
							className="flex-1"
							onClick={() => handleViewChange('day')}>
							Dzień
						</Button>
					</div>
				</div>

				{/* Desktop - horizontal layout */}
				<div className="hidden md:flex md:items-center md:justify-between">
					<div className="flex items-center gap-2">
						<Select
							value={selectedInstructor}
							onChange={(e) => setSelectedInstructor(e.target.value)}
							className="w-48">
							<option value="all">Wszyscy instruktorzy</option>
							{instructors.map((instructor) => (
								<option key={instructor.id} value={instructor.id}>
									{instructor.firstName} {instructor.lastName}
								</option>
							))}
						</Select>
						<Button
							onClick={handleAddLesson}
							disabled={!canAddLesson}
							size="sm">
							<Plus className="mr-2 h-4 w-4" />
							Dodaj lekcję
						</Button>

						<div className="ml-4 mr-2 h-8 w-px bg-gray-300" />

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
							onClick={() => handleViewChange('month')}>
							Miesiąc
						</Button>
						<Button
							variant={view === 'week' ? 'default' : 'outline'}
							size="sm"
							onClick={() => handleViewChange('week')}>
							Tydzień
						</Button>
					</div>
				</div>
			</div>

			{/* Calendar views - POJEDYNCZE widoki dla mobile */}
			{view === 'month' ? (
				<div className="grid flex-1 gap-4 md:grid-cols-[2fr,1fr]">
					{/* Month view - full width na mobile */}
					<div className="rounded-lg border bg-white p-3">
						<Calendar
							localizer={localizer}
							events={generateEvents('month')}
							messages={messages}
							startAccessor="start"
							endAccessor="end"
							style={{ height: 'calc(100vh - 450px)', minHeight: '600px' }}
							date={currentDate}
							view="month"
							onNavigate={(newDate) => setCurrentDate(newDate)}
							onSelectSlot={(slotInfo) => handleDayClick(slotInfo.start)}
							selectable
							toolbar={false}
							eventPropGetter={eventStyleGetter}
							onSelectEvent={handleEventClick}
							dayPropGetter={dayPropGetter}
							formats={{
								timeGutterFormat: 'HH:mm',
								eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
									`${localizer?.format(
										start,
										'HH:mm',
										culture
									)} - ${localizer?.format(end, 'HH:mm', culture)}`,
								agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
									`${localizer?.format(
										start,
										'HH:mm',
										culture
									)} - ${localizer?.format(end, 'HH:mm', culture)}`,
							}}
						/>
					</div>

					{/* Day view sidebar - only desktop */}
					<div className="hidden rounded-lg border bg-white p-3 md:block">
						<div className="mb-2 text-center font-semibold">
							{format(selectedDay, 'd MMMM yyyy', { locale: pl })}
						</div>
						<Calendar
							components={{ event: EventComponent }}
							localizer={localizer}
							events={generateEvents('day').filter(
								// ZMIANA
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
							dayLayoutAlgorithm="no-overlap"
							eventPropGetter={eventStyleGetter}
							onSelectEvent={handleEventClick}
							formats={{
								timeGutterFormat: 'HH:mm',
								eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
									`${localizer?.format(
										start,
										'HH:mm',
										culture
									)} - ${localizer?.format(end, 'HH:mm', culture)}`,
								agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
									`${localizer?.format(
										start,
										'HH:mm',
										culture
									)} - ${localizer?.format(end, 'HH:mm', culture)}`,
							}}
						/>
					</div>
				</div>
			) : view === 'week' ? (
				<div className="flex-1 rounded-lg border bg-white p-3">
					<Calendar
						components={{
							event: EventComponent,
						}}
						localizer={localizer}
						events={generateEvents('week')}
						startAccessor="start"
						endAccessor="end"
						style={{ height: 'calc(100vh - 350px)', minHeight: '500px' }}
						date={currentDate}
						view="week"
						onNavigate={(newDate) => setCurrentDate(newDate)}
						toolbar={false}
						step={30}
						timeslots={2}
						min={new Date(2024, 0, 1, 6, 0)}
						max={new Date(2024, 0, 1, 22, 0)}
						dayLayoutAlgorithm="no-overlap"
						eventPropGetter={eventStyleGetter}
						onSelectEvent={handleEventClick}
						formats={{
							timeGutterFormat: 'HH:mm',
							eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
								`${localizer?.format(
									start,
									'HH:mm',
									culture
								)} - ${localizer?.format(end, 'HH:mm', culture)}`,
							agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
								`${localizer?.format(
									start,
									'HH:mm',
									culture
								)} - ${localizer?.format(end, 'HH:mm', culture)}`,
						}}
					/>
				</div>
			) : (
				/* Day view - standalone na mobile */
				<div className="flex-1 rounded-lg border bg-white p-3">
					<div className="mb-2 text-center font-semibold">
						{format(currentDate, 'd MMMM yyyy', { locale: pl })}
					</div>
					<Calendar
						components={{ event: EventComponent }} // DODAJ
						localizer={localizer}
						events={generateEvents('day').filter(
							// ZMIANA
							(e) =>
								format(e.start, 'yyyy-MM-dd') ===
								format(currentDate, 'yyyy-MM-dd')
						)}
						startAccessor="start"
						endAccessor="end"
						style={{ height: 'calc(100vh - 350px)', minHeight: '500px' }}
						date={currentDate}
						view="day"
						onNavigate={(newDate) => setCurrentDate(newDate)}
						toolbar={false}
						step={30}
						timeslots={2}
						min={new Date(2024, 0, 1, 6, 0)}
						max={new Date(2024, 0, 1, 22, 0)}
						dayLayoutAlgorithm="no-overlap"
						eventPropGetter={eventStyleGetter}
						onSelectEvent={handleEventClick}
						formats={{
							timeGutterFormat: 'HH:mm',
							eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
								`${localizer?.format(
									start,
									'HH:mm',
									culture
								)} - ${localizer?.format(end, 'HH:mm', culture)}`,
							agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
								`${localizer?.format(
									start,
									'HH:mm',
									culture
								)} - ${localizer?.format(end, 'HH:mm', culture)}`,
						}}
					/>
				</div>
			)}

			{/* Legend */}
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
			{selectedInstructor && selectedInstructor !== 'all' && (
				<LessonDialog
					open={lessonDialogOpen}
					onOpenChange={setLessonDialogOpen}
					instructorId={selectedInstructor}
					lesson={editingLesson}
					preselectedDate={view === 'month' ? selectedDay : currentDate}
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
