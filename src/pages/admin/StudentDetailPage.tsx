import 'react-big-calendar/lib/css/react-big-calendar.css';// nie pomogło
import '../admin/calendar.css';// nie pomogło 
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { studentService } from '@/services/student.service';
import { paymentService } from '@/services/payment.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	ArrowLeft,
	Plus,
	Trash2,
	Pencil,
	CheckCircle2,
	Clock,
	XCircle,
	User,
	Calendar as CalendarIcon,
	Car as CarIcon,
	Save,
	X,
	MapPin,
	Phone,
	Mail,
	CreditCard,
	Hash,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react';
import { carService } from '@/services/car.service';
import type { Student, Payment, Lesson, CarReservation, Car } from '@/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { getStateExamStatusColor } from '@/lib/student-utilis';
import { Textarea } from '@/components/ui/textarea';

const locales = { pl };
const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek: () => startOfWeek(new Date(), { locale: pl }),
	getDay,
	locales,
});

interface PaymentWithCreator extends Payment {
	createdByName?: string | null;
	updatedByName?: string | null;
}

export default function StudentDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user, role } = useAuth(); //
	const [student, setStudent] = useState<Student | null>(null);
	const [payments, setPayments] = useState<PaymentWithCreator[]>([]);
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [calendarMonth, setCalendarMonth] = useState(new Date());
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<'info' | 'calendar'>('info');
	const [carReservation, setCarReservation] = useState<CarReservation | null>(
		null,
	);
	const [reservedCar, setReservedCar] = useState<Car | null>(null);
	const [instructorsMap, setInstructorsMap] = useState<Map<string, string>>(
		new Map(),
	);
	const [packageName, setPackageName] = useState<string | null>(null);
	const [packageHours, setPackageHours] = useState<number>(30);
	const [editingNotes, setEditingNotes] = useState(false);
	const [notesValue, setNotesValue] = useState('');
	const [savingNotes, setSavingNotes] = useState(false);

	useEffect(() => {
		if (id) loadData(id);
	}, [id]);

	useEffect(() => {
		if (student) {
			setNotesValue(student.notes || '');
		}
	}, [student]);

	useEffect(() => {
		if (id && student) {
			loadLessonsForMonth(id, calendarMonth);
		}
	}, [calendarMonth, id, student]);

	const loadLessonsForMonth = async (studentId: string, month: Date) => {
		const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
		const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);

		const startDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1)
			.toISOString()
			.split('T')[0];

		const endDate = new Date(
			nextMonth.getFullYear(),
			nextMonth.getMonth() + 1,
			0,
		)
			.toISOString()
			.split('T')[0];

		const { data: lessonsData, error } = await supabase
			.from('lessons')
			.select('*')
			.contains('student_ids', [studentId])
			.gte('date', startDate)
			.lte('date', endDate)
			.order('date')
			.order('start_time');

		if (error) {
			console.error('Error loading lessons:', error);
			return;
		}

		const mappedLessons = lessonsData.map((lesson: any) => ({
			id: lesson.id,
			studentIds: lesson.student_ids || [],
			instructorId: lesson.instructor_id,
			date: lesson.date,
			startTime: lesson.start_time,
			endTime: lesson.end_time,
			duration: lesson.duration,
			status: lesson.status,
			notes: lesson.notes,
			createdAt: lesson.created_at,
			updatedAt: lesson.updated_at,
		}));

		setLessons(mappedLessons);
	};

	const loadData = async (studentId: string) => {
		try {
			const [studentData, paymentsData] = await Promise.all([
				studentService.getStudent(studentId),
				paymentService.getPaymentsByStudent(studentId),
			]);

			setStudent(studentData);

			let hoursToSet = 30; // default

			if (studentData.packageId) {
				const { data: pkg } = await supabase
					.from('packages')
					.select('name, hours')
					.eq('id', studentData.packageId)
					.single();

				if (pkg) {
					setPackageName(`${pkg.name} ${pkg.hours}h`);
					hoursToSet = pkg.hours;
				}
			}
			// Nadpisz godzinami custom jeśli są ustawione
			if (studentData.customCourseHours) {
				hoursToSet = studentData.customCourseHours;
			}

			setPackageHours(hoursToSet);

			const { data: instructors } = await supabase
				.from('users')
				.select('id, first_name, last_name')
				.eq('role', 'instructor');

			const map = new Map(
				instructors?.map((i) => [i.id, `${i.first_name} ${i.last_name}`]) || [],
			);
			setInstructorsMap(map);

			const paymentsWithCreators = await Promise.all(
				paymentsData.map(async (payment) => {
					const createdByName = payment.createdBy
						? await paymentService.getCreatedByName(payment.createdBy)
						: null;
					const updatedByName = payment.updatedBy
						? await paymentService.getCreatedByName(payment.updatedBy)
						: null;
					return {
						...payment,
						createdByName,
						updatedByName,
					};
				}),
			);

			setPayments(paymentsWithCreators);

			if (studentData.instructorIds.length > 0) {
				loadLessonsForMonth(studentId, calendarMonth);
			}

			if (studentData.car) {
				const reservation = await carService.getReservationByStudent(studentId);
				if (reservation) {
					setCarReservation(reservation);
					const car = await carService.getCar(reservation.carId);
					setReservedCar(car);
				}
			}
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			setLoading(false);
		}
	};

	const events = lessons.map((lesson) => {
		const [startHour, startMinute] = lesson.startTime.split(':').map(Number);
		const [endHour, endMinute] = lesson.endTime.split(':').map(Number);

		const date = new Date(lesson.date);
		const start = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			startHour,
			startMinute,
		);
		const end = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			endHour,
			endMinute,
		);

		const startShort = lesson.startTime.slice(0, 5); // "10:00"
		const endShort = lesson.endTime.slice(0, 5);

		return {
			id: lesson.id,
			title: `${startShort} - ${endShort}`,
			start,
			end,
			resource: lesson,
		};
	});

	const eventStyleGetter = (event: any) => {
		let backgroundColor = '#3174ad';
		switch (event.resource.status) {
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
			},
		};
	};

	// Helper do formatowania telefonu
	const formatPhone = (phone: string | null) => {
		if (!phone) return null;
		const cleaned = phone.replace(/\D/g, '');
		if (cleaned.length === 9) {
			return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
				6,
			)}`;
		}
		return phone;
	};

	const handleSaveNotes = async () => {
		if (!id) return;

		setSavingNotes(true);
		try {
			await studentService.updateStudent(id, { notes: notesValue });
			setStudent((prev) => (prev ? { ...prev, notes: notesValue } : null));
			setEditingNotes(false);
		} catch (error) {
			console.error('Error saving notes:', error);
			alert('Błąd zapisywania notatek');
		} finally {
			setSavingNotes(false);
		}
	};

	const handleCancelNotes = () => {
		setNotesValue(student?.notes || '');
		setEditingNotes(false);
	};

	const totalPaid = payments
		.filter((p) => p.type === 'course')
		.reduce((sum, p) => sum + p.amount, 0);
	const extraHoursPaid = payments
		.filter((p) => p.type === 'extra_lessons')
		.reduce((sum, p) => sum + p.amount, 0);
	const outstanding = student ? student.coursePrice - totalPaid : 0;

	const formatHours = (hours: number) => {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	};

	const calculateProgress = (current: number, total: number) => {
		const percentage = total > 0 ? (current / total) * 100 : 0;
		return Math.min(percentage, 100);
	};

	const getProgressColor = (percentage: number) => {
		if (percentage >= 80) return 'bg-green-500';
		if (percentage >= 50) return 'bg-amber-500';
		return 'bg-blue-500';
	};

	const canEditStateExam = student
		? student.profileUpdated &&
			student.internalTheoryPassed &&
			student.internalPracticePassed
		: false;

	if (loading || !student) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col">
			{/* Fixed Header */}
			<div className="flex-shrink-0 border-b bg-white p-4 sm:p-8 pt-16">
				<div className="mb-4 flex items-center justify-between">
					<div className="flex-1 min-w-0">
						<h1 className="truncate text-xl font-bold sm:text-3xl">
							{student.firstName} {student.lastName}
						</h1>
						<div className="mt-2 flex flex-wrap gap-2">
							{student.coursePaid && (
								<Badge className="text-xs">Opłacony</Badge>
							)}
							{student.isSupplementaryCourse && (
								<Badge variant="secondary" className="text-xs">
									Kurs uzupełniający
								</Badge>
							)}
							{student.car && (
								<Badge variant="secondary" className="text-xs">
									Auto na egzamin
								</Badge>
							)}
						</div>
					</div>

					{/* MOBILE – góra-prawo */}
					<div className="sm:hidden absolute right-4 top-4 z-10 flex gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() =>
								navigate(
									role === 'admin' ? '/admin/students' : '/instructor/students',
								)
							}>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						{role === 'admin' && (
							<Button
								size="icon"
								onClick={() => navigate(`/admin/students/${id}/edit`)}>
								<Pencil className="h-4 w-4" />
							</Button>
						)}
					</div>

					{/* DESKTOP – w linii z imieniem */}
					<div className="hidden sm:flex items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							onClick={() =>
								navigate(
									role === 'admin' ? '/admin/students' : '/instructor/students',
								)
							}>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						{role === 'admin' && (
							<Button onClick={() => navigate(`/admin/students/${id}/edit`)}>
								Edytuj kursanta
							</Button>
						)}
					</div>
				</div>

				{/* Tabs */}
				<div className="flex gap-2 border-b -mb-4">
					<button
						className={`px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
							activeTab === 'info'
								? 'border-b-2 border-primary text-primary'
								: 'text-gray-600 hover:text-gray-900'
						}`}
						onClick={() => setActiveTab('info')}>
						Informacje
					</button>
					<button
						className={`px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
							activeTab === 'calendar'
								? 'border-b-2 border-primary text-primary'
								: 'text-gray-600 hover:text-gray-900'
						}`}
						onClick={() => setActiveTab('calendar')}>
						Kalendarz
					</button>
				</div>
			</div>

			{/* Scrollable Content */}
			<div className="flex-1 overflow-auto">
				<div className="p-3 sm:p-8">
					{activeTab === 'info' ? (
						<div className="grid gap-3 sm:gap-6 md:grid-cols-3">
							<Card>
								<CardHeader className="pb-3 sm:pb-6">
									<CardTitle className="text-base sm:text-2xl">
										Dane personalne
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2">
									{student.pkkNumber && (
										<div className="flex items-center gap-2">
											<CreditCard className="h-4 w-4 text-blue-600 flex-shrink-0" />
											<div>
												<strong>PKK:</strong> {student.pkkNumber}
											</div>
										</div>
									)}
									{student.pesel && (
										<div className="flex items-center gap-2">
											<Hash className="h-4 w-4 text-purple-600 flex-shrink-0" />
											<div>
												<strong>PESEL:</strong> {student.pesel}
											</div>
										</div>
									)}
									{/* {student.phone && (
										<div className="flex items-center gap-2">
											<Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
											<div>
												<strong>Telefon:</strong>{' '}
												<a
													href={`tel:${student.phone}`}
													className="text-primary hover:underline">
													{formatPhone(student.phone)}
												</a>
											</div>
										</div>
									)} */}

									{student.phone && (
										<div className="flex items-center gap-2">
											<a
												href={`tel:${student.phone}`}
												onClick={(e) => e.stopPropagation()}
												className="text-green-600">
												<Phone className="h-4 w-4 flex-shrink-0" />
											</a>

											<div>
												<strong>Telefon:</strong>{' '}
												<span>{formatPhone(student.phone)}</span>
											</div>
										</div>
									)}

									{student.email && (
										<div className="flex items-center gap-2">
											<Mail className="h-4 w-4 text-orange-600 flex-shrink-0" />
											<div>
												<strong>Email:</strong> {student.email}
											</div>
										</div>
									)}
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-3 sm:pb-6">
									<CardTitle className="text-base sm:text-2xl">
										Postęp kursu
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-6">
									{/* A. STATUS KURSU - Summary */}
									<div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
										<div className="flex flex-wrap items-center gap-2 mb-3">
											<Badge
												variant={student.inactive ? 'secondary' : 'default'}
												className="text-sm">
												{student.inactive ? 'Zakończony' : 'W trakcie'}
											</Badge>

											{packageName && (
												<span className="text-sm font-medium text-gray-700">
													{packageName} • {student.coursePrice.toFixed(0)} zł
												</span>
											)}

											{/* Badge dla kursu uzupełniającego - bez ceny (już jest wyżej) */}
											{student.isSupplementaryCourse && (
												<Badge variant="secondary" className="text-sm">
													Kurs uzupełniający
												</Badge>
											)}
										</div>
										{/* Instruktorzy */}
										{student.instructorIds &&
											student.instructorIds.length > 0 && (
												<div className="flex items-start gap-2 text-sm text-gray-700">
													<User className="h-4 w-4 mt-0.5 flex-shrink-0" />
													<div>
														<span className="font-medium">
															Instruktor
															{student.instructorIds.length > 1 ? 'zy' : ''}:
														</span>{' '}
														{student.instructorIds
															.map((id) => instructorsMap.get(id))
															.filter(Boolean)
															.join(', ')}
													</div>
												</div>
											)}
									</div>

									{/* B. JAZDY - Progress bar */}
									<div>
										<div className="flex items-center justify-between mb-2">
											<h4 className="font-semibold text-gray-900">Jazdy</h4>
											<span className="text-sm font-medium text-gray-600">
												{student.markProgressComplete
													? `${formatHours(packageHours)} / ${packageHours}h`
													: `${formatHours(
															student.totalHoursDriven,
														)} / ${packageHours}h`}
											</span>
										</div>

										{/* Progress bar */}
										<div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
											<div
												className={`h-full transition-all duration-300 ${
													student.markProgressComplete
														? 'bg-green-500'
														: getProgressColor(
																calculateProgress(
																	student.totalHoursDriven,
																	packageHours,
																),
															)
												}`}
												style={{
													width: student.markProgressComplete
														? '100%'
														: `${calculateProgress(
																student.totalHoursDriven,
																packageHours,
															)}%`,
												}}
											/>
										</div>

										<div className="mt-1 text-xs text-gray-500 text-right">
											{student.markProgressComplete ? (
												<span className="text-green-600 font-medium">
													✓ 100% ukończone
												</span>
											) : (
												<>
													{calculateProgress(
														student.totalHoursDriven,
														packageHours,
													).toFixed(0)}
													% ukończone
													{student.totalHoursDriven >= packageHours ? (
														<span className="ml-2 text-green-600 font-medium">
															✓ Ukończone
														</span>
													) : (
														<span className="ml-2">
															(brakuje{' '}
															{formatHours(
																packageHours - student.totalHoursDriven,
															)}
															)
														</span>
													)}
												</>
											)}
										</div>
									</div>

									{/* C. EGZAMINY - Checklista */}
									<div>
										<h4 className="font-semibold text-gray-900 mb-3">
											Egzaminy
										</h4>
										<div className="space-y-2">
											{/* Profil */}
											<div className="flex items-center gap-3">
												{student.profileUpdated ? (
													<CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
												) : (
													<XCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
												)}
												<span
													className={
														student.profileUpdated
															? 'text-gray-900'
															: 'text-gray-500'
													}>
													Profil zaktualizowany
												</span>
											</div>

											{/* Teoria wewnętrzna */}
											<div className="flex items-center gap-3">
												{student.internalTheoryPassed ? (
													<CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
												) : (
													<XCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
												)}
												<span
													className={
														student.internalTheoryPassed
															? 'text-gray-900'
															: 'text-gray-500'
													}>
													Teoria wewnętrzna
												</span>
											</div>

											{/* Praktyka wewnętrzna */}
											<div className="flex items-center gap-3">
												{student.internalPracticePassed ? (
													<CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
												) : (
													<XCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
												)}
												<span
													className={
														student.internalPracticePassed
															? 'text-gray-900'
															: 'text-gray-500'
													}>
													Praktyka wewnętrzna
												</span>
											</div>

											{/* Państwowy */}
											<div className="flex items-center gap-3">
												{student.stateExamStatus === 'passed' ? (
													<CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
												) : student.stateExamStatus === 'failed' ? (
													<XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
												) : canEditStateExam ? (
													<Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
												) : (
													<Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
												)}
												<div className="flex-1">
													<span
														className={
															student.stateExamStatus === 'passed'
																? 'text-gray-900'
																: student.stateExamStatus === 'failed'
																	? 'text-gray-900'
																	: canEditStateExam
																		? 'text-gray-900'
																		: 'text-gray-500'
														}>
														Państwowy -
													</span>
													<span className={getStateExamStatusColor(student)}>
														{' '}
														{student.stateExamStatus === 'passed'
															? `Zdany (${student.stateExamAttempts}. próba)`
															: student.stateExamStatus === 'failed'
																? `Niezdany (${student.stateExamAttempts} ${
																		student.stateExamAttempts === 1
																			? 'próba'
																			: 'próby/prób'
																	})`
																: canEditStateExam
																	? 'Dopuszczony'
																	: 'Niedopuszczony'}
													</span>
													{/* Info o terminie egzaminu */}
													{student.stateExamStatus === 'allowed' &&
														carReservation && (
															<div className="text-xs text-blue-600 mt-1">
																Termin:{' '}
																{format(
																	new Date(carReservation.date),
																	'dd.MM.yyyy',
																)}{' '}
																o {carReservation.startTime.slice(0, 5)}
															</div>
														)}
												</div>
											</div>
										</div>
									</div>

									{/* D. INFORMACJE DODATKOWE */}
									<div className="pt-4 border-t space-y-2 text-sm text-gray-600">
										{student.city && (
											<div className="flex items-center gap-2">
												<MapPin className="h-4 w-4" />
												<span className="font-medium">Miasto egzaminu:</span>
												<span>{student.city}</span>
											</div>
										)}

										{student.car && (
											<div className="flex items-center gap-2">
												<CarIcon className="h-4 w-4" />
												<span className="font-medium">Auto na egzamin:</span>
												<span>Tak</span>
												{carReservation && reservedCar && (
													<span className="text-primary">
														{' '}
														({reservedCar.name},{' '}
														{format(
															new Date(carReservation.date),
															'dd.MM.yyyy',
														)}
														)
													</span>
												)}
											</div>
										)}

										{student.courseStartDate && (
											<div className="flex items-center gap-2">
												<CalendarIcon className="h-4 w-4" />
												<span className="font-medium">Rozpoczęcie:</span>
												<span>
													{format(
														new Date(student.courseStartDate),
														'dd.MM.yyyy',
													)}
												</span>
											</div>
										)}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-3 sm:pb-6">
									<div className="flex items-center justify-between">
										<CardTitle className="text-base sm:text-2xl">
											Notatki
										</CardTitle>
										{!editingNotes && (
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setEditingNotes(true)}
												className="h-8 w-8">
												<Pencil className="h-4 w-4" />
											</Button>
										)}
									</div>
								</CardHeader>
								<CardContent className="text-sm">
									{editingNotes ? (
										<div className="space-y-3">
											<Textarea
												value={notesValue}
												onChange={(e) => setNotesValue(e.target.value)}
												rows={6}
												placeholder="Dodaj notatki o kursancie..."
												className="resize-none"
												autoFocus
											/>
											<div className="flex gap-2 justify-end">
												<Button
													variant="outline"
													size="sm"
													onClick={handleCancelNotes}
													disabled={savingNotes}>
													<X className="mr-2 h-4 w-4" />
													Anuluj
												</Button>
												<Button
													size="sm"
													onClick={handleSaveNotes}
													disabled={savingNotes}>
													<Save className="mr-2 h-4 w-4" />
													{savingNotes ? 'Zapisywanie...' : 'Zapisz'}
												</Button>
											</div>
										</div>
									) : (
										<div
											className={`min-h-[60px] ${
												role === 'admin'
													? 'cursor-pointer hover:bg-gray-50 rounded p-2 -m-2'
													: ''
											}`}
											onClick={() => setEditingNotes(true)}>
											{student.notes ? (
												<p className="whitespace-pre-wrap">{student.notes}</p>
											) : (
												<p className="italic text-gray-400">
													Kliknij aby dodać notatki...
												</p>
											)}
										</div>
									)}
								</CardContent>
							</Card>

							{/* Płatności - Mobile Optimized */}
							<Card className="md:col-span-3">
								<CardHeader className="pb-3 sm:pb-6">
									<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<CardTitle className="text-base sm:text-2xl">
											Płatności
										</CardTitle>
										<AddPaymentDialog
											studentId={student.id}
											open={dialogOpen}
											onOpenChange={setDialogOpen}
											onSuccess={() => id && loadData(id)}
										/>
									</div>
								</CardHeader>
								<CardContent>
									{/* Summary Cards */}
									<div
										className={`mb-4 grid gap-2 rounded-lg bg-muted p-3 sm:gap-4 sm:p-4 ${
											extraHoursPaid > 0
												? 'grid-cols-2 sm:grid-cols-4'
												: 'grid-cols-3'
										}`}>
										<div>
											<div className="text-xs text-muted-foreground sm:text-sm">
												Cena kursu
											</div>
											<div className="text-lg font-bold sm:text-2xl">
												{student.coursePrice.toFixed(2)} zł
											</div>
										</div>
										<div>
											<div className="text-xs text-muted-foreground sm:text-sm">
												Wpłacono
											</div>
											<div className="text-lg font-bold text-green-600 sm:text-2xl">
												{totalPaid.toFixed(2)} zł
											</div>
										</div>
										<div>
											<div className="text-xs text-muted-foreground sm:text-sm">
												Do zapłaty
											</div>
											<div
												className={`text-lg font-bold sm:text-2xl ${
													outstanding > 0 ? 'text-orange-600' : 'text-green-600'
												}`}>
												{outstanding.toFixed(2)} zł
											</div>
										</div>
										{extraHoursPaid > 0 && (
											<div>
												<div className="text-xs text-muted-foreground sm:text-sm">
													Dodatkowe
												</div>
												<div className="text-lg font-bold text-blue-600 sm:text-2xl">
													{extraHoursPaid.toFixed(2)} zł
												</div>
											</div>
										)}
									</div>

									{/* Payments List */}
									{payments.length === 0 ? (
										<div className="py-8 text-center text-sm text-muted-foreground">
											Brak płatności
										</div>
									) : (
										<div className="space-y-2">
											{payments.map((payment) => (
												<PaymentRow
													key={payment.id}
													payment={payment}
													studentId={student.id}
													currentUserId={user?.id} // DODAJ
													currentUserRole={role} // DODAJ
													onSuccess={() => id && loadData(id)}
												/>
											))}
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-[2fr,1fr]">
							{/* Kalendarz */}
							<div className="rounded-lg border bg-white p-2 sm:p-4">
								{/* Toolbar */}
								<div className="mb-4 flex items-center justify-between border-b pb-3">
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCalendarMonth(new Date())}>
											Dziś
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												const prev = new Date(calendarMonth);
												prev.setMonth(prev.getMonth() - 1);
												setCalendarMonth(prev);
											}}>
											<ChevronLeft className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												const next = new Date(calendarMonth);
												next.setMonth(next.getMonth() + 1);
												setCalendarMonth(next);
											}}>
											<ChevronRight className="h-4 w-4" />
										</Button>
										<span className="ml-2 text-sm font-semibold capitalize">
											{format(calendarMonth, 'LLLL yyyy', { locale: pl })}
										</span>
									</div>
								</div>

								<div className="h-[450px] sm:h-[600px]">
									<Calendar
										localizer={localizer}
										events={events}
										date={calendarMonth}
										onNavigate={(newDate) => setCalendarMonth(newDate)}
										startAccessor="start"
										endAccessor="end"
										style={{ height: '100%' }}
										views={['month']}
										defaultView="month"
										eventPropGetter={eventStyleGetter}
										messages={{
											next: 'Następny',
											previous: 'Poprzedni',
											today: 'Dziś',
											month: 'Miesiąc',
										}}
									/>
								</div>
								<div className="mt-4 flex flex-wrap gap-2 text-xs sm:gap-4 sm:text-sm">
									<div className="flex items-center gap-2">
										<div
											className="h-3 w-3 rounded sm:h-4 sm:w-4"
											style={{ backgroundColor: '#f59e0b' }}
										/>
										<span>Zaplanowana</span>
									</div>
									<div className="flex items-center gap-2">
										<div
											className="h-3 w-3 rounded sm:h-4 sm:w-4"
											style={{ backgroundColor: '#10b981' }}
										/>
										<span>Ukończona</span>
									</div>
									<div className="flex items-center gap-2">
										<div
											className="h-3 w-3 rounded sm:h-4 sm:w-4"
											style={{ backgroundColor: '#6b7280' }}
										/>
										<span>Anulowana</span>
									</div>
								</div>
							</div>

							{/* Lista lekcji - desktop */}
							<div className="hidden md:block rounded-lg border bg-white p-4">
								<h3 className="font-semibold mb-3">Lekcje</h3>
								{lessons.length === 0 ? (
									<div className="text-sm text-gray-500 py-8 text-center">
										Brak zaplanowanych lekcji
									</div>
								) : (
									<div className="space-y-3 max-h-[530px] overflow-y-auto">
										{lessons
											.sort((a, b) => {
												const dateCompare = a.date.localeCompare(b.date);
												if (dateCompare !== 0) return dateCompare;
												return a.startTime.localeCompare(b.startTime);
											})
											.map((lesson) => (
												<div
													key={lesson.id}
													className={`p-3 rounded-lg border ${
														lesson.status === 'completed'
															? 'bg-green-50 border-green-200'
															: lesson.status === 'cancelled'
																? 'bg-gray-50 border-gray-200'
																: 'bg-amber-50 border-amber-200'
													}`}>
													<div className="text-sm font-medium">
														{format(new Date(lesson.date), 'dd.MM.yyyy', {
															locale: pl,
														})}
													</div>
													<div className="text-sm text-gray-600 mt-1">
														{lesson.startTime.slice(0, 5)} -{' '}
														{lesson.endTime.slice(0, 5)}
													</div>
													<div className="text-xs text-gray-500 mt-1">
														{formatHours(lesson.duration)}
													</div>
													{/* NOWE: Instruktor */}
													<div className="text-xs text-gray-600 mt-1">
														{instructorsMap.get(lesson.instructorId) ||
															'Nieznany instruktor'}
													</div>
													{lesson.status === 'cancelled' && (
														<div className="text-xs text-gray-500 mt-1">
															Anulowana
														</div>
													)}
												</div>
											))}
									</div>
								)}
							</div>

							{/* Lista lekcji - mobile (pod kalendarzem) */}
							<div className="md:hidden rounded-lg border bg-white p-4">
								<h3 className="font-semibold mb-3">Lekcje</h3>
								{lessons.length === 0 ? (
									<div className="text-sm text-gray-500 py-8 text-center">
										Brak zaplanowanych lekcji
									</div>
								) : (
									<div className="space-y-2 max-h-[400px] overflow-y-auto">
										{lessons
											.sort((a, b) => {
												const dateCompare = a.date.localeCompare(b.date);
												if (dateCompare !== 0) return dateCompare;
												return a.startTime.localeCompare(b.startTime);
											})
											.map((lesson) => (
												<div
													key={lesson.id}
													className={`p-2 rounded border text-sm ${
														lesson.status === 'completed'
															? 'bg-green-50 border-green-200'
															: lesson.status === 'cancelled'
																? 'bg-gray-50 border-gray-200'
																: 'bg-amber-50 border-amber-200'
													}`}>
													<div className="font-medium">
														{format(new Date(lesson.date), 'dd.MM.yyyy', {
															locale: pl,
														})}{' '}
														• {lesson.startTime.slice(0, 5)} -{' '}
														{lesson.endTime.slice(0, 5)}
													</div>
													<div className="text-xs text-gray-600 mt-0.5">
														{formatHours(lesson.duration)}
														{lesson.status === 'cancelled' && ' • Anulowana'}
														{' • '}
														{instructorsMap.get(lesson.instructorId)}
													</div>
												</div>
											))}
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function PaymentRow({
	payment,
	studentId,
	currentUserId,
	currentUserRole,
	onSuccess,
}: {
	payment: PaymentWithCreator;
	studentId: string;
	currentUserId?: string; // DODAJ
	currentUserRole: string | null; // DODAJ
	onSuccess: () => void;
}) {
	const [editing, setEditing] = useState(false);

	// Czy użytkownik może edytować/usuwać tę płatność

	const canModify =
		currentUserRole === 'admin' || payment.createdBy === currentUserId;

	const handleDelete = async () => {
		if (!confirm('Usunąć płatność?')) return;

		try {
			await paymentService.deletePayment(payment.id);
			onSuccess();
		} catch (error) {
			console.error('Error deleting payment:', error);
			alert('Błąd usuwania płatności');
		}
	};

	if (editing) {
		return (
			<EditPaymentForm
				payment={payment}
				studentId={studentId}
				onCancel={() => setEditing(false)}
				onSuccess={() => {
					setEditing(false);
					onSuccess();
				}}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex-1">
				<div className="font-medium">{payment.amount.toFixed(2)} zł</div>
				<div className="text-xs text-muted-foreground sm:text-sm">
					{format(new Date(payment.createdAt), 'dd.MM.yyyy HH:mm')} •{' '}
					{payment.type === 'course' ? 'Kurs' : 'Dodatkowe'} •{' '}
					{payment.method === 'cash'
						? 'Gotówka'
						: payment.method === 'card'
							? 'Karta'
							: 'Przelew'}
				</div>
				{(payment.createdByName || payment.updatedByName) && (
					<div className="mt-1 text-xs text-gray-500">
						{payment.createdByName && `Dodano: ${payment.createdByName}`}
						{payment.updatedByName && ` • Edytowano: ${payment.updatedByName}`}
					</div>
				)}
			</div>

			{/* Pokaż przyciski tylko jeśli użytkownik może modyfikować */}
			{canModify && (
				<div className="flex gap-2">
					<Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
						<Pencil className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="icon" onClick={handleDelete}>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				</div>
			)}
		</div>
	);
}

function EditPaymentForm({
	payment,
	studentId,
	onCancel,
	onSuccess,
}: {
	payment: Payment;
	studentId: string;
	onCancel: () => void;
	onSuccess: () => void;
}) {
	const [amount, setAmount] = useState(payment.amount.toString());
	const [type, setType] = useState<'course' | 'extra_lessons'>(payment.type);
	const [method, setMethod] = useState<'cash' | 'card' | 'transfer'>(
		payment.method,
	);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			await paymentService.updatePayment({
				...payment,
				studentId,
				amount: parseFloat(amount),
				type,
				method,
			});
			onSuccess();
		} catch (error: any) {
			console.error('Error updating payment:', error);
			alert(error.message || 'Błąd aktualizacji płatności');
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="rounded-lg border p-3 space-y-3">
			<div className="grid grid-cols-3 gap-2">
				<div>
					<Label htmlFor="amount">Kwota (zł)</Label>
					<Input
						id="amount"
						type="number"
						step="0.01"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						required
					/>
				</div>
				<div>
					<Label htmlFor="type">Typ</Label>
					<Select
						id="type"
						value={type}
						onChange={(e) => setType(e.target.value as any)}>
						<option value="course">Kurs</option>
						<option value="extra_lessons">Dodatkowe godziny</option>
					</Select>
				</div>
				<div>
					<Label htmlFor="method">Metoda</Label>
					<Select
						id="method"
						value={method}
						onChange={(e) => setMethod(e.target.value as any)}>
						<option value="cash">Gotówka</option>
						<option value="card">Karta</option>
						<option value="transfer">Przelew</option>
					</Select>
				</div>
			</div>
			<div className="flex gap-2 justify-end">
				<Button type="button" variant="outline" onClick={onCancel} size="sm">
					Anuluj
				</Button>
				<Button type="submit" disabled={loading} size="sm">
					{loading ? 'Zapisywanie...' : 'Zapisz'}
				</Button>
			</div>
		</form>
	);
}

function AddPaymentDialog({
	studentId,
	open,
	onOpenChange,
	onSuccess,
}: {
	studentId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}) {
	const [amount, setAmount] = useState('');
	const [type, setType] = useState<'course' | 'extra_lessons'>('course');
	const [method, setMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			await paymentService.createPayment({
				studentId,
				amount: parseFloat(amount),
				type,
				method,
				createdBy: null,
				updatedBy: null,
				updatedAt: null,
			});
			onSuccess();
			onOpenChange(false);
			setAmount('');
		} catch (error) {
			console.error('Error creating payment:', error);
			alert('Błąd dodawania płatności');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Dodaj płatność
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Dodaj płatność</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label htmlFor="amount">Kwota (zł)</Label>
						<Input
							id="amount"
							type="number"
							step="0.01"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							required
						/>
					</div>
					<div>
						<Label htmlFor="type">Typ</Label>
						<Select
							id="type"
							value={type}
							onChange={(e) => setType(e.target.value as any)}>
							<option value="course">Kurs</option>
							<option value="extra_lessons">Dodatkowe godziny</option>
						</Select>
					</div>
					<div>
						<Label htmlFor="method">Metoda</Label>
						<Select
							id="method"
							value={method}
							onChange={(e) => setMethod(e.target.value as any)}>
							<option value="cash">Gotówka</option>
							<option value="card">Karta</option>
							<option value="transfer">Przelew</option>
						</Select>
					</div>
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? 'Dodawanie...' : 'Dodaj'}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
