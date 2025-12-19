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
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { lessonService } from '@/services/lesson.service';
import { studentService } from '@/services/student.service';
import type { Lesson, Student } from '@/types';
import { format } from 'date-fns';

interface LessonDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	instructorId: string;
	lesson?: Lesson | null;
	preselectedDate?: Date;
	onSuccess: () => void;
}

const initialFormData = {
	date: format(new Date(), 'yyyy-MM-dd'),
	startTime: '10:00',
	endTime: '12:00',
	status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
	studentIds: [] as string[],
	notes: '',
};

export default function LessonDialog({
	open,
	onOpenChange,
	instructorId,
	lesson,
	preselectedDate,
	onSuccess,
}: LessonDialogProps) {
	const [loading, setLoading] = useState(false);
	const [students, setStudents] = useState<Student[]>([]);
	const [formData, setFormData] = useState(initialFormData);
	const [conflictWarning, setConflictWarning] = useState(false);
	const [studentSearch, setStudentSearch] = useState('');

	// Reset formularza przy otwarciu/zamknięciu lub zmianie instruktora
	useEffect(() => {
		if (open) {
			loadStudents();

			if (lesson) {
				// Edycja - załaduj dane lekcji
				setFormData({
					date: lesson.date,
					startTime: lesson.startTime,
					endTime: lesson.endTime,
					status: lesson.status,
					studentIds: lesson.studentIds,
					notes: lesson.notes || '',
				});
			} else {
				// Nowa lekcja - reset + preselect daty
				setFormData({
					...initialFormData,
					date: preselectedDate
						? format(preselectedDate, 'yyyy-MM-dd')
						: format(new Date(), 'yyyy-MM-dd'),
				});
			}
		} else {
			// Zamknięcie - reset formularza
			setFormData(initialFormData);
			setConflictWarning(false);
		}
	}, [open, lesson, preselectedDate, instructorId]);

	// Sprawdź konflikty przy zmianie daty/czasu
	useEffect(() => {
		if (open && formData.date && formData.startTime && formData.endTime) {
			checkConflict();
		}
	}, [formData.date, formData.startTime, formData.endTime, open]);

	const loadStudents = async () => {
		try {
			const allStudents = await studentService.getActiveStudents();
			// Filtruj po instructorIds (array)
			const instructorStudents = allStudents.filter(
				(s) => s.instructorIds.includes(instructorId) && !s.inactive
			);
			setStudents(instructorStudents);
		} catch (error) {
			console.error('Error loading students:', error);
		}
	};

	const checkConflict = async () => {
		try {
			// Pobierz lekcje z poprzedniego, obecnego i następnego miesiąca
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

			const [prevLessons, currentLessons, nextLessons] = await Promise.all([
				lessonService.getLessonsByInstructor(instructorId, prevMonth),
				lessonService.getLessonsByInstructor(instructorId, selectedDate),
				lessonService.getLessonsByInstructor(instructorId, nextMonth),
			]);

			const allLessons = [...prevLessons, ...currentLessons, ...nextLessons];

			const hasConflict = allLessons.some((l) => {
				if (lesson && l.id === lesson.id) return false;
				if (l.status === 'cancelled') return false;
				if (l.date !== formData.date) return false;

				return timeRangesOverlap(
					formData.startTime,
					formData.endTime,
					l.startTime,
					l.endTime
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
		return durationMinutes / 60; 
	};

	const formatDuration = (hours: number) => {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		if (formData.studentIds.length === 0) {
			alert('Wybierz co najmniej jednego kursanta');
			return;
		}

		const duration = calculateDuration();
		if (duration <= 0) {
			alert('Godzina zakończenia musi być późniejsza niż rozpoczęcia');
			return;
		}

		if (conflictWarning) {
			alert(
				'W tym czasie instruktor ma już zaplanowaną lekcję. Wybierz inny termin.'
			);
			return;
		}

		setLoading(true);

		try {
			const lessonData = {
				instructorId,
				studentIds: formData.studentIds,
				date: formData.date,
				startTime: formData.startTime,
				endTime: formData.endTime,
				duration,
				status: formData.status,
				notes: formData.notes || null,
			};

			if (lesson) {
				await lessonService.updateLesson(lesson.id, lessonData);
			} else {
				await lessonService.createLesson(lessonData);
			}

			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error('Error saving lesson:', error);
			alert('Błąd zapisywania lekcji');
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

	const filteredStudents = students.filter((student) => {
		if (!studentSearch) return true;
		const searchLower = studentSearch.toLowerCase();
		const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
		return (
			fullName.includes(searchLower) || student.phone?.includes(studentSearch)
		);
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>{lesson ? 'Edytuj lekcję' : 'Dodaj lekcję'}</DialogTitle>
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
							W tym czasie instruktor ma już zaplanowaną lekcję. Wybierz inny
							termin.
						</div>
					)}

					<div className="text-center text-sm text-gray-600">
						Czas trwania: <strong>{formatDuration(calculateDuration())}</strong>
					</div>

					<div>
						<Label htmlFor="status">Status</Label>
						<Select
							id="status"
							value={formData.status}
							onChange={(e) =>
								setFormData({ ...formData, status: e.target.value as any })
							}>
							<option value="scheduled">Zaplanowana</option>
							<option value="completed">Ukończona</option>
							<option value="cancelled">Anulowana</option>
						</Select>
					</div>

					<div>
						<Label>Kursanci * ({formData.studentIds.length})</Label>
						<Input
							placeholder="Szukaj po imieniu, nazwisku lub telefonie..."
							value={studentSearch}
							onChange={(e) => setStudentSearch(e.target.value)}
							className="mb-2"
						/>
						<div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
							{filteredStudents.length === 0 ? (
								<div className="text-center text-sm text-gray-500">
									{students.length === 0
										? 'Brak aktywnych kursantów dla tego instruktora'
										: 'Brak wyników wyszukiwania'}
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
								: lesson
								? 'Zapisz zmiany'
								: 'Dodaj lekcję'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
