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
import { carService } from '@/services/car.service';
import { studentService } from '@/services/student.service';
import type { CarReservation, Student } from '@/types';
import { format } from 'date-fns';
import { Select } from '@/components/ui/select';

interface CarReservationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	carId: string;
	reservation?: CarReservation | null;
	preselectedDate?: Date;
	onSuccess: () => void;
}

const initialFormData = {
	date: format(new Date(), 'yyyy-MM-dd'),
	startTime: '10:00',
	endTime: '12:00',
	studentIds: [] as string[],
	notes: '',
};

export default function CarReservationDialog({
	open,
	onOpenChange,
	carId,
	reservation,
	preselectedDate,
	onSuccess,
}: CarReservationDialogProps) {
	const [loading, setLoading] = useState(false);
	const [students, setStudents] = useState<Student[]>([]);
	const [formData, setFormData] = useState(initialFormData);
	const [conflictWarning, setConflictWarning] = useState(false);

	useEffect(() => {
		if (open) {
			loadStudents();

			if (reservation) {
				setFormData({
					date: reservation.date,
					startTime: reservation.startTime,
					endTime: reservation.endTime,
					studentIds: reservation.studentIds,
					notes: reservation.notes || '',
				});
			} else {
				setFormData({
					...initialFormData,
					date: preselectedDate
						? format(preselectedDate, 'yyyy-MM-dd')
						: format(new Date(), 'yyyy-MM-dd'),
				});
			}
		} else {
			setFormData(initialFormData);
			setConflictWarning(false);
		}
	}, [open, reservation, preselectedDate, carId]);

	useEffect(() => {
		if (open && formData.date && formData.startTime && formData.endTime) {
			checkConflict();
		}
	}, [formData.date, formData.startTime, formData.endTime, open]);

	const loadStudents = async () => {
		try {
			const data = await studentService.getActiveStudents();
			setStudents(data);
		} catch (error) {
			console.error('Error loading students:', error);
		}
	};

	const checkConflict = async () => {
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

			const hasConflict = allReservations.some((r) => {
				if (reservation && r.id === reservation.id) return false;
				if (r.carId !== carId) return false;
				if (r.date !== formData.date) return false;

				return timeRangesOverlap(
					formData.startTime,
					formData.endTime,
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

	const calculateDuration = () => {
		const [startH, startM] = formData.startTime.split(':').map(Number);
		const [endH, endM] = formData.endTime.split(':').map(Number);
		const startMinutes = startH * 60 + startM;
		const endMinutes = endH * 60 + endM;
		const durationMinutes = endMinutes - startMinutes;
		return Math.round((durationMinutes / 60) * 4) / 4;
	};

	const formatDuration = (hours: number) => {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		const duration = calculateDuration();
		if (duration <= 0) {
			alert('Godzina zakończenia musi być późniejsza niż rozpoczęcia');
			return;
		}

		if (conflictWarning) {
			alert(
				'W tym czasie samochód jest już zarezerwowany. Wybierz inny termin.'
			);
			return;
		}

		setLoading(true);

		try {
			const reservationData = {
				carId,
				studentIds: formData.studentIds,
				date: formData.date,
				startTime: formData.startTime,
				endTime: formData.endTime,
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
			alert('Błąd zapisywania rezerwacji');
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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>
						{reservation ? 'Edytuj rezerwację' : 'Dodaj rezerwację'}
					</DialogTitle>
					<div>
						<Label htmlFor="carSelect">Samochód *</Label>
						<Select
							id="carSelect"
							value={carId}
							disabled // Nie można zmieniać po otwarciu
							onChange={() => {}} // tylko do wyświetlenia
						>
							{/* Pobierz listę aut i wyświetl */}
						</Select>
					</div>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
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
							<Label htmlFor="startTime">Godzina rozpoczęcia *</Label>
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
							<Label htmlFor="endTime">Godzina zakończenia *</Label>
							<Input
								id="endTime"
								type="time"
								required
								value={formData.endTime}
								onChange={(e) =>
									setFormData({ ...formData, endTime: e.target.value })
								}
							/>
						</div>
					</div>

					{conflictWarning && (
						<div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
							W tym czasie samochód jest już zarezerwowany. Wybierz inny termin.
						</div>
					)}

					<div className="text-center text-sm text-gray-600">
						Czas trwania: <strong>{formatDuration(calculateDuration())}</strong>
					</div>

					<div>
						<Label>Kursanci ({formData.studentIds.length})</Label>
						<div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
							{students.length === 0 ? (
								<div className="text-center text-sm text-gray-500">
									Brak aktywnych kursantów
								</div>
							) : (
								students.map((student) => (
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
								: 'Dodaj rezerwację'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
