import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { instructorService } from '@/services/instructor.service';
import { studentService } from '@/services/student.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { lessonService } from '@/services/lesson.service';
import { ArrowLeft, Pencil, Trash2, Save, X } from 'lucide-react';
import type { User, Student } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export default function InstructorDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [instructor, setInstructor] = useState<User | null>(null);
	const [students, setStudents] = useState<Student[]>([]);
	const [showInactive, setShowInactive] = useState(false);
	const [loading, setLoading] = useState(true);
	const [editing, setEditing] = useState(false);
	const [formData, setFormData] = useState<User | null>(null);

	useEffect(() => {
		if (id) {
			loadData(id);
			loadLessonStats(id, new Date());
		}
	}, [id]);

	const loadData = async (instructorId: string) => {
		try {
			const [instructorData, allStudents] = await Promise.all([
				instructorService.getInstructor(instructorId),
				studentService.getStudents(),
			]);

			setInstructor(instructorData);
			setFormData(instructorData);

			// Filtruj studentów, którzy mają tego instruktora w swoim array
			const instructorStudents = allStudents.filter((s) =>
				s.instructorIds.includes(instructorId)
			);
			setStudents(instructorStudents);
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		if (!formData || !id) return;

		try {
			await instructorService.updateInstructor(id, formData);
			setInstructor(formData);
			setEditing(false);
		} catch (error) {
			console.error('Error updating instructor:', error);
			alert('Błąd aktualizacji instruktora');
		}
	};

	const handleDelete = async () => {
		if (!id || !instructor) return;

		// Sprawdź czy ma aktywnych kursantów
		const activeCount = students.filter((s) => !s.inactive).length;
		if (activeCount > 0) {
			alert(
				`Nie można dezaktywować instruktora, który ma ${activeCount} aktywnych kursantów.\n\nNajpierw usuń lub przenieś kursantów do innego instruktora.`
			);
			return;
		}

		const confirmed = window.confirm(
			`Czy na pewno chcesz dezaktywować instruktora ${instructor.firstName} ${instructor.lastName}?\n\nInstruktor nie będzie mógł się zalogować, ale jego dane zostaną zachowane.`
		);

		if (!confirmed) return;

		try {
			await instructorService.updateInstructor(id, { active: false });
			navigate('/admin/instructors');
		} catch (error: any) {
			alert(error.message || 'Błąd dezaktywacji instruktora');
		}
	};
	
	const [lessonStats, setLessonStats] = useState<{
		scheduled: number;
		completed: number;
		month: Date;
	}>({
		scheduled: 0,
		completed: 0,
		month: new Date(),
	});

	const loadLessonStats = async (instructorId: string, month: Date) => {
		try {
			const lessonsData = await lessonService.getLessonsByInstructor(
				instructorId,
				month
			);

			const scheduled = lessonsData
				.filter((l) => l.status === 'scheduled')
				.reduce((sum, l) => sum + l.duration, 0);
			const completed = lessonsData
				.filter((l) => l.status === 'completed')
				.reduce((sum, l) => sum + l.duration, 0);

			setLessonStats({ scheduled, completed, month });
		} catch (error) {
			console.error('Error loading lesson stats:', error);
		}
	};

	const formatHours = (hours: number) => {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	};

	if (loading || !instructor || !formData) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	const activeStudents = students.filter((s) => !s.inactive);
	const displayedStudents = showInactive ? students : activeStudents;

	return (
		<div className="p-4 sm:p-8">
			<div className="mb-4 flex items-center justify-between">
				{/* Mobile - tylko ikony */}
				<div className="flex items-center gap-2 sm:hidden">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => navigate('/admin/instructors')}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
				</div>

				{/* Desktop */}
				<div className="hidden sm:flex">
					<Button
						variant="ghost"
						onClick={() => navigate('/admin/instructors')}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Powrót
					</Button>
				</div>

				{/* Usuń instruktora */}
				<Button
					variant="destructive"
					size="icon"
					className="sm:w-auto sm:px-4"
					onClick={handleDelete}>
					<Trash2 className="h-4 w-4 sm:mr-2" />
					<span className="hidden sm:inline">Usuń instruktora</span>
				</Button>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg sm:text-xl">
								Dane instruktora
							</CardTitle>
							{!editing && (
								<Button
									size="icon"
									variant="outline"
									onClick={() => setEditing(true)}>
									<Pencil className="h-4 w-4" />
								</Button>
							)}
						</div>
					</CardHeader>

					<CardContent className="space-y-4">
						{editing ? (
							<>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label>Imię</Label>
										<Input
											value={formData.firstName || ''}
											onChange={(e) =>
												setFormData({ ...formData, firstName: e.target.value })
											}
										/>
									</div>
									<div>
										<Label>Nazwisko</Label>
										<Input
											value={formData.lastName || ''}
											onChange={(e) =>
												setFormData({ ...formData, lastName: e.target.value })
											}
										/>
									</div>
								</div>
								<div>
									<Label>Email</Label>
									<Input
										type="email"
										value={formData.email}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
									/>
								</div>
								<div>
									<Label>Telefon</Label>
									<Input
										value={formData.phone || ''}
										onChange={(e) =>
											setFormData({ ...formData, phone: e.target.value })
										}
									/>
								</div>
								
								<div className="flex gap-2">
									<Button onClick={handleSave} className="flex-1">
										<Save className="mr-2 h-4 w-4" />
										Zapisz
									</Button>
									<Button
										variant="outline"
										onClick={() => {
											setFormData(instructor);
											setEditing(false);
										}}>
										<X className="mr-2 h-4 w-4" />
										Anuluj
									</Button>
								</div>
							</>
						) : (
							<>
								<div>
									<strong>Email:</strong> {instructor.email}
								</div>
								{instructor.phone && (
									<div>
										<strong>Telefon:</strong> {instructor.phone}
									</div>
								)}
								<div>
									<strong>Status:</strong>{' '}
									{instructor.active ? 'Aktywny' : 'Nieaktywny'}
								</div>
							</>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<CardTitle className="text-lg sm:text-xl">
								Kursanci ({activeStudents.length})
							</CardTitle>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowInactive(!showInactive)}>
								{showInactive ? 'Ukryj nieaktywnych' : 'Pokaż nieaktywnych'}
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{displayedStudents.length === 0 ? (
							<div className="py-4 text-center text-gray-500">
								{showInactive ? 'Brak kursantów' : 'Brak aktywnych kursantów'}
							</div>
						) : (
							<div className="space-y-2 max-h-[340px] overflow-y-auto">
								{displayedStudents.map((student) => (
									<div
										key={student.id}
										className={`flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 cursor-pointer ${
											student.inactive ? 'opacity-60' : ''
										}`}
										onClick={() => navigate(`/admin/students/${student.id}`)}>
										<div>
											<div className="font-medium">
												{student.firstName} {student.lastName}
											</div>
											{/* {student.phone && (
												<div className="text-sm text-gray-500">
													{student.phone}
												</div>
											)} */}
										</div>
										{student.inactive && (
											<Badge variant="secondary">Nieaktywny</Badge>
										)}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Statystyki lekcji */}
				<Card className="md:col-span-2">
					<CardHeader>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<CardTitle className="text-lg sm:text-xl">
								Statystyki lekcji
							</CardTitle>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										const prevMonth = new Date(lessonStats.month);
										prevMonth.setMonth(prevMonth.getMonth() - 1);
										loadLessonStats(instructor.id, prevMonth);
									}}>
									←
								</Button>
								<span className="text-sm font-medium min-w-[120px] text-center">
									{format(lessonStats.month, 'LLLL yyyy', { locale: pl })}
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										const nextMonth = new Date(lessonStats.month);
										nextMonth.setMonth(nextMonth.getMonth() + 1);
										loadLessonStats(instructor.id, nextMonth);
									}}>
									→
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4">
							<div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
								<div className="text-sm text-amber-700 mb-1">Zaplanowane</div>
								<div className="text-2xl font-bold text-amber-900">
									{formatHours(lessonStats.scheduled)}
								</div>
							</div>
							<div className="rounded-lg bg-green-50 p-4 border border-green-200">
								<div className="text-sm text-green-700 mb-1">Ukończone</div>
								<div className="text-2xl font-bold text-green-900">
									{formatHours(lessonStats.completed)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
