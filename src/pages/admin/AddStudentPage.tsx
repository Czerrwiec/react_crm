import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '@/services/student.service';
import { instructorService } from '@/services/instructor.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import type { Package, User } from '@/types';
import InstructorMultiSelect from '@/components/InstructorMultiSelect';
import { Select } from '@/components/ui/select';
import { packageService } from '@/services/package.service';


export default function AddStudentPage() {
	const navigate = useNavigate();
	const [instructors, setInstructors] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [packages, setPackages] = useState<Package[]>([]);
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		phone: '',
		email: '',
		pesel: '', // NOWE
		pkkNumber: '',
		city: '',
		instructorIds: [] as string[],
		coursePrice: '3200',
		courseStartDate: new Date().toISOString().split('T')[0],
		profileUpdated: false, // NOWE
		internalTheoryPassed: false, // NOWE
		internalPracticePassed: false, // NOWE
		stateExamStatus: 'allowed' as 'allowed' | 'failed' | 'passed', // NOWE
		stateExamAttempts: 0, // NOWE
		isSupplementaryCourse: false,
		car: false,
		inactive: false,
		notes: '',
		packageId: '',
	});

	useEffect(() => {
		loadInstructors();
	}, []);

	useEffect(() => {
		loadPackages();
	}, []);

	const loadPackages = async () => {
		const data = await packageService.getPackages();
		setPackages(data);
	};

	const loadInstructors = async () => {
		try {
			const data = await instructorService.getInstructors();
			setInstructors(data);
			if (data.length > 0) {
				setFormData((prev) => ({ ...prev, instructorId: data[0].id }));
			}
		} catch (error) {
			console.error('Error loading instructors:', error);
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			await studentService.createStudent({
				firstName: formData.firstName,
				lastName: formData.lastName,
				phone: formData.phone || null,
				email: formData.email || null,
				pesel: formData.pesel || null, // NOWE
				pkkNumber: formData.pkkNumber || null,
				city: formData.city || null,
				instructorIds: formData.instructorIds,
				coursePrice: parseFloat(formData.coursePrice),
				courseStartDate: formData.courseStartDate,
				profileUpdated: formData.profileUpdated, // NOWE
				internalTheoryPassed: formData.internalTheoryPassed, // NOWE
				internalPracticePassed: formData.internalPracticePassed, // NOWE
				stateExamStatus: formData.stateExamStatus, // NOWE
				stateExamAttempts: formData.stateExamAttempts, // NOWE
				isSupplementaryCourse: formData.isSupplementaryCourse,
				car: formData.car,
				inactive: formData.inactive,
				notes: formData.notes || null,
				coursePaid: false,
				totalHoursDriven: 0,
			});

			navigate('/admin/students');
		} catch (error) {
			console.error('Error creating student:', error);
			alert('Błąd dodawania kursanta');
		} finally {
			setLoading(false);
		}
	};

	const canEditStateExam =
		formData.profileUpdated &&
		formData.internalTheoryPassed &&
		formData.internalPracticePassed;

	return (
		<div className="p-2 sm:p-4 md:p-8">
			<div className="flex justify-end mb-4 pt-2">
				<Button variant="ghost" onClick={() => navigate('/admin/students')}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Powrót
				</Button>
			</div>

			<h1 className="mb-6 text-3xl font-bold">Dodaj kursanta</h1>

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
										value={formData.phone}
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
										value={formData.pesel}
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
										value={formData.email}
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
										value={formData.pkkNumber}
										onChange={(e) =>
											setFormData({ ...formData, pkkNumber: e.target.value })
										}
									/>
								</div>
								<div>
									<Label htmlFor="city">Miasto zdawania</Label>
									<Input
										id="city"
										value={formData.city}
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
									instructors={instructors}
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
											const pkg = packages.find((p) => p.id === e.target.value);
											setFormData({
												...formData,
												packageId: e.target.value,
												coursePrice: pkg
													? pkg.price.toString()
													: formData.coursePrice,
											});
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
											setFormData({ ...formData, coursePrice: e.target.value })
										}
									/>
								</div>
								<div>
									<Label htmlFor="courseStartDate">Data rozpoczęcia</Label>
									<Input
										id="courseStartDate"
										type="date"
										value={formData.courseStartDate}
										onChange={(e) =>
											setFormData({
												...formData,
												courseStartDate: e.target.value,
											})
										}
									/>
								</div>
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
										value={formData.stateExamStatus}
										disabled={!canEditStateExam} // DODAJ
										onChange={(e) =>
											setFormData({
												...formData,
												stateExamStatus: e.target.value as any,
											})
										}>
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
								value={formData.notes}
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
						onClick={() => navigate('/admin/students')}>
						Anuluj
					</Button>
					<Button type="submit" disabled={loading}>
						{loading ? 'Dodawanie...' : 'Dodaj kursanta'}
					</Button>
				</div>
			</form>
		</div>
	);
}
