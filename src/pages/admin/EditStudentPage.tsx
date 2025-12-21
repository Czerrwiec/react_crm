import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentService } from '@/services/student.service';
import { instructorService } from '@/services/instructor.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InstructorMultiSelect from '@/components/InstructorMultiSelect';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { User, Student, Package } from '@/types';
import { Select } from '@/components/ui/select';
import { packageService } from '@/services/package.service';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function EditStudentPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [instructors, setInstructors] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [formData, setFormData] = useState<Student | null>(null);
	const [packages, setPackages] = useState<Package[]>([]);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	useEffect(() => {
		if (id) loadData(id);
	}, [id]);

	useEffect(() => {
		loadPackages();
	}, []);

	const loadPackages = async () => {
		const data = await packageService.getPackages();
		setPackages(data);
	};

	const loadData = async (studentId: string) => {
		try {
			const [student, instructorsData] = await Promise.all([
				studentService.getStudent(studentId),
				instructorService.getInstructors(),
			]);
			setFormData(student); // to już obsłuży instructorIds z mapStudent
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

	const handleDeleteConfirm = async () => {
		if (!id) return;
		try {
			await studentService.deleteStudent(id);
			navigate('/admin/students');
		} catch (error) {
			console.error('Error deleting student:', error);
			alert('Błąd usuwania kursanta');
		}
	};

	const canEditStateExam = formData
		? formData.profileUpdated &&
		  formData.internalTheoryPassed &&
		  formData.internalPracticePassed
		: false;

	if (loading || !formData) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="p-2 sm:p-4 md:p-8">
			<div className="mb-4 flex items-center justify-between pt-2">
				<Button
					variant="ghost"
					className="ml-12"
					onClick={() => navigate(`/admin/students/${id}`)}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Powrót
				</Button>
				<Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
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
									<Label htmlFor="pesel">PESEL</Label>
									<Input
										id="pesel"
										maxLength={11}
										value={formData.pesel || ''}
										onChange={(e) =>
											setFormData({ ...formData, pesel: e.target.value })
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
								<InstructorMultiSelect
									instructors={instructors.filter((i) => i.active === true)}
									selectedIds={formData.instructorIds}
									onChange={(ids) =>
										setFormData({ ...formData, instructorIds: ids })
									}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="packageId">Wariant kursu</Label>
									<Select
										id="packageId"
										value={formData.packageId || ''}
										onChange={(e) => {
											const selectedValue = e.target.value;
											if (!selectedValue) {
												setFormData({
													...formData,
													packageId: null,
												});
											} else {
												const pkg = packages.find(
													(p) => p.id === selectedValue
												);
												setFormData({
													...formData,
													packageId: selectedValue,
													coursePrice: pkg ? pkg.price : formData.coursePrice,
													customCourseHours: pkg
														? pkg.hours
														: formData.customCourseHours, // NOWE
													car: pkg ? pkg.includesCar : formData.car,
												});
											}
										}}>
										<option value="">Wybierz pakiet</option>
										{packages.map((pkg) => (
											<option key={pkg.id} value={pkg.id}>
												{pkg.name} ({pkg.price} zł, {pkg.hours}h)
											</option>
										))}
									</Select>
								</div>
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
												coursePrice: parseFloat(e.target.value), // parsuj do number
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

								<div>
									<Label htmlFor="customCourseHours">
										Liczba godzin kursu *
									</Label>
									<Input
										id="customCourseHours"
										type="number"
										step="0.5"
										min="0"
										required
										value={formData.customCourseHours || ''}
										onChange={(e) =>
											setFormData({
												...formData,
												customCourseHours: e.target.value
													? parseFloat(e.target.value)
													: null,
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
									disabled // DODAJ
									className="bg-gray-100" // DODAJ
								/>
							</div>

							<div className="space-y-2">
								<label className="flex items-center gap-2">
									<Checkbox
										checked={formData.profileUpdated}
										onChange={(e) =>
											setFormData({
												...formData,
												profileUpdated: e.target.checked,
											})
										}
									/>
									<span className="text-sm">Profil zaktualizowany</span>
								</label>

								<label className="flex items-center gap-2">
									<Checkbox
										checked={formData.internalTheoryPassed}
										onChange={(e) =>
											setFormData({
												...formData,
												internalTheoryPassed: e.target.checked,
											})
										}
									/>
									<span className="text-sm">Egzamin wewnętrzny - teoria</span>
								</label>

								<label className="flex items-center gap-2">
									<Checkbox
										checked={formData.internalPracticePassed}
										onChange={(e) =>
											setFormData({
												...formData,
												internalPracticePassed: e.target.checked,
											})
										}
									/>
									<span className="text-sm">Egzamin wewnętrzny - praktyka</span>
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
										checked={formData.inactive}
										onChange={(e) =>
											setFormData({ ...formData, inactive: e.target.checked })
										}
									/>
									<span className="text-sm">Kursant nieaktywny</span>
								</label>

								<label className="flex items-center gap-2">
									<Checkbox
										checked={formData.markProgressComplete || false}
										onChange={(e) =>
											setFormData({
												...formData,
												markProgressComplete: e.target.checked,
											})
										}
									/>
									<span className="text-sm">Oznacz progress jako 100%</span>
								</label>
							</div>

							<div className="space-y-2 pt-4 border-t">
								<Label>Egzamin państwowy</Label>

								{!canEditStateExam && (
									<p className="text-xs text-amber-600">
										Aby edytować egzamin państwowy, zaznacz: profil
										zaktualizowany, egzamin wewnętrzny teoria i praktyka
									</p>
								)}
								<div>
									<Label
										htmlFor="stateExamStatus"
										className="text-xs text-gray-600">
										Status
									</Label>
									<Select
										id="stateExamStatus"
										value={
											canEditStateExam
												? formData.stateExamStatus
												: 'not_allowed'
										}
										disabled={!canEditStateExam}
										onChange={(e) =>
											setFormData({
												...formData,
												stateExamStatus: e.target.value as any,
											})
										}>
										{!canEditStateExam && (
											<option value="not_allowed">Niedopuszczony</option>
										)}
										<option value="allowed">Dopuszczony</option>
										<option value="failed">Niezdany</option>
										<option value="passed">Zdany</option>
									</Select>
								</div>

								{(formData.stateExamStatus === 'failed' ||
									formData.stateExamStatus === 'passed') && (
									<div>
										<Label
											htmlFor="stateExamAttempts"
											className="text-xs text-gray-600">
											Liczba prób
										</Label>
										<Input
											id="stateExamAttempts"
											type="number"
											min="0"
											disabled={!canEditStateExam} // DODAJ
											value={formData.stateExamAttempts}
											onChange={(e) =>
												setFormData({
													...formData,
													stateExamAttempts: parseInt(e.target.value) || 0,
												})
											}
										/>
									</div>
								)}
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
			<ConfirmDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				title="Usunąć kursanta?"
				description={
					<>
						Czy na pewno chcesz usunąć kursanta{' '}
						<strong>
							{formData.firstName} {formData.lastName}
						</strong>
						?
						<br />
						<br />
						Ta operacja jest nieodwracalna i usunie wszystkie powiązane dane.
					</>
				}
				confirmText="Usuń kursanta"
				onConfirm={handleDeleteConfirm}
			/>
		</div>
	);
}
