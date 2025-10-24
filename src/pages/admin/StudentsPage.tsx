import { useEffect, useState } from 'react';
import { studentService } from '@/services/student.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus, Phone, Mail } from 'lucide-react';
import type { Student } from '@/types';
import { useNavigate } from 'react-router-dom';

type StudentWithInstructor = Student & {
	instructor?: { firstName: string; lastName: string };
};

export default function StudentsPage() {
	const [students, setStudents] = useState<StudentWithInstructor[]>([]);
	const [filteredStudents, setFilteredStudents] = useState<
		StudentWithInstructor[]
	>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		loadStudents();
	}, []);

	useEffect(() => {
		if (search) {
			const filtered = students.filter(
				(s) =>
					`${s.firstName} ${s.lastName}`
						.toLowerCase()
						.includes(search.toLowerCase()) ||
					s.phone?.includes(search) ||
					s.pkkNumber?.toLowerCase().includes(search.toLowerCase())
			);
			setFilteredStudents(filtered);
		} else {
			setFilteredStudents(students);
		}
	}, [search, students]);

	const loadStudents = async () => {
		try {
			const data = await studentService.getStudents();
			setStudents(data);
			setFilteredStudents(data);
		} catch (error) {
			console.error('Error loading students:', error);
		} finally {
			setLoading(false);
		}
	};

	const formatHours = (hours: number) => {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return m > 0 ? `${h}h${m}m` : `${h}h`;
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="p-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Kursanci</h1>
				<Button onClick={() => navigate('/admin/students/add')}>
					<Plus className="mr-2 h-4 w-4" />
					Dodaj kursanta
				</Button>
			</div>

			<Card>
				<CardContent className="pt-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<Input
							placeholder="Szukaj po imieniu, nazwisku, telefonie, PKK..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-10"
						/>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-4">
				{filteredStudents.map((student) => (
					<Card
						key={student.id}
						className={`cursor-pointer transition-shadow hover:shadow-md ${
							!student.active ? 'opacity-60' : ''
						}`}
						onClick={() => navigate(`/admin/students/${student.id}`)}>
						<CardContent className="pt-6">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="mb-2 flex items-center gap-2">
										<h3 className="text-lg font-semibold">
											{student.firstName} {student.lastName}
										</h3>
										{!student.active && (
											<Badge variant="secondary">Nieaktywny</Badge>
										)}
										{student.theoryPassed && (
											<Badge variant="default">Teoria ✓</Badge>
										)}
										{student.coursePaid && (
											<Badge variant="default">Opłacony</Badge>
										)}
									</div>

									<div className="space-y-1 text-sm text-gray-600">
										{student.phone && (
											<div className="flex items-center gap-2">
												<Phone className="h-4 w-4" />
												{student.phone}
											</div>
										)}
										{student.email && (
											<div className="flex items-center gap-2">
												<Mail className="h-4 w-4" />
												{student.email}
											</div>
										)}
										{student.instructor && (
											<div className="text-gray-500">
												Instruktor: {student.instructor.firstName}{' '}
												{student.instructor.lastName}
											</div>
										)}
									</div>
								</div>

								<div className="text-right">
									<div className="text-lg font-semibold text-primary">
										{formatHours(student.totalHoursDriven)}
									</div>
									<div className="text-sm text-gray-500">wyjeżdżone</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}

				{filteredStudents.length === 0 && (
					<div className="py-12 text-center text-gray-500">Brak kursantów</div>
				)}
			</div>
		</div>
	);
}
