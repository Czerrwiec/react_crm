import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '@/services/student.service';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Phone, Mail } from 'lucide-react';
import type { Student } from '@/types';

export default function InstructorStudentsPage() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [students, setStudents] = useState<Student[]>([]);
	const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [showInactive, setShowInactive] = useState(false);
	const initialized = useRef(false);

	useEffect(() => {
		if (initialized.current) return;
		initialized.current = true;
		if (user) loadStudents();
	}, [user]);

	useEffect(() => {
		applyFilters();
	}, [search, students, showInactive]);

	const loadStudents = async () => {
		if (!user) return;

		try {
			const allStudents = await studentService.getStudents();
			const myStudents = allStudents.filter((s) => s.instructorId === user.id);
			setStudents(myStudents);
		} catch (error) {
			console.error('Error loading students:', error);
		} finally {
			setLoading(false);
		}
	};

	const applyFilters = () => {
		let filtered = students;

		if (!showInactive) {
			filtered = filtered.filter((s) => s.active);
		}

		if (search) {
			const query = search.toLowerCase();
			filtered = filtered.filter(
				(s) =>
					`${s.firstName} ${s.lastName}`.toLowerCase().includes(query) ||
					s.phone?.includes(search) ||
					s.pkkNumber?.toLowerCase().includes(query)
			);
		}

		setFilteredStudents(filtered);
	};

	const formatHours = (hours: number) => {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col">
			{/* Fixed Header */}
			<div className="flex-shrink-0 border-b bg-white">
				<div className="p-4 sm:p-6">
					{/* Mobile Header */}
					<div className="mb-4 flex items-center justify-end md:hidden">
						<Button
							variant={showInactive ? 'default' : 'outline'}
							onClick={() => setShowInactive(!showInactive)}>
							{showInactive ? 'Ukryj nieaktywnych' : 'Pokaż nieaktywnych'}
						</Button>
					</div>

					{/* Desktop Header */}
					<div className="mb-4 hidden items-center justify-end md:flex">
						<Button
							variant={showInactive ? 'default' : 'outline'}
							onClick={() => setShowInactive(!showInactive)}>
							{showInactive ? 'Ukryj nieaktywnych' : 'Pokaż nieaktywnych'}
						</Button>
					</div>

					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<Input
							placeholder="Szukaj..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>
			</div>

			{/* Scrollable Content */}
			<div className="flex-1 overflow-auto">
				<div className="p-4 sm:p-6">
					<div className="grid gap-4">
						{filteredStudents.map((student) => (
							<Card
								key={student.id}
								className={`cursor-pointer transition-shadow hover:shadow-md ${
									!student.active ? 'opacity-60' : ''
								}`}
								onClick={() => navigate(`/instructor/students/${student.id}`)}>
								<CardContent className="p-4">
									<div className="flex items-start justify-between gap-3">
										<div className="flex-1 min-w-0">
											<div className="mb-2">
												<h3 className="text-base font-semibold sm:text-lg">
													{student.firstName} {student.lastName}
												</h3>
												<div className="mt-1 flex flex-wrap items-center gap-1">
													{!student.active && (
														<Badge variant="secondary" className="text-xs">
															Nieaktywny
														</Badge>
													)}
													{/* Desktop only */}
													<div className="hidden sm:flex sm:flex-wrap sm:gap-2">
														{student.theoryPassed && (
															<Badge variant="default" className="text-xs">
																Teoria ✓
															</Badge>
														)}
														{student.coursePaid && (
															<Badge variant="default" className="text-xs">
																Opłacony
															</Badge>
														)}
													</div>
													{/* Mobile only */}
													<div className="flex flex-wrap gap-1 sm:hidden">
														{student.isSupplementaryCourse && (
															<Badge
																variant="secondary"
																className="text-[10px] px-1.5 py-0">
																Uzupełniający
															</Badge>
														)}
														{student.car && (
															<Badge
																variant="secondary"
																className="text-[10px] px-1.5 py-0">
																Auto
															</Badge>
														)}
													</div>
												</div>
											</div>

											<div className="space-y-1 text-sm text-gray-600">
												{student.phone && (
													<div className="flex items-center gap-2">
														<Phone className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
														<span className="truncate">{student.phone}</span>
													</div>
												)}
												{student.email && (
													<div className="hidden items-center gap-2 sm:flex">
														<Mail className="h-4 w-4 flex-shrink-0" />
														<span className="truncate">{student.email}</span>
													</div>
												)}
											</div>
										</div>

										<div className="flex-shrink-0 text-right">
											<div className="text-base font-semibold text-primary sm:text-lg">
												{formatHours(student.totalHoursDriven)}
											</div>
											<div className="text-xs text-gray-500 sm:text-sm">
												wyjezdzone
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						))}

						{filteredStudents.length === 0 && (
							<div className="py-12 text-center text-gray-500">
								{students.length === 0
									? 'Nie masz przypisanych kursantów'
									: 'Brak wyników wyszukiwania'}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
