import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { instructorService } from '@/services/instructor.service';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Phone, Mail, Users } from 'lucide-react';
import type { User } from '@/types';

type InstructorWithCount = User & { studentCount: number };

export default function InstructorsPage() {
	const navigate = useNavigate();
	const [instructors, setInstructors] = useState<InstructorWithCount[]>([]);
	const [filteredInstructors, setFilteredInstructors] = useState<
		InstructorWithCount[]
	>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadInstructors();
	}, []);

	useEffect(() => {
		if (search) {
			const filtered = instructors.filter(
				(i) =>
					`${i.firstName} ${i.lastName}`
						.toLowerCase()
						.includes(search.toLowerCase()) ||
					i.email.toLowerCase().includes(search.toLowerCase()) ||
					i.phone?.includes(search)
			);
			setFilteredInstructors(filtered);
		} else {
			setFilteredInstructors(instructors);
		}
	}, [search, instructors]);

	const loadInstructors = async () => {
		try {
			const data = await instructorService.getInstructorWithStudentCount();
			setInstructors(data);
			setFilteredInstructors(data);
		} catch (error) {
			console.error('Error loading instructors:', error);
		} finally {
			setLoading(false);
		}
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
				<h1 className="text-3xl font-bold">Instruktorzy</h1>
				<Button onClick={() => navigate('/admin/instructors/add')}>
					<Plus className="mr-2 h-4 w-4" />
					Dodaj instruktora
				</Button>
			</div>

			<Card className="mb-6">
				<CardContent className="pt-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<Input
							placeholder="Szukaj po imieniu, nazwisku, email..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-10"
						/>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-4">
				{filteredInstructors.map((instructor) => (
					<Card
						key={instructor.id}
						className={`cursor-pointer transition-shadow hover:shadow-md ${
							!instructor.active ? 'opacity-60' : ''
						}`}
						onClick={() => navigate(`/admin/instructors/${instructor.id}`)}>
						<CardContent className="pt-6">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="mb-2 flex items-center gap-2">
										<h3 className="text-lg font-semibold">
											{instructor.firstName} {instructor.lastName}
										</h3>
										{!instructor.active && (
											<Badge variant="secondary">Nieaktywny</Badge>
										)}
									</div>

									<div className="space-y-1 text-sm text-gray-600">
										<div className="flex items-center gap-2">
											<Mail className="h-4 w-4" />
											{instructor.email}
										</div>
										{instructor.phone && (
											<div className="flex items-center gap-2">
												<Phone className="h-4 w-4" />
												{instructor.phone}
											</div>
										)}
									</div>
								</div>

								<div className="text-right">
									<div className="flex items-center gap-2 text-lg font-semibold text-primary">
										<Users className="h-5 w-5" />
										{instructor.studentCount}
									</div>
									<div className="text-sm text-gray-500">kursantów</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}

				{filteredInstructors.length === 0 && (
					<div className="py-12 text-center text-gray-500">
						Brak instruktorów
					</div>
				)}
			</div>
		</div>
	);
}
