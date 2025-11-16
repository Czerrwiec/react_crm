import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { studentService } from '@/services/student.service';
import { paymentService } from '@/services/payment.service';
import { lessonService } from '@/services/lesson.service';
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
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react';
import { carService } from '@/services/car.service';
import type { Student, Payment, Lesson, CarReservation, Car } from '@/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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
	const [student, setStudent] = useState<Student | null>(null);
	const [payments, setPayments] = useState<PaymentWithCreator[]>([]);
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<'info' | 'calendar'>('info');
	const [carReservation, setCarReservation] = useState<CarReservation | null>(
		null
	);
	const [reservedCar, setReservedCar] = useState<Car | null>(null);

	useEffect(() => {
		if (id) loadData(id);
	}, [id]);

	const loadData = async (studentId: string) => {
		try {
			const [studentData, paymentsData] = await Promise.all([
				studentService.getStudent(studentId),
				paymentService.getPaymentsByStudent(studentId),
			]);
			setStudent(studentData);

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
				})
			);

			setPayments(paymentsWithCreators);

			if (studentData.instructorId) {
				const lessonsData = await lessonService.getLessonsByInstructor(
					studentData.instructorId,
					new Date()
				);
				const studentLessons = lessonsData.filter((l) =>
					l.studentIds.includes(studentId)
				);
				setLessons(studentLessons);
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
			startMinute
		);
		const end = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			endHour,
			endMinute
		);

		return {
			id: lesson.id,
			title: `${lesson.startTime} - ${lesson.endTime}`,
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

	const totalPaid = payments
		.filter((p) => p.type === 'course')
		.reduce((sum, p) => sum + p.amount, 0);
	const outstanding = student ? student.coursePrice - totalPaid : 0;

	const formatHours = (hours: number) => {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	};

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
							{student.theoryPassed && (
								<Badge className="text-xs">Teoria ✓</Badge>
							)}
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
							onClick={() => navigate('/admin/students')}>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<Button
							size="icon"
							onClick={() => navigate(`/admin/students/${id}/edit`)}>
							<Pencil className="h-4 w-4" />
						</Button>
					</div>

					{/* DESKTOP – w linii z imieniem */}
					<div className="hidden sm:flex items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => navigate('/admin/students')}>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<Button onClick={() => navigate(`/admin/students/${id}/edit`)}>
							Edytuj kursanta
						</Button>
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
								<CardContent className="space-y-2 text-sm">
									{student.phone && (
										<div>
											<strong>Telefon:</strong> {student.phone}
										</div>
									)}
									{student.email && (
										<div>
											<strong>Email:</strong> {student.email}
										</div>
									)}
									{student.pkkNumber && (
										<div>
											<strong>PKK:</strong> {student.pkkNumber}
										</div>
									)}
									{student.city && (
										<div>
											<strong>Miasto:</strong> {student.city}
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
								<CardContent className="space-y-2 text-sm">
									<div>
										<strong>Wyjezdzone:</strong>{' '}
										{formatHours(student.totalHoursDriven)}
									</div>
									<div>
										<strong>Teoria:</strong>{' '}
										{student.theoryPassed ? '✓ Zdana' : '✗ Nie zdana'}
									</div>
									<div>
										<strong>Egzamin wewnętrzny:</strong>{' '}
										{student.internalExamPassed ? '✓ Zdany' : '✗ Nie zdany'}
									</div>
									<div>
										<strong>Kurs uzupełniający:</strong>{' '}
										{student.isSupplementaryCourse ? 'Tak' : 'Nie'}
									</div>
									<div>
										<strong>Auto na egzamin:</strong>{' '}
										{student.car ? (
											<>
												Tak
												{carReservation && reservedCar && (
													<span className="text-primary">
														{' - '}
														{reservedCar.name}
														{', '}
														{format(
															new Date(carReservation.date),
															'dd.MM.yyyy',
															{ locale: pl }
														)}
														{', '}
														{carReservation.startTime.slice(0, 5)}
													</span>
												)}
											</>
										) : (
											'Nie'
										)}
									</div>
									{student.courseStartDate && (
										<div>
											<strong>Rozpoczęcie:</strong>{' '}
											{format(new Date(student.courseStartDate), 'dd.MM.yyyy')}
										</div>
									)}
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-3 sm:pb-6">
									<CardTitle className="text-base sm:text-2xl">
										Notatki
									</CardTitle>
								</CardHeader>
								<CardContent className="text-sm">
									{student.notes ? (
										<p className="whitespace-pre-wrap">{student.notes}</p>
									) : (
										<p className="italic text-gray-500">Brak notatek</p>
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
									<div className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-muted p-3 sm:gap-4 sm:p-4">
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
							<div className="rounded-lg border bg-white p-2 sm:p-4 h-[450px] sm:h-[600px]">
								<div className="h-[450px] sm:h-[600px]">
									<Calendar
										localizer={localizer}
										events={events}
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
	onSuccess,
}: {
	payment: PaymentWithCreator;
	studentId: string;
	onSuccess: () => void;
}) {
	const [editing, setEditing] = useState(false);

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
			<div className="flex gap-2">
				<Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
					<Pencil className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="icon" onClick={handleDelete}>
					<Trash2 className="h-4 w-4 text-destructive" />
				</Button>
			</div>
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
		payment.method
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
