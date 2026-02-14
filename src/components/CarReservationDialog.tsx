import { useState, useEffect, FormEvent } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/useIsMobile';
import BottomSheet from '@/components/mobile/BottomSheet';
import { TimePicker } from '@/components/mobile/MobileTimePicker';
import { carService } from '@/services/car.service';
import { studentService } from '@/services/student.service';
import type { CarReservation, Student, Car } from '@/types';
import { format } from 'date-fns';

interface CarReservationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	carId?: string;
	reservation?: CarReservation | null;
	preselectedDate?: Date;
	preselectedTime?: string; // "14:30"
	onSuccess: () => void;
}

const initialFormData = {
	carId: '',
	date: format(new Date(), 'yyyy-MM-dd'),
	startTime: '10:00',
	duration: 2,
	studentIds: [] as string[],
	notes: '',
};

export default function CarReservationDialog({
	open,
	onOpenChange,
	carId,
	reservation,
	preselectedDate,
	preselectedTime,
	onSuccess,
}: CarReservationDialogProps) {
	const isMobile = useIsMobile();
	const [loading, setLoading] = useState(false);
	const [students, setStudents] = useState<Student[]>([]);
	const [cars, setCars] = useState<Car[]>([]);
	const [formData, setFormData] = useState(initialFormData);
	const [conflictWarning, setConflictWarning] = useState(false);
	const [studentSearch, setStudentSearch] = useState('');

	useEffect(() => {
		if (open) {
			loadData();

			if (reservation) {
				// Oblicz duration z istniejÄ…cej rezerwacji
				const [startH, startM] = reservation.startTime.split(':').map(Number);
				const [endH, endM] = reservation.endTime.split(':').map(Number);
				const durationMinutes = endH * 60 + endM - (startH * 60 + startM);
				const durationHours = durationMinutes / 60;

				setFormData({
					carId: reservation.carId,
					date: reservation.date,
					startTime: reservation.startTime,
					duration: durationHours,
					studentIds: reservation.studentIds,
					notes: reservation.notes || '',
				});
			} else {
				setFormData({
					...initialFormData,
					carId: carId || '',
					date: preselectedDate
						? format(preselectedDate, 'yyyy-MM-dd')
						: format(new Date(), 'yyyy-MM-dd'),
					startTime: preselectedTime || initialFormData.startTime,
				});
			}
		} else {
			setFormData(initialFormData);
			setConflictWarning(false);
		}
	}, [open, reservation, preselectedDate, carId]);

	useEffect(() => {
		if (open && formData.date && formData.startTime && formData.duration) {
			checkConflict();
		}
	}, [
		formData.date,
		formData.startTime,
		formData.duration,
		formData.carId,
		open,
	]);

	const loadData = async () => {
		try {
			const [studentsData, carsData] = await Promise.all([
				studentService.getActiveStudents(),
				carService.getCars(),
			]);
			setStudents(studentsData);
			setCars(carsData);
		} catch (error) {
			console.error('Error loading data:', error);
		}
	};

	const filteredStudents = students.filter((student) => {
		if (!studentSearch) return true;
		const searchLower = studentSearch.toLowerCase();
		const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
		return (
			fullName.includes(searchLower) || student.phone?.includes(studentSearch)
		);
	});

	const calculateEndTime = () => {
		const [h, m] = formData.startTime.split(':').map(Number);
		const startMinutes = h * 60 + m;
		const endMinutes = startMinutes + formData.duration * 60;
		const endH = Math.floor(endMinutes / 60);
		const endM = endMinutes % 60;
		return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
	};

	const checkConflict = async () => {
		if (!formData.carId) return;

		try {
			const selectedDate = new Date(formData.date);
			const prevMonth = new Date(
				selectedDate.getFullYear(),
				selectedDate.getMonth() - 1,
				1
			);
			const nextMonth = new Date(
				selectedDate.getFullYear(),
				selectedDate.getMonth() + 1,
				1
			);

			const [prevReservations, currentReservations, nextReservations] =
				await Promise.all([
					carService.getReservationsByMonth(prevMonth),
					carService.getReservationsByMonth(selectedDate),
					carService.getReservationsByMonth(nextMonth),
				]);

			const allReservations = [
				...prevReservations,
				...currentReservations,
				...nextReservations,
			];

			const endTime = calculateEndTime();

			const hasConflict = allReservations.some((r) => {
				if (reservation && r.id === reservation.id) return false;
				if (r.carId !== formData.carId) return false;
				if (r.date !== formData.date) return false;

				return timeRangesOverlap(
					formData.startTime,
					endTime,
					r.startTime,
					r.endTime
				);
			});

			setConflictWarning(hasConflict);
		} catch (error) {
			console.error('Error checking conflict:', error);
		}
	};

	const timeRangesOverlap = (
		start1: string,
		end1: string,
		start2: string,
		end2: string
	) => {
		const start1Minutes = timeToMinutes(start1);
		const end1Minutes = timeToMinutes(end1);
		const start2Minutes = timeToMinutes(start2);
		const end2Minutes = timeToMinutes(end2);

		return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
	};

	const timeToMinutes = (time: string) => {
		const [h, m] = time.split(':').map(Number);
		return h * 60 + m;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		if (!formData.carId) {
			alert('Wybierz samochÃ³d');
			return;
		}

		if (formData.duration <= 0) {
			alert('Czas trwania musi byÄ‡ wiÄ™kszy od 0');
			return;
		}

		if (conflictWarning) {
			alert(
				'W tym czasie samochÃ³d jest juÅ¼ zarezerwowany. Wybierz inny termin.'
			);
			return;
		}

		setLoading(true);

		try {
			const endTime = calculateEndTime();

			const reservationData = {
				carId: formData.carId,
				studentIds: formData.studentIds,
				date: formData.date,
				startTime: formData.startTime,
				endTime: endTime,
				notes: formData.notes || null,
				createdBy: null,
			};

			if (reservation) {
				await carService.updateReservation(reservation.id, reservationData);
			} else {
				await carService.createReservation(reservationData);
			}

			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error('Error saving reservation:', error);
			alert('BÅ‚Ä…d zapisywania rezerwacji');
		} finally {
			setLoading(false);
		}
	};

	const handleStudentToggle = (studentId: string) => {
		setFormData({
			...formData,
			studentIds: formData.studentIds.includes(studentId)
				? formData.studentIds.filter((id) => id !== studentId)
				: [...formData.studentIds, studentId],
		});
	};

	// MOBILE VERSION - Bottom Sheet
	if (isMobile) {
		return (
			<BottomSheet
				open={open}
				onClose={() => onOpenChange(false)}
				title={reservation ? 'Edytuj rezerwację' : 'Dodaj rezerwację'}
			>
				<form onSubmit={handleSubmit} className="space-y-6 p-4 pb-20">
					{/* Samochód */}
					<div>
						<Label htmlFor="carSelect-mobile">Samochód *</Label>
						<Select
							id="carSelect-mobile"
							required
							value={formData.carId}
							onChange={(e) => setFormData({ ...formData, carId: e.target.value })}
							className="mt-1 h-12 text-base"
						>
							<option value="">Wybierz samochód</option>
							{cars.map((car) => (
								<option key={car.id} value={car.id}>
									{car.name} ({car.registrationNumber})
								</option>
							))}
						</Select>
					</div>

					{/* Data */}
					<div>
						<Label htmlFor="date-mobile">Data *</Label>
						<Input
							id="date-mobile"
							type="date"
							required
							value={formData.date}
							onChange={(e) => setFormData({ ...formData, date: e.target.value })}
							className="mt-1 h-12 text-base"
						/>
					</div>

					{/* Godzina rozpoczęcia */}
					<TimePicker
						label="Godzina rozpoczęcia *"
						value={formData.startTime}
						onChange={(val) => setFormData({ ...formData, startTime: val })}
					/>

					{/* Czas trwania - dropdown */}
					<div>
						<Label htmlFor="duration-mobile">Czas trwania *</Label>
						<select
							id="duration-mobile"
							value={formData.duration}
							onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
							className="mt-1 h-12 w-full rounded-lg border border-gray-300 px-3 text-base"
						>
							{[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((dur) => (
								<option key={dur} value={dur}>
									{dur}h
								</option>
							))}
						</select>
					</div>

					{conflictWarning && (
						<div className="rounded-lg border-2 border-red-200 bg-red-50 p-3 text-sm text-red-800">
							⚠️ W tym czasie samochód jest już zarezerwowany
						</div>
					)}

					<div className="text-center text-sm text-gray-600">
						Zakończenie: <strong>{calculateEndTime()}</strong>
					</div>

					{/* Kursanci - Selectable cards */}
					<div>
						<Label>Kursanci ({formData.studentIds.length})</Label>
						<Input
							placeholder="Szukaj..."
							value={studentSearch}
							onChange={(e) => setStudentSearch(e.target.value)}
							className="mt-1 mb-3 h-11"
						/>
						<div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
							{students.length === 0 ? (
								<div className="py-8 text-center text-sm text-gray-500">
									Brak aktywnych kursantów
								</div>
							) : (
								filteredStudents.map((student) => (
									<button
										key={student.id}
										type="button"
										onClick={() => handleStudentToggle(student.id)}
										className={`min-h-[44px] w-full rounded-lg border-2 px-3 py-2 text-left transition-all active:scale-98 ${
											formData.studentIds.includes(student.id)
												? 'border-blue-600 bg-blue-50'
												: 'border-gray-200 bg-white'
										}`}
									>
										<div className="text-sm font-medium">
											{student.firstName} {student.lastName}
										</div>
										{student.phone && (
											<div className="text-xs text-gray-500">{student.phone}</div>
										)}
									</button>
								))
							)}
						</div>
					</div>

					{/* Notatki */}
					<div>
						<Label htmlFor="notes-mobile">Notatki</Label>
						<Textarea
							id="notes-mobile"
							rows={3}
							value={formData.notes}
							onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
							className="mt-1 text-base"
						/>
					</div>

					{/* Sticky submit button */}
					<div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4">
						<Button
							type="submit"
							disabled={loading || conflictWarning}
							className="h-12 w-full text-base font-semibold"
						>
							{loading ? 'Zapisywanie...' : reservation ? 'Zapisz zmiany' : 'Dodaj rezerwację'}
						</Button>
					</div>
				</form>
			</BottomSheet>
		);
	}

	// DESKTOP VERSION - Dialog
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>
						{reservation ? 'Edytuj rezerwacjÄ™' : 'Dodaj rezerwacjÄ™'}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label htmlFor="carSelect">SamochÃ³d *</Label>
						<Select
							id="carSelect"
							required
							value={formData.carId}
							onChange={(e) =>
								setFormData({ ...formData, carId: e.target.value })
							}>
							<option value="">Wybierz samochÃ³d</option>
							{cars.map((car) => (
								<option key={car.id} value={car.id}>
									{car.name}{' '}
									{car.registrationNumber
										? `(${car.registrationNumber})`
										: `(${car.year})`}
								</option>
							))}
						</Select>
					</div>

					<div>
						<Label htmlFor="date">Data *</Label>
						<Input
							id="date"
							type="date"
							required
							value={formData.date}
							onChange={(e) =>
								setFormData({ ...formData, date: e.target.value })
							}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label htmlFor="startTime">Godzina *</Label>
							<Input
								id="startTime"
								type="time"
								required
								value={formData.startTime}
								onChange={(e) =>
									setFormData({ ...formData, startTime: e.target.value })
								}
							/>
						</div>
						<div>
							<Label htmlFor="duration">Czas trwania (godz.) *</Label>
							<Input
								id="duration"
								type="number"
								step="0.5"
								min="0.5"
								required
								value={formData.duration}
								onChange={(e) =>
									setFormData({
										...formData,
										duration: parseFloat(e.target.value) || 1,
									})
								}
							/>
						</div>
					</div>

					{conflictWarning && (
						<div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
							W tym czasie samochÃ³d jest juÅ¼ zarezerwowany. Wybierz inny termin.
						</div>
					)}

					<div className="text-center text-sm text-gray-600">
						Rezerwacja:{' '}
						<strong>
							{formData.startTime} - {calculateEndTime()}
						</strong>
					</div>

					<div>
						<Label>Kursanci ({formData.studentIds.length})</Label>
						<Input
							placeholder="Szukaj po imieniu, nazwisku lub telefonie..."
							value={studentSearch}
							onChange={(e) => setStudentSearch(e.target.value)}
							className="mb-2"
						/>
						{isMobile ? (
							<div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
								{students.length === 0 ? (
									<div className="py-8 text-center text-sm text-gray-500">
										Brak aktywnych kursantów
									</div>
								) : (
									filteredStudents.map((student) => (
										<button
											key={student.id}
											type="button"
											onClick={() => handleStudentToggle(student.id)}
											className={`min-h-[44px] w-full rounded-lg border-2 px-3 py-2 text-left transition-all active:scale-98 ${
												formData.studentIds.includes(student.id)
													? 'border-blue-600 bg-blue-50'
													: 'border-gray-200 bg-white'
											}`}
										>
											<div className="text-sm font-medium">
												{student.firstName} {student.lastName}
											</div>
											{student.phone && (
												<div className="text-xs text-gray-500">{student.phone}</div>
											)}
										</button>
									))
								)}
							</div>
						) : (
							<div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
								{students.length === 0 ? (
									<div className="text-center text-sm text-gray-500">
										Brak aktywnych kursantów
									</div>
								) : (
									filteredStudents.map((student) => (
										<label
											key={student.id}
											className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
											<Checkbox
												checked={formData.studentIds.includes(student.id)}
												onChange={() => handleStudentToggle(student.id)}
											/>
											<span className="text-sm">
												{student.firstName} {student.lastName}
												{student.phone && (
													<span className="text-gray-500 ml-2">
														({student.phone})
													</span>
												)}
											</span>
										</label>
									))
								)}
							</div>
						)}
					</div>

					<div>
						<Label htmlFor="notes">Notatki</Label>
						<Textarea
							id="notes"
							rows={3}
							value={formData.notes}
							onChange={(e) =>
								setFormData({ ...formData, notes: e.target.value })
							}
						/>
					</div>

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}>
							Anuluj
						</Button>
						<Button type="submit" disabled={loading || conflictWarning}>
							{loading
								? 'Zapisywanie...'
								: reservation
									? 'Zapisz zmiany'
									: 'Dodaj rezerwacjÄ™'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
