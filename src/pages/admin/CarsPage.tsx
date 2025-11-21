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
import { carService } from '@/services/car.service';
import { studentService } from '@/services/student.service';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import CarDialog from '@/components/CarDialog';
import CarReservationDialog from '@/components/CarReservationDialog';
import CarReservationDetailDialog from '@/components/CarReservationDetailDialog';
import type { Car, CarReservation, Student } from '@/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../admin/calendar.css';

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
	resource: CarReservation;
}

export default function CarsPage() {
	const [cars, setCars] = useState<Car[]>([]);
	const [students, setStudents] = useState<Student[]>([]);
	const [reservations, setReservations] = useState<CarReservation[]>([]);


	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedDay, setSelectedDay] = useState(new Date());
	const [loading, setLoading] = useState(true);
	const [view, setView] = useState<View>('month');
	const [activeTab, setActiveTab] = useState<'calendar' | 'fleet'>('calendar');

	// Dialogs
	const [carDialogOpen, setCarDialogOpen] = useState(false);
	const [editingCar, setEditingCar] = useState<Car | null>(null);
	const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
	const [editingReservation, setEditingReservation] =
		useState<CarReservation | null>(null);
	const [detailDialogOpen, setDetailDialogOpen] = useState(false);
	const [selectedReservation, setSelectedReservation] =
		useState<CarReservation | null>(null);

	useEffect(() => {
		loadInitialData();
	}, []);

	useEffect(() => {
		if (cars.length > 0) {
			loadReservations();
		}
	}, [currentDate]);

	const loadInitialData = async () => {
		try {
			const [carsData, studentsData] = await Promise.all([
				carService.getAllCars(),
				studentService.getStudents(),
			]);
			setCars(carsData);
			setStudents(studentsData);

			if (carsData.length > 0) {
				setSelectedCar(carsData[0].id);
			}
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadReservations = async () => {
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

			const [prevReservations, currentReservations, nextReservations] =
				await Promise.all([
					carService.getReservationsByMonth(prevMonth),
					carService.getReservationsByMonth(currentDate),
					carService.getReservationsByMonth(nextMonth),
				]);

			const allReservations = [
				...prevReservations,
				...currentReservations,
				...nextReservations,
			];
			const uniqueReservations = Array.from(
				new Map(allReservations.map((r) => [r.id, r])).values()
			);

			setReservations(uniqueReservations);
		} catch (error) {
			console.error('Error loading reservations:', error);
		}
	};

	const studentNamesMap = new Map(
		students.map((s) => [s.id, `${s.firstName} ${s.lastName}`])
	);

	const carNamesMap = new Map(cars.map((c) => [c.id, c.name]));
	const carColorsMap = new Map(cars.map((c) => [c.id, c.color || '#3b82f6']));

	const events: CalendarEvent[] = reservations.map((reservation) => {
		const [startHour, startMinute] = reservation.startTime
			.split(':')
			.map(Number);
		const [endHour, endMinute] = reservation.endTime.split(':').map(Number);

		const date = new Date(reservation.date);
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

		const car = cars.find((c) => c.id === reservation.carId);
		const carLabel = car?.registrationNumber || car?.name || 'Nieznany';
		const studentNames = reservation.studentIds
			.map((id) => studentNamesMap.get(id) || 'Nieznany')
			.join(', ');

		return {
			id: reservation.id,
			title: `${carLabel} - ${studentNames || 'Bez kursanta'}`,
			start,
			end,
			resource: reservation,
		};
	});

	const eventStyleGetter = (event: CalendarEvent) => {
		const reservation = event.resource;
		const backgroundColor = carColorsMap.get(reservation.carId) || '#3b82f6';

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
	};

	const handleEventClick = (event: CalendarEvent) => {
		setSelectedReservation(event.resource);
		setDetailDialogOpen(true);
	};

	const handleDayClick = (date: Date) => {
		setSelectedDay(date);
	};

	const handleAddReservation = () => {
		setEditingReservation(null);
		setReservationDialogOpen(true);
	};

	const handleEditReservation = (reservation: CarReservation) => {
		setSelectedCar(reservation.carId);
		setEditingReservation(reservation);
		setReservationDialogOpen(true);
	};

	const handleAddCar = () => {
		setEditingCar(null);
		setCarDialogOpen(true);
	};

	const handleEditCar = (car: Car) => {
		setEditingCar(car);
		setCarDialogOpen(true);
	};

	const handleDeleteCar = async (id: string) => {
		if (!confirm('Czy na pewno chcesz usunąć ten samochód?')) return;

		try {
			await carService.deleteCar(id);
			loadInitialData();
		} catch (error) {
			console.error('Error deleting car:', error);
			alert('Błąd usuwania samochodu');
		}
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

	const handleViewChange = (newView: View) => {
		setView(newView);

		// Gdy przełączamy na dzień/tydzień, ustaw currentDate na wybrany dzień
		if (newView === 'day' || newView === 'week') {
			setCurrentDate(selectedDay);
		}
	};

	const canAddReservation = selectedCar && selectedCar !== 'all';

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	const messages = {
		week: 'Tydzień',
		work_week: 'Tydzień pracy',
		day: 'Dzień',
		month: 'Miesiąc',
		previous: 'Poprzedni',
		next: 'Następny',
		today: 'Dziś',
		agenda: 'Agenda',
		showMore: (total: number) => `+${total} więcej`,
	};

	return (
		<div className="p-4 sm:p-8 pt-14">
			{/* Tabs */}
			<div className="mb-6 flex gap-2 border-b">
				<button
					className={`px-4 py-2 text-sm font-medium transition-colors ${
						activeTab === 'calendar'
							? 'border-b-2 border-primary text-primary'
							: 'text-gray-600 hover:text-gray-900'
					}`}
					onClick={() => setActiveTab('calendar')}>
					Kalendarz rezerwacji
				</button>
				<button
					className={`px-4 py-2 text-sm font-medium transition-colors ${
						activeTab === 'fleet'
							? 'border-b-2 border-primary text-primary'
							: 'text-gray-600 hover:text-gray-900'
					}`}
					onClick={() => setActiveTab('fleet')}>
					Flota
				</button>
			</div>

			{activeTab === 'calendar' ? (
				<div className="flex h-full flex-col">
					{!canAddReservation && (
						<div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
							Wybierz konkretny samochód, aby dodać rezerwację
						</div>
					)}

					{/* Custom toolbar - RESPONSIVE */}
					<div className="mb-4 rounded-lg border bg-white p-3 sm:p-4">
						{/* Mobile */}
						<div className="flex flex-col gap-3 md:hidden">
							{/* Row 1: Dropdown + Button w linii z hamburgerem */}
							<div className="flex items-center gap-2">
								<Select
									value={selectedCar}
									onChange={(e) => setSelectedCar(e.target.value)}
									className="flex-1 text-sm">
									<option value="all">Wszystkie</option>
									{cars
										.filter((c) => c.active)
										.map((car) => (
											<option key={car.id} value={car.id}>
												{car.name}
											</option>
										))}
								</Select>
								<Button
									onClick={handleAddReservation}
									disabled={!canAddReservation}
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
								<Button
									variant={view === 'week' ? 'default' : 'outline'}
									size="sm"
									className="flex-1"
									onClick={() => handleViewChange('week')}>
									Tydzień
								</Button>
								<Button
									variant={view === 'day' ? 'default' : 'outline'}
									size="sm"
									className="flex-1"
									onClick={() => handleViewChange('day')}>
									Dzień
								</Button>
							</div>
						</div>

						{/* Desktop */}
						<div className="hidden md:flex md:items-center md:justify-between">
							<div className="flex items-center gap-2">
								<Select
									value={selectedCar}
									onChange={(e) => setSelectedCar(e.target.value)}
									className="w-48">
									<option value="all">Wszystkie samochody</option>
									{cars
										.filter((c) => c.active)
										.map((car) => (
											<option key={car.id} value={car.id}>
												{car.name}
											</option>
										))}
								</Select>
								<Button
									onClick={handleAddReservation}
									disabled={!canAddReservation}
									size="sm">
									<Plus className="mr-2 h-4 w-4" />
									Dodaj rezerwację
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
									messages={messages}
									culture="pl"
									localizer={localizer}
									events={events}
									startAccessor="start"
									endAccessor="end"
									style={{ height: 'calc(100vh - 450px)', minHeight: '500px' }}
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
										eventTimeRangeFormat: (
											{ start, end },
											culture,
											localizer
										) =>
											`${localizer?.format(
												start,
												'HH:mm',
												culture
											)} - ${localizer?.format(end, 'HH:mm', culture)}`,
										agendaTimeRangeFormat: (
											{ start, end },
											culture,
											localizer
										) =>
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
									style={{ height: 'calc(100vh - 450px)', minHeight: '500px' }}
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
									formats={{
										timeGutterFormat: 'HH:mm',
										eventTimeRangeFormat: (
											{ start, end },
											culture,
											localizer
										) =>
											`${localizer?.format(
												start,
												'HH:mm',
												culture
											)} - ${localizer?.format(end, 'HH:mm', culture)}`,
										agendaTimeRangeFormat: (
											{ start, end },
											culture,
											localizer
										) =>
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
								culture="pl"
								messages={messages}
								localizer={localizer}
								events={events}
								startAccessor="start"
								endAccessor="end"
								style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}
								date={currentDate}
								view="week"
								onNavigate={(newDate) => setCurrentDate(newDate)}
								toolbar={false}
								step={30}
								timeslots={2}
								min={new Date(2024, 0, 1, 6, 0)}
								max={new Date(2024, 0, 1, 22, 0)}
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
									weekdayFormat: (date, culture, localizer) =>
										localizer?.format(date, 'EEE', culture) || '',
									dayHeaderFormat: (date, culture, localizer) =>
										`${localizer?.format(
											date,
											'EEE',
											culture
										)} ${localizer?.format(date, 'd', culture)}`,
								}}
							/>
						</div>
					) : (
						<div className="flex-1 rounded-lg border bg-white p-3">
							<div className="mb-2 text-center font-semibold md:hidden">
								{format(currentDate, 'd MMMM yyyy', { locale: pl })}
							</div>
							<Calendar
								localizer={localizer}
								events={events.filter(
									(e) =>
										format(e.start, 'yyyy-MM-dd') ===
										format(currentDate, 'yyyy-MM-dd')
								)}
								startAccessor="start"
								endAccessor="end"
								style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}
								date={currentDate}
								view="day"
								onNavigate={(newDate) => setCurrentDate(newDate)}
								toolbar={false}
								step={30}
								timeslots={2}
								min={new Date(2024, 0, 1, 6, 0)}
								max={new Date(2024, 0, 1, 22, 0)}
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
				</div>
			) : (
				/* Fleet tab */
				<div>
					<div className="mb-4 flex justify-end">
						<Button onClick={handleAddCar}>
							<Plus className="mr-2 h-4 w-4" />
							Dodaj samochód
						</Button>
					</div>

					<div className="grid gap-4">
						{cars.map((car) => (
							<div
								key={car.id}
								className={`rounded-lg border bg-white p-4 ${
									!car.active ? 'opacity-60' : ''
								}`}>
								<div className="flex items-start justify-between">
									<div
										className="flex-1 cursor-pointer"
										onClick={() => handleEditCar(car)}>
										<h3 className="text-lg font-semibold">
											{car.name} ({car.year})
										</h3>
										<div className="mt-2 space-y-1 text-sm text-gray-600">
											{car.inspectionDate && (
												<div>
													<strong>Przegląd:</strong>{' '}
													{format(new Date(car.inspectionDate), 'dd.MM.yyyy')}
												</div>
											)}
											{car.insuranceDate && (
												<div>
													<strong>Ubezpieczenie:</strong>{' '}
													{format(new Date(car.insuranceDate), 'dd.MM.yyyy')}
												</div>
											)}
										</div>
									</div>
									<Button
										variant="destructive"
										size="sm"
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteCar(car.id);
										}}>
										Usuń
									</Button>
								</div>
							</div>
						))}

						{cars.length === 0 && (
							<div className="py-12 text-center text-gray-500">
								Brak samochodów w bazie
							</div>
						)}
					</div>
				</div>
			)}

			{/* Dialogs */}
			<CarDialog
				open={carDialogOpen}
				onOpenChange={setCarDialogOpen}
				car={editingCar}
				onSuccess={loadInitialData}
			/>

			{canAddReservation && (
				<CarReservationDialog
					open={reservationDialogOpen}
					onOpenChange={setReservationDialogOpen}
					carId={selectedCar}
					reservation={editingReservation}
					preselectedDate={selectedDay}
					onSuccess={loadReservations}
				/>
			)}

			<CarReservationDetailDialog
				open={detailDialogOpen}
				onOpenChange={setDetailDialogOpen}
				reservation={selectedReservation}
				carNames={carNamesMap}
				studentNames={studentNamesMap}
				onEdit={handleEditReservation}
				onSuccess={loadReservations}
			/>

			{(selectedCar !== 'all' || editingReservation) && (
				<CarReservationDialog
					open={reservationDialogOpen}
					onOpenChange={setReservationDialogOpen}
					carId={editingReservation ? editingReservation.carId : selectedCar}
					reservation={editingReservation}
					preselectedDate={selectedDay}
					onSuccess={loadReservations}
				/>
			)}
		</div>
	);
}
