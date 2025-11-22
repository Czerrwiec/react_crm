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
import { carService } from '@/services/car.service';
import { studentService } from '@/services/student.service';
import { Button } from '@/components/ui/button';
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
	const [loading, setLoading] = useState(true);
	const [view, setView] = useState<View>('month');
	const [activeTab, setActiveTab] = useState<'calendar' | 'fleet'>('calendar');
	const [mobileView, setMobileView] = useState<'calendar' | 'list'>('calendar'); // NOWE
	const [selectedDay, setSelectedDay] = useState(new Date());

	// Dialogs
	const [carDialogOpen, setCarDialogOpen] = useState(false);
	const [editingCar, setEditingCar] = useState<Car | null>(null);
	const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
	const [editingReservation, setEditingReservation] =
		useState<CarReservation | null>(null);
	const [selectedCarForReservation, setSelectedCarForReservation] =
		useState<string>(''); // NOWE
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
	}, [currentDate, cars.length]);

	const loadInitialData = async () => {
		try {
			const [carsData, studentsData] = await Promise.all([
				carService.getAllCars(),
				studentService.getStudents(),
			]);
			setCars(carsData);
			setStudents(studentsData);
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			setLoading(false);
		}
	};

	const dayPropGetter = (date: Date) => {
		const isSelectedDay =
			format(date, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');

		return {
			className: isSelectedDay ? 'rbc-selected-day' : '',
		};
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

	const studentCityMap = new Map(students.map((s) => [s.id, s.city || 'Brak']));

	const carNamesMap = new Map(
		cars.map((c) => [c.id, c.registrationNumber || c.name])
	);
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

	const handleDayClick = (date: Date) => {
		setSelectedDay(date);
	};

	const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
		let newDate = new Date(currentDate);

		if (direction === 'today') {
			newDate = new Date();
		} else if (direction === 'prev') {
			if (view === 'month') {
				newDate = subMonths(currentDate, 1);
			} else if (view === 'week') {
				newDate = subWeeks(currentDate, 1);
			}
		} else {
			if (view === 'month') {
				newDate = addMonths(currentDate, 1);
			} else if (view === 'week') {
				newDate = addWeeks(currentDate, 1);
			}
		}

		setCurrentDate(newDate);
	};

	const handleEventClick = (event: CalendarEvent) => {
		setSelectedReservation(event.resource);
		setDetailDialogOpen(true);
	};

	const handleAddReservation = () => {
		if (cars.length === 0) {
			alert('Dodaj najpierw samochód');
			return;
		}
		setEditingReservation(null);
		setSelectedCarForReservation(cars[0].id); // Domyślnie pierwszy samochód
		setReservationDialogOpen(true);
	};

	const handleEditReservation = (reservation: CarReservation) => {
		setSelectedCarForReservation(reservation.carId);
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
	};

	// Filtruj rezerwacje dla obecnego miesiąca
	const currentMonthReservations = reservations
		.filter((r) => {
			const resDate = new Date(r.date);
			return (
				resDate.getMonth() === currentDate.getMonth() &&
				resDate.getFullYear() === currentDate.getFullYear()
			);
		})
		.sort((a, b) => {
			const dateCompare = a.date.localeCompare(b.date);
			if (dateCompare !== 0) return dateCompare;
			return a.startTime.localeCompare(b.startTime);
		});

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
		showMore: (total: number) => `+${total}`,
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
					{/* Custom toolbar */}
					<div className="mb-4 rounded-lg border bg-white p-3 sm:p-4">
						{/* Mobile */}
						<div className="flex flex-col gap-3 md:hidden">
							{/* Row 1: Navigation + Data + Button */}
							<div className="flex items-center justify-between gap-2">
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

								<span className="text-sm font-semibold">
									{format(currentDate, 'MMM yyyy', { locale: pl })}
								</span>

								<Button onClick={handleAddReservation} size="sm">
									<Plus className="h-4 w-4" />
								</Button>
							</div>

							{/* Mobile - przełącznik kalendarz/lista */}
							<div className="flex gap-2">
								<Button
									variant={mobileView === 'calendar' ? 'default' : 'outline'}
									size="sm"
									className="flex-1"
									onClick={() => setMobileView('calendar')}>
									Kalendarz
								</Button>
								<Button
									variant={mobileView === 'list' ? 'default' : 'outline'}
									size="sm"
									className="flex-1"
									onClick={() => setMobileView('list')}>
									Lista
								</Button>
							</div>
						</div>

						{/* Desktop */}
						<div className="hidden md:flex md:items-center md:justify-between">
							<div className="flex items-center gap-2">
								<Button onClick={handleAddReservation} size="sm">
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

					{/* Mobile - kalendarz LUB lista */}
					<div className="md:hidden">
						{mobileView === 'calendar' ? (
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
									toolbar={false}
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
									}}
								/>
							</div>
						) : (
							<ReservationsList
								reservations={currentMonthReservations}
								cars={cars}
								studentNamesMap={studentNamesMap}
								studentCityMap={studentCityMap}
								onReservationClick={(reservation) => {
									setSelectedReservation(reservation);
									setDetailDialogOpen(true);
								}}
							/>
						)}
					</div>

					{/* Desktop - kalendarz + lista */}
					<div className="hidden md:grid md:grid-cols-[2fr,1fr] md:gap-4">
						<div className="rounded-lg border bg-white p-3">
							<Calendar
								localizer={localizer}
								events={events}
								startAccessor="start"
								endAccessor="end"
								style={{ height: 'calc(100vh - 450px)', minHeight: '500px' }}
								date={currentDate}
								view={view} // ZMIANA: było view="month", teraz view={view}
								onNavigate={(newDate) => setCurrentDate(newDate)}
								onSelectSlot={(slotInfo) => handleDayClick(slotInfo.start)}
								selectable
								toolbar={false}
								step={30} // potrzebne dla week view
								timeslots={2} // potrzebne dla week view
								min={new Date(2024, 0, 1, 6, 0)} // start o 6:00
								max={new Date(2024, 0, 1, 18, 0)} // ZMIANA: koniec o 18:00 (było 22:00)
								dayLayoutAlgorithm="no-overlap"
								eventPropGetter={eventStyleGetter}
								onSelectEvent={handleEventClick}
								dayPropGetter={view === 'month' ? dayPropGetter : undefined} // tylko dla month
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
									weekdayFormat: (
										date,
										culture,
										localizer // dla week view
									) => localizer?.format(date, 'EEE', culture) || '',
									dayHeaderFormat: (
										date,
										culture,
										localizer // dla week view
									) =>
										`${localizer?.format(
											date,
											'EEE',
											culture
										)} ${localizer?.format(date, 'd', culture)}`,
								}}
							/>
						</div>

						<ReservationsList
							reservations={currentMonthReservations}
							cars={cars}
							studentNamesMap={studentNamesMap}
							studentCityMap={studentCityMap}
							onReservationClick={(reservation) => {
								setSelectedReservation(reservation);
								setDetailDialogOpen(true);
							}}
						/>
					</div>
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
										{car.registrationNumber && (
											<div className="text-sm text-gray-600 mt-1">
												<strong>Rejestracja:</strong> {car.registrationNumber}
											</div>
										)}
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

			{selectedCarForReservation && (
				<CarReservationDialog
					open={reservationDialogOpen}
					onOpenChange={setReservationDialogOpen}
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
		</div>
	);
}

// Komponent listy rezerwacji
function ReservationsList({
	reservations,
	cars,
	studentNamesMap,
	studentCityMap,
	onReservationClick,
}: {
	reservations: CarReservation[];
	cars: Car[];
	studentNamesMap: Map<string, string>;
	studentCityMap: Map<string, string>;
	onReservationClick: (reservation: CarReservation) => void;
}) {
	return (
		<div className="rounded-lg border bg-white p-4">
			<h3 className="font-semibold mb-3">Rezerwacje w tym miesiącu</h3>
			{reservations.length === 0 ? (
				<div className="text-sm text-gray-500 py-8 text-center">
					Brak rezerwacji
				</div>
			) : (
				<div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
					{reservations.map((reservation) => {
						const car = cars.find((c) => c.id === reservation.carId);
						const carLabel = car?.registrationNumber || car?.name || 'Nieznany';
						const studentNames = reservation.studentIds
							.map((id) => studentNamesMap.get(id))
							.filter(Boolean)
							.join(', ');
						const cities = [
							...new Set(
								reservation.studentIds
									.map((id) => studentCityMap.get(id))
									.filter(Boolean)
							),
						].join(', ');

						return (
							<div
								key={reservation.id}
								className="p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
								style={{ borderLeftColor: car?.color, borderLeftWidth: '4px' }}
								onClick={() => onReservationClick(reservation)}>
								<div className="text-sm font-medium">
									{format(new Date(reservation.date), 'dd.MM.yyyy', {
										locale: pl,
									})}{' '}
									• {reservation.startTime.slice(0, 5)} -{' '}
									{reservation.endTime.slice(0, 5)}
								</div>
								<div className="text-sm text-gray-700 mt-1">
									<strong>{carLabel}</strong>
								</div>
								{studentNames && (
									<div className="text-xs text-gray-600 mt-1">
										{studentNames}
									</div>
								)}
								{cities && (
									<div className="text-xs text-gray-500 mt-0.5">
										Miasto: {cities}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
