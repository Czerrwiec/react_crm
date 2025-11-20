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
import type { User } from '@/types';
import InstructorMultiSelect from '@/components/InstructorMultiSelect';

export default function AddStudentPage() {
	const navigate = useNavigate();
	const [instructors, setInstructors] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		phone: '',
		email: '',
		pkkNumber: '',
		city: '',
		instructorIds: [] as string[],
		coursePrice: '3200',
		courseStartDate: new Date().toISOString().split('T')[0],
		theoryPassed: false,
		internalExamPassed: false,
		isSupplementaryCourse: false,
		car: false,
		active: true,
		notes: '',
	});

	useEffect(() => {
		loadInstructors();
	}, []);

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
				pkkNumber: formData.pkkNumber || null,
				city: formData.city || null,
				instructorIds: formData.instructorIds,
				coursePrice: parseFloat(formData.coursePrice),
				courseStartDate: formData.courseStartDate,
				theoryPassed: formData.theoryPassed,
				internalExamPassed: formData.internalExamPassed,
				isSupplementaryCourse: formData.isSupplementaryCourse,
				car: formData.car,
				active: formData.active,
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

	return (
		<div className="p-8">
			<Button
				variant="ghost"
				onClick={() => navigate('/admin/students')}
				className="mb-4">
				<ArrowLeft className="mr-2 h-4 w-4" />
				Powrót
			</Button>

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
