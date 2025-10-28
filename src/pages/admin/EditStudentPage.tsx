import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentService } from '@/services/student.service';
import { instructorService } from '@/services/instructor.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { User, Student } from '@/types';

export default function EditStudentPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [instructors, setInstructors] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [formData, setFormData] = useState<Student | null>(null);

	useEffect(() => {
		if (id) loadData(id);
	}, [id]);

	const loadData = async (studentId: string) => {
		try {
			const [student, instructorsData] = await Promise.all([
				studentService.getStudent(studentId),
				instructorService.getInstructors(),
			]);
			setFormData(student);
			setInstructors(instructorsData);
		} catch (error) {
			console.error('Error loading data:', error);
			alert('Błąd ładowania danych');
			navigate('/admin/students');
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!formData || !id) return;

		setSaving(true);
		try {
			await studentService.updateStudent(id, formData);
			navigate(`/admin/students/${id}`);
		} catch (error) {
			console.error('Error updating student:', error);
			alert('Błąd aktualizacji kursanta');
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!id || !formData) return;

		const confirmed = window.confirm(
			`Czy na pewno chcesz usunąć kursanta ${formData.firstName} ${formData.lastName}?\n\nTa operacja jest nieodwracalna.`
		);

		if (!confirmed) return;

		try {
			await studentService.deleteStudent(id);
			navigate('/admin/students');
		} catch (error) {
			console.error('Error deleting student:', error);
			alert('Błąd usuwania kursanta');
		}
	};

	if (loading || !formData) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="p-8">
			<div className="mb-4 flex items-center justify-between">
				<Button
					variant="ghost"
					onClick={() => navigate(`/admin/students/${id}`)}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Powrót
				</Button>
				<Button variant="destructive" onClick={handleDelete}>
					<Trash2 className="mr-2 h-4 w-4" />
					Usuń kursanta
				</Button>
			</div>

			<h1 className="mb-6 text-3xl font-bold">
				Edytuj: {formData.firstName} {formData.lastName}
			</h1>

			<form onSubmit={handleSubmit}>
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Dane osobowe</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="firstName">Imię *</Label>
									<Input
										id="firstName"
										required
										value={formData.firstName}
										onChange={(e) =>
											setFormData({ ...formData, firstName: e.target.value })
										}
									/>
								</div>
								<div>
									<Label htmlFor="lastName">Nazwisko *</Label>
									<Input
										id="lastName"
										required
										value={formData.lastName}
										onChange={(e) =>
											setFormData({ ...formData, lastName: e.target.value })
										}
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="phone">Telefon</Label>
									<Input
										id="phone"
										type="tel"
										value={formData.phone || ''}
										onChange={(e) =>
											setFormData({ ...formData, phone: e.target.value })
										}
									/>
								</div>
								<div>
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={formData.email || ''}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="pkkNumber">Numer PKK</Label>
									<Input
										id="pkkNumber"
										value={formData.pkkNumber || ''}
										onChange={(e) =>
											setFormData({ ...formData, pkkNumber: e.target.value })
										}
									/>
								</div>
								<div>
									<Label htmlFor="city">Miasto zdawania</Label>
									<Input
										id="city"
										value={formData.city || ''}
										onChange={(e) =>
											setFormData({ ...formData, city: e.target.value })
										}
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Dane kursu</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="instructorId">Instruktor *</Label>
								<Select
									id="instructorId"
									required
									value={formData.instructorId || ''}
									onChange={(e) =>
										setFormData({ ...formData, instructorId: e.target.value })
									}>
									<option value="">Wybierz instruktora</option>
									{instructors.map((instructor) => (
										<option key={instructor.id} value={instructor.id}>
											{instructor.firstName} {instructor.lastName}
										</option>
									))}
								</Select>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="coursePrice">Cena kursu (zł) *</Label>
									<Input
										id="coursePrice"
										type="number"
										step="0.01"
										required
										value={formData.coursePrice}
										onChange={(e) =>
											setFormData({
												...formData,
												coursePrice: parseFloat(e.target.value),
											})
										}
									/>
								</div>
								<div>
									<Label htmlFor="courseStartDate">Data rozpoczęcia</Label>
									<Input
										id="courseStartDate"
										type="date"
										value={formData.courseStartDate || ''}
										onChange={(e) =>
											setFormData({
												...formData,
												courseStartDate: e.target.value,
											})
										}
									/>
								</div>
							</div>

							<div>
								<Label htmlFor="totalHoursDriven">Wyjeżdżone godziny</Label>
								<Input
									id="totalHoursDriven"
									type="number"
									step="0.25"
									value={formData.totalHoursDriven}
									onChange={(e) =>
										setFormData({
											...formData,
											totalHoursDriven: parseFloat(e.target.value),
										})
									}
								/>
							</div>

							<div className="space-y-2">
								<label className="flex items-center gap-2">
									<Checkbox
										checked={formData.theoryPassed}
										onChange={(e) =>
											setFormData({
												...formData,
												theoryPassed: e.target.checked,
											})
										}
									/>
									<span className="text-sm">Teoria zdana</span>
								</label>
								<label className="flex items-center gap-2">
									<Checkbox
										checked={formData.internalExamPassed}
										onChange={(e) =>
											setFormData({
												...formData,
												internalExamPassed: e.target.checked,
											})
										}
									/>
									<span className="text-sm">Egzamin wewnętrzny zdany</span>
								</label>
								<label className="flex items-center gap-2">
									<Checkbox
										checked={formData.isSupplementaryCourse}
										onChange={(e) =>
											setFormData({
												...formData,
												isSupplementaryCourse: e.target.checked,
											})
										}
									/>
									<span className="text-sm">Kurs uzupełniający</span>
								</label>
								<label className="flex items-center gap-2">
									<Checkbox
										checked={formData.car}
										onChange={(e) =>
											setFormData({ ...formData, car: e.target.checked })
										}
									/>
									<span className="text-sm">Auto na egzamin</span>
								</label>
								<label className="flex items-center gap-2">
									<Checkbox
										checked={formData.active}
										onChange={(e) =>
											setFormData({ ...formData, active: e.target.checked })
										}
									/>
									<span className="text-sm">Kursant aktywny</span>
								</label>
							</div>
						</CardContent>
					</Card>

					<Card className="md:col-span-2">
						<CardHeader>
							<CardTitle>Notatki</CardTitle>
						</CardHeader>
						<CardContent>
							<Textarea
								value={formData.notes || ''}
								onChange={(e) =>
									setFormData({ ...formData, notes: e.target.value })
								}
								rows={3}
							/>
						</CardContent>
					</Card>
				</div>

				<div className="mt-6 flex justify-end gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate(`/admin/students/${id}`)}>
						Anuluj
					</Button>
					<Button type="submit" disabled={saving}>
						{saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
					</Button>
				</div>
			</form>
		</div>
	);
}
