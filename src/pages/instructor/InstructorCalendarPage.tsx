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
	addDays,
	subDays,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { lessonService } from '@/services/lesson.service';
import { studentService } from '@/services/student.service';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import LessonDialog from '@/components/LessonDialog';
import LessonDetailDialog from '@/components/LessonDetailDialog';
import MobileDayView from '@/components/mobile/MobileDayView';
import MobileMonthView from '@/components/mobile/MobileMonthView';
import type { Lesson } from '@/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../pages/admin/calendar.css';

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

export default function InstructorCalendarPage() {
	const { user } = useAuth();
	const isMobile = useIsMobile();
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [studentNamesMap, setStudentNamesMap] = useState<Map<string, string>>(new Map());
	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedDay, setSelectedDay] = useState(new Date());
	const [loading, setLoading] = useState(true);
	const [view, setView] = useState<View>('month');

	// Mobile state
	const [showMonthView, setShowMonthView] = useState(false);
	const [selectedHour, setSelectedHour] = useState<number | null>(null);
	const [selectedMinute, setSelectedMinute] = useState<number>(0);

	// Dialogs
	const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
	const [detailDialogOpen, setDetailDialogOpen] = useState(false);
	const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
	const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

	useEffect(() => {
		if (user) {
			loadInitialData();
		}
	}, [user]);

	useEffect(() => {
		if (user) {
			loadLessons();
		}
	}, [currentDate, user]);

	const loadInitialData = async () => {
		try {
			const studentsData = await studentService.getStudents();
			
			// Create names map
			const namesMap = new Map(
				studentsData.map((s) => [s.id, `${s.firstName} ${s.lastName}`])
			);
			setStudentNamesMap(namesMap);
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadLessons = async () => {
		if (!user) return;

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

			const [prevLessons, currentLessons, nextLessons] = await Promise.all([
				lessonService.getLessonsByInstructor(user.id, prevMonth),
				lessonService.getLessonsByInstructor(user.id, currentDate),
				lessonService.getLessonsByInstructor(user.id, nextMonth),
			]);

			const allLessons = [...prevLessons, ...currentLessons, ...nextLessons];
			const uniqueLessons = Array.from(
				new Map(allLessons.map((lesson) => [lesson.id, lesson])).values()
			);

			setLessons(uniqueLessons);
		} catch (error) {
			console.error('Error loading lessons:', error);
		}
	};

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

	const dayPropGetter = (date: Date) => {
		const isSelectedDay =
			format(date, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');

		return {
			className: isSelectedDay ? 'rbc-selected-day' : '',
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

		// DODAJ TO:
		if (view === 'day') {
			setSelectedDay(newDate);
		}
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
		// UÅ¼ywaj selectedDay zamiast currentDate
		setLessonDialogOpen(true);
	};

	const handleEditLesson = (lesson: Lesson) => {
		setEditingLesson(lesson);
		setLessonDialogOpen(true);
	};

	// Mobile handlers
	const handleMobileAddLesson = (hour: number, minute: number) => {
		setSelectedHour(hour);
		setSelectedMinute(minute);
		setEditingLesson(null);
		setLessonDialogOpen(true);
	};

	const handleMobileLessonClick = (lesson: Lesson) => {
		setSelectedLesson(lesson);
		setDetailDialogOpen(true);
	};

	const handleMonthDateSelect = (date: Date) => {
		setCurrentDate(date);
		setShowMonthView(false);
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

	const DayEventComponent = ({ event }: any) => {
		const lesson = event.resource;
		const studentNames = lesson.studentIds
			.map((id: string) => studentNamesMap.get(id) || 'Nieznany')
			.join(', ');

		const h = Math.floor(lesson.duration);
		const m = Math.round((lesson.duration - h) * 60);
		const durationText = m > 0 ? `${h}h ${m}m` : `${h}h`;

		return (
			<div style={{ padding: '4px', fontSize: '13px', lineHeight: '1.3' }}>
				<div style={{ fontWeight: 'bold' }}>
					{studentNames || 'Bez kursanta'}
				</div>
				<div style={{ fontSize: '11px', marginTop: '2px' }}>
					{durationText}, {lesson.startTime.slice(0, 5)}-
					{lesson.endTime.slice(0, 5)}
				</div>
			</div>
		);
	};

	const handleViewChange = (newView: View) => {
		setView(newView);

		// Gdy przeÅ‚Ä…czamy na dzieÅ„/tydzieÅ„ z miesiÄ…ca, ustaw currentDate na wybrany dzieÅ„
		if ((newView === 'day' || newView === 'week') && view === 'month') {
			setCurrentDate(selectedDay);
			setSelectedDay(selectedDay); // Synchronizuj
		}

		// DODAJ: Gdy przeÅ‚Ä…czamy na dzieÅ„, ustaw teÅ¼ selectedDay
		if (newView === 'day' && view !== 'month') {
			setSelectedDay(currentDate);
		}
	};

	const WeekEventComponent = () => {
		return <div style={{ height: '100%' }} />; // Pusty komponent
	};

	const messages = {
		week: 'TydzieÅ„',
		work_week: 'TydzieÅ„ pracy',
		day: 'DzieÅ„',
		month: 'MiesiÄ…c',
		previous: 'Poprzedni',
		next: 'NastÄ™pny',
		today: 'DziÅ›',
		agenda: 'Agenda',
		showMore: (total: number) => `+${total}`,
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	// MOBILE VIEW
	if (isMobile) {
		return (
			<>
				<MobileDayView
					currentDate={currentDate}
					onDateChange={setCurrentDate}
					lessons={lessons}
					studentNamesMap={studentNamesMap}
					onLessonClick={handleMobileLessonClick}
					onAddLesson={handleMobileAddLesson}
					onOpenMonthView={() => setShowMonthView(true)}
					instructorId={user!.id}
				/>

				{showMonthView && (
					<MobileMonthView
						currentDate={currentDate}
						lessons={lessons}
						studentNamesMap={studentNamesMap}
						instructorId={user!.id}
						onSelectDate={handleMonthDateSelect}
						onClose={() => setShowMonthView(false)}
					/>
				)}

				{/* Dialogs */}
				{user && (
					<LessonDialog
						open={lessonDialogOpen}
						onOpenChange={(open) => {
							setLessonDialogOpen(open);
							if (!open) {
								setSelectedHour(null);
								setSelectedMinute(0);
							}
						}}
						instructorId={user.id}
						lesson={editingLesson}
						preselectedDate={currentDate}
						preselectedTime={
							selectedHour !== null
								? `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`
								: undefined
						}
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
			</>
		);
	}

	// DESKTOP VIEW (bez zmian)

	return (
		<div className="flex h-full flex-col p-4 sm:p-8 pt-16">
			{/* Custom toolbar */}
			<div className="mb-4 rounded-lg border bg-white p-3 sm:p-4">
				{/* Mobile */}
				<div className="flex flex-col gap-3 md:hidden">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleNavigate('today')}>
								DziÅ›
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

						<span className="text-sm font-semibold capitalize">
							{format(currentDate, 'LLLL', { locale: pl })}
						</span>

						<Button onClick={handleAddLesson} size="sm">
							<Plus className="h-4 w-4" />
						</Button>
					</div>

					<div className="flex gap-2">
						<Button
							variant={view === 'month' ? 'default' : 'outline'}
							size="sm"
							className="flex-1"
							onClick={() => handleViewChange('month')}>
							MiesiÄ…c
						</Button>
						<Button
							variant={view === 'week' ? 'default' : 'outline'}
							size="sm"
							className="flex-1"
							onClick={() => handleViewChange('week')}>
							TydzieÅ„
						</Button>
						<Button
							variant={view === 'day' ? 'default' : 'outline'}
							size="sm"
							className="flex-1"
							onClick={() => handleViewChange('day')}>
							DzieÅ„
						</Button>
					</div>
				</div>

				{/* Desktop */}
				<div className="hidden md:flex md:items-center md:justify-between">
					<div className="flex items-center gap-2">
						<Button onClick={handleAddLesson} size="sm">
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

			{/* Calendar views */}
			{view === 'month' ? (
				<div className="grid flex-1 gap-4 md:grid-cols-[2fr,1fr]">
					<div className="rounded-lg border bg-white p-3">
						<Calendar
							localizer={localizer}
							events={events}
							startAccessor="start"
							endAccessor="end"
							style={{ height: 'calc(100vh - 350px)', minHeight: '520px' }}
							date={currentDate}
							view="month"
							onNavigate={(newDate) => setCurrentDate(newDate)}
							onSelectSlot={(slotInfo) => handleDayClick(slotInfo.start)}
							selectable
							toolbar={false}
							dayLayoutAlgorithm="no-overlap"
							eventPropGetter={eventStyleGetter}
							onSelectEvent={handleEventClick}
							dayPropGetter={dayPropGetter}
							messages={messages}
							culture="pl"
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

					<div className="hidden rounded-lg border bg-white p-3 md:block">
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
							dayLayoutAlgorithm="no-overlap"
							eventPropGetter={eventStyleGetter}
							onSelectEvent={handleEventClick}
							messages={messages}
							culture="pl"
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
							event: WeekEventComponent,
						}}
						localizer={localizer}
						events={events}
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
						max={new Date(2024, 0, 1, 23, 0)}
						dayLayoutAlgorithm="no-overlap"
						eventPropGetter={eventStyleGetter}
						onSelectEvent={handleEventClick}
						messages={messages}
						culture="pl"
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
							weekdayFormat: (date, culture, localizer) =>
								localizer?.format(date, 'EEE', culture) || '',
							dayHeaderFormat: (date, culture, localizer) =>
								`${localizer?.format(date, 'EEE', culture)} ${localizer?.format(
									date,
									'd',
									culture
								)}`,
						}}
					/>
				</div>
			) : (
				<div className="flex-1 rounded-lg border bg-white p-3">
					<div className="mb-2 text-center font-semibold md:hidden">
						{format(currentDate, 'd MMMM yyyy', { locale: pl })}
					</div>
					<Calendar
						components={{
							event: DayEventComponent,
						}}
						localizer={localizer}
						events={events.filter(
							(e) =>
								format(e.start, 'yyyy-MM-dd') ===
								format(currentDate, 'yyyy-MM-dd')
						)}
						startAccessor="start"
						endAccessor="end"
						style={{ height: 'calc(100vh - 350px)', minHeight: '520px' }}
						date={currentDate}
						view="day"
						onNavigate={(newDate) => setCurrentDate(newDate)}
						toolbar={false}
						step={30}
						timeslots={2}
						min={new Date(2024, 0, 1, 6, 0)}
						max={new Date(2024, 0, 1, 23, 0)}
						dayLayoutAlgorithm="no-overlap"
						eventPropGetter={eventStyleGetter}
						onSelectEvent={handleEventClick}
						messages={messages}
						culture="pl"
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

			{/* Dialogs */}
			{user && (
				<LessonDialog
					open={lessonDialogOpen}
					onOpenChange={setLessonDialogOpen}
					instructorId={user.id}
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
