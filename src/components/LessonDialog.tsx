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
import { useIsMobile } from '@/hooks/useIsMobile';
import BottomSheet from '@/components/mobile/BottomSheet';
import { TimePicker, DurationPicker } from '@/components/mobile/MobileTimePicker';
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
	preselectedTime?: string;
	onSuccess: () => void;
}

const initialFormData = {
	date: format(new Date(), 'yyyy-MM-dd'),
	startTime: '10:00',
	endTime: '12:00',
	status: 'completed' as 'scheduled' | 'completed' | 'cancelled',
	studentIds: [] as string[],
	notes: '',
};

export default function LessonDialog({
	open,
	onOpenChange,
	instructorId,
	lesson,
	preselectedDate,
	preselectedTime,
	onSuccess,
}: LessonDialogProps) {
	const isMobile = useIsMobile();
	const [loading, setLoading] = useState(false);
	const [students, setStudents] = useState<Student[]>([]);
	const [formData, setFormData] = useState(initialFormData);
	const [duration, setDuration] = useState(2); // Default 2h
	const [conflictWarning, setConflictWarning] = useState(false);
	const [studentSearch, setStudentSearch] = useState('');
	const [validationError, setValidationError] = useState<string | null>(null);

	// Reset formularza przy otwarciu/zamkniÄ™ciu lub zmianie instruktora
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
				// Oblicz duration z lekcji
				const [startH, startM] = lesson.startTime.split(':').map(Number);
				const [endH, endM] = lesson.endTime.split(':').map(Number);
				const durationInHours = (endH * 60 + endM - (startH * 60 + startM)) / 60;
				setDuration(durationInHours);
			} else {
				// Nowa lekcja - reset + preselect daty i czasu
				const newFormData = {
					...initialFormData,
					date: preselectedDate
						? format(preselectedDate, 'yyyy-MM-dd')
						: format(new Date(), 'yyyy-MM-dd'),
				};
				
				// Jeśli mamy preselectedTime, ustaw startTime
				if (preselectedTime) {
					newFormData.startTime = preselectedTime;
					// Automatycznie ustaw endTime na +2h
					const [h, m] = preselectedTime.split(':').map(Number);
					const endH = h + 2;
					newFormData.endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
				}
				
				setFormData(newFormData);
				
				// Oblicz duration z newFormData (a nie hardcode 2)
				const [startH, startM] = newFormData.startTime.split(':').map(Number);
				const [endH, endM] = newFormData.endTime.split(':').map(Number);
				const durationInHours = (endH * 60 + endM - (startH * 60 + startM)) / 60;
				setDuration(durationInHours);
			}
		} else {
			// Zamknięcie - reset formularza
			setFormData(initialFormData);
			// Oblicz duration z initialFormData
			const [startH, startM] = initialFormData.startTime.split(':').map(Number);
			const [endH, endM] = initialFormData.endTime.split(':').map(Number);
			const durationInHours = (endH * 60 + endM - (startH * 60 + startM)) / 60;
			setDuration(durationInHours);
			setConflictWarning(false);
		}
	}, [open, lesson, preselectedDate, preselectedTime, instructorId]);

	// SprawdÅº konflikty przy zmianie daty/czasu
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
			// Pobierz lekcje z poprzedniego, obecnego i nastÄ™pnego miesiÄ…ca
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
			setValidationError('Wybierz przynajmniej jednego kursanta');
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
				
				// Recalculate hours jeśli zmienił się status lub studentIds
				const statusChanged = lesson.status !== formData.status;
				const studentsChanged = JSON.stringify(lesson.studentIds.sort()) !== JSON.stringify(formData.studentIds.sort());
				
				if (statusChanged || studentsChanged) {
					// Recalculate dla starych studentów jeśli status był completed
					if (lesson.status === 'completed' && studentsChanged) {
						await Promise.all(
							lesson.studentIds.map(id => lessonService.recalculateStudentHours(id))
						);
					}
					
					// Recalculate dla nowych studentów jeśli status jest completed
					if (formData.status === 'completed') {
						await Promise.all(
							formData.studentIds.map(id => lessonService.recalculateStudentHours(id))
						);
					}
					
					// Jeśli zmienił się status z completed na inny
					if (lesson.status === 'completed' && formData.status !== 'completed') {
						await Promise.all(
							lesson.studentIds.map(id => lessonService.recalculateStudentHours(id))
						);
					}
				}
			} else {
				await lessonService.createLesson(lessonData);
				
				// Recalculate dla nowych studentów jeśli status jest completed
				if (formData.status === 'completed') {
					await Promise.all(
						formData.studentIds.map(id => lessonService.recalculateStudentHours(id))
					);
				}
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
		// Clear validation error when selecting student
		if (validationError) {
			setValidationError(null);
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

	if (isMobile) {
		return (
			<BottomSheet
				open={open}
				onClose={() => onOpenChange(false)}
				title={lesson ? 'Edytuj lekcję' : 'Dodaj lekcję'}
			>
				<form onSubmit={handleSubmit} className="space-y-6 p-4 pb-20">
					{/* Date */}
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

					{/* Time picker */}
					<TimePicker
						label="Godzina rozpoczęcia *"
						value={formData.startTime}
						onChange={(val) => {
							setFormData({ ...formData, startTime: val });
							const [h, m] = val.split(':').map(Number);
							const durationMinutes = duration * 60;
							const endH = Math.floor((h * 60 + m + durationMinutes) / 60);
							const endM = (h * 60 + m + durationMinutes) % 60;
							setFormData((prev) => ({
								...prev,
								endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
							}));
						}}
					/>

					{/* Duration presets - HORIZONTAL SCROLL */}
					<div>
						<Label>Czas trwania *</Label>
						<div className="mt-2 -mx-4 overflow-x-auto px-4">
							<div className="flex gap-2 pb-2" style={{ minWidth: 'min-content' }}>
								{[1, 1.5, 2, 2.5, 3, 4, 5, 6].map((h) => (
									<button
										key={h}
										type="button"
										onClick={() => {
											setDuration(h);
											const [startH, startM] = formData.startTime.split(':').map(Number);
											const durationMinutes = h * 60;
											const endH = Math.floor((startH * 60 + startM + durationMinutes) / 60);
											const endM = (startH * 60 + startM + durationMinutes) % 60;
											setFormData((prev) => ({
												...prev,
												endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
											}));
										}}
										className={`min-h-[44px] min-w-[70px] flex-shrink-0 rounded-lg border-2 px-4 py-2 font-semibold transition-all active:scale-95 ${
											duration === h
												? 'border-blue-600 bg-blue-50 text-blue-700'
												: 'border-gray-300 bg-white text-gray-700'
										}`}
									>
										{h}h
									</button>
								))}
							</div>
						</div>
						<div className="mt-2 text-center text-sm text-gray-600">
							Zakończenie: <strong>{formData.endTime.slice(0, 5)}</strong>
						</div>
					</div>

					{conflictWarning && (
						<div className="rounded-lg border-2 border-red-200 bg-red-50 p-3 text-sm text-red-800">
							⚠️ Instruktor ma już lekcję w tym czasie
						</div>
					)}

					{/* Students - Selectable cards */}
					<div>
						{validationError && (
							<div className="mb-2 flex items-center gap-2 text-sm text-red-600">
								<span>⚠</span>
								<span>{validationError}</span>
							</div>
						)}
						<Label>Kursanci * ({formData.studentIds.length})</Label>
						<Input
							placeholder="Szukaj..."
							value={studentSearch}
							onChange={(e) => setStudentSearch(e.target.value)}
							className="mt-1 mb-3 h-11"
						/>
						<div className="max-h-64 space-y-2 overflow-y-auto">
							{filteredStudents.length === 0 ? (
								<div className="py-8 text-center text-sm text-gray-500">
									{students.length === 0 ? 'Brak aktywnych kursantów' : 'Brak wyników'}
								</div>
							) : (
								filteredStudents.map((student) => (
									<button
										key={student.id}
										type="button"
										onClick={() => handleStudentToggle(student.id)}
										className={`min-h-[54px] w-full rounded-lg border-2 p-3 text-left transition-all active:scale-98 ${
											formData.studentIds.includes(student.id)
												? 'border-blue-600 bg-blue-50'
												: 'border-gray-200 bg-white'
										}`}
									>
										<div className="font-medium">
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

					{/* Status - Segment Control */}
					<div>
						<Label>Status</Label>
						<div className="mt-2 -mx-4 overflow-x-auto px-4">
							<div className="flex gap-2 pb-2" style={{ minWidth: 'min-content' }}>
								{[
									{ value: 'completed', label: 'Ukończona' },
									{ value: 'scheduled', label: 'Zaplanowana' },
									{ value: 'cancelled', label: 'Anulowana' },
								].map((status) => (
									<button
										key={status.value}
										type="button"
										onClick={() => setFormData({ ...formData, status: status.value as any })}
										className={`min-h-[44px] min-w-[110px] flex-shrink-0 rounded-lg border-2 px-4 py-2 font-semibold transition-all active:scale-95 ${
											formData.status === status.value
												? 'border-blue-600 bg-blue-600 text-white'
												: 'border-gray-300 bg-white text-gray-700'
										}`}
									>
										{status.label}
									</button>
								))}
							</div>
						</div>
					</div>

					{/* Notes */}
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

					{/* Sticky submit */}
					<div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4">
						<Button
							type="submit"
							disabled={loading || conflictWarning}
							className="h-12 w-full text-base font-semibold"
						>
							{loading ? 'Zapisywanie...' : lesson ? 'Zapisz zmiany' : 'Dodaj lekcję'}
						</Button>
					</div>
				</form>
			</BottomSheet>
		);
	}

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

					{isMobile ? (
						<>
							<TimePicker
								label="Godzina rozpoczęcia *"
								value={formData.startTime}
								onChange={(val) => {
									setFormData({ ...formData, startTime: val });
									// Auto-update endTime
									const [h, m] = val.split(':').map(Number);
									const durationMinutes = duration * 60;
									const endH = Math.floor((h * 60 + m + durationMinutes) / 60);
									const endM = (h * 60 + m + durationMinutes) % 60;
									setFormData(prev => ({
										...prev,
										endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
									}));
								}}
							/>
							<DurationPicker
								label="Czas trwania *"
								value={duration}
								onChange={(val) => {
									setDuration(val);
									const [h, m] = formData.startTime.split(':').map(Number);
									const durationMinutes = val * 60;
									const endH = Math.floor((h * 60 + m + durationMinutes) / 60);
									const endM = (h * 60 + m + durationMinutes) % 60;
									setFormData(prev => ({
										...prev,
										endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
									}));
								}}
							/>
						</>
					) : (
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
					)}

					{conflictWarning && (
						<div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
							W tym czasie instruktor ma juÅ¼ zaplanowanÄ… lekcjÄ™. Wybierz inny
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
							<option value="completed">Ukończona</option>
							<option value="scheduled">Zaplanowana</option>
							<option value="cancelled">Anulowana</option>
						</Select>
					</div>

					<div>
						{validationError && (
							<div className="mb-2 flex items-center gap-2 text-sm text-red-600">
								<span>⚠</span>
								<span>{validationError}</span>
							</div>
						)}
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
