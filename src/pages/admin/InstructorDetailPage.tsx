import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { instructorService } from '@/services/instructor.service';
import { studentService } from '@/services/student.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Trash2, Save, X } from 'lucide-react';
import type { User, Student } from '@/types';

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
		if (id) loadData(id);
	}, [id]);

	const loadData = async (instructorId: string) => {
		try {
			const [instructorData, allStudents] = await Promise.all([
				instructorService.getInstructor(instructorId),
				studentService.getStudents(),
			]);

			setInstructor(instructorData);
			setFormData(instructorData);
			setStudents(allStudents.filter((s) => s.instructorId === instructorId));
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

		const confirmed = window.confirm(
			`Czy na pewno chcesz usunąć instruktora ${instructor.firstName} ${instructor.lastName}?\n\nTa operacja jest nieodwracalna.`
		);

		if (!confirmed) return;

		try {
			await instructorService.deleteInstructor(id);
			navigate('/admin/instructors');
		} catch (error: any) {
			alert(error.message || 'Błąd usuwania instruktora');
		}
	};

	if (loading || !instructor || !formData) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	const activeStudents = students.filter((s) => s.active);
	const displayedStudents = showInactive ? students : activeStudents;

	return (
		<div className="p-8">
			<div className="mb-4 flex items-center justify-between">
				<Button variant="ghost" onClick={() => navigate('/admin/instructors')}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Powrót
				</Button>
				<Button variant="destructive" onClick={handleDelete}>
					<Trash2 className="mr-2 h-4 w-4" />
					Usuń instruktora
				</Button>
			</div>

			<div className="mb-6">
				<h1 className="text-3xl font-bold">
					{instructor.firstName} {instructor.lastName}
				</h1>
				{!instructor.active && (
					<Badge variant="secondary" className="mt-2">
						Nieaktywny
					</Badge>
				)}
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Dane instruktora</CardTitle>
							{!editing && (
								<Button
									size="sm"
									variant="outline"
									onClick={() => setEditing(true)}>
									<Pencil className="mr-2 h-4 w-4" />
									Edytuj
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
								<label className="flex items-center gap-2">
									<Checkbox
										checked={formData.active}
										onChange={(e) =>
											setFormData({ ...formData, active: e.target.checked })
										}
									/>
									<span className="text-sm">Instruktor aktywny</span>
								</label>

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
						<div className="flex items-center justify-between">
							<CardTitle>Kursanci ({activeStudents.length})</CardTitle>
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
							<div className="space-y-2">
								{displayedStudents.map((student) => (
									<div
										key={student.id}
										className={`flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 cursor-pointer ${
											!student.active ? 'opacity-60' : ''
										}`}
										onClick={() => navigate(`/admin/students/${student.id}`)}>
										<div>
											<div className="font-medium">
												{student.firstName} {student.lastName}
											</div>
											{student.phone && (
												<div className="text-sm text-gray-500">
													{student.phone}
												</div>
											)}
										</div>
										{!student.active && (
											<Badge variant="secondary">Nieaktywny</Badge>
										)}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
