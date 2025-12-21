// src/pages/instructor/InstructorStudentsPage.tsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '@/services/student.service';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Phone, Mail, ChevronDown, Check } from 'lucide-react';
import type { StudentWithInstructors } from '@/types';

type SortField = 'lastName' | 'firstName' | 'courseStart';
type SortDirection = 'asc' | 'desc';

export default function InstructorStudentsPage() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [students, setStudents] = useState<StudentWithInstructors[]>([]);
	const [filteredStudents, setFilteredStudents] = useState<
		StudentWithInstructors[]
	>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const initialized = useRef(false);

	const [sortField, setSortField] = useState<SortField>('lastName');
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
	const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
	const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

	const [showInactive, setShowInactive] = useState(false);
	const [showOnlyCoursePaid, setShowOnlyCoursePaid] = useState(false);
	const [showOnlyCourseUnpaid, setShowOnlyCourseUnpaid] = useState(false);
	const [showOnlySupplementary, setShowOnlySupplementary] = useState(false);
	const [showOnlyCar, setShowOnlyCar] = useState(false);
	const [showOnlyInternalTheory, setShowOnlyInternalTheory] = useState(false);
	const [showOnlyInternalPractice, setShowOnlyInternalPractice] =
		useState(false);

	// Load from localStorage
	useEffect(() => {
		const saved = localStorage.getItem('instructorStudentsFilters');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				setSortField(parsed.sortField || 'lastName');
				setSortDirection(parsed.sortDirection || 'asc');
				setShowInactive(parsed.showInactive || false);
				setShowOnlyCoursePaid(parsed.showOnlyCoursePaid || false);
				setShowOnlyCourseUnpaid(parsed.showOnlyCourseUnpaid || false);
				setShowOnlySupplementary(parsed.showOnlySupplementary || false);
				setShowOnlyCar(parsed.showOnlyCar || false);
				setShowOnlyInternalTheory(parsed.showOnlyInternalTheory || false);
				setShowOnlyInternalPractice(parsed.showOnlyInternalPractice || false);
			} catch (e) {
				console.error('Error loading filters:', e);
			}
		}
	}, []);

	// Save to localStorage
	useEffect(() => {
		if (initialized.current) {
			localStorage.setItem(
				'instructorStudentsFilters',
				JSON.stringify({
					sortField,
					sortDirection,
					showInactive,
					showOnlyCoursePaid,
					showOnlyCourseUnpaid,
					showOnlySupplementary,
					showOnlyCar,
					showOnlyInternalTheory,
					showOnlyInternalPractice,
				})
			);
		}
	}, [
		sortField,
		sortDirection,
		showInactive,
		showOnlyCoursePaid,
		showOnlyCourseUnpaid,
		showOnlySupplementary,
		showOnlyCar,
		showOnlyInternalTheory,
		showOnlyInternalPractice,
	]);

	useEffect(() => {
		if (initialized.current) return;
		initialized.current = true;
		if (user) loadStudents();
	}, [user]);

	useEffect(() => {
		if (students.length === 0) return;
		applyFiltersAndSort();
	}, [
		search,
		students,
		sortField,
		sortDirection,
		showInactive,
		showOnlyCoursePaid,
		showOnlyCourseUnpaid,
		showOnlySupplementary,
		showOnlyCar,
		showOnlyInternalTheory,
		showOnlyInternalPractice,
	]);

	const loadStudents = async () => {
		if (!user) return;

		try {
			const allStudents = await studentService.getStudents();
			const myStudents = allStudents.filter(
				(s) => s.instructorIds.includes(user.id) && !s.inactive
			);
			setStudents(myStudents);
		} catch (error) {
			console.error('Error loading students:', error);
		} finally {
			setLoading(false);
		}
	};

	const applyFiltersAndSort = () => {
		let filtered = students;

		if (!showInactive) {
			filtered = filtered.filter((s) => !s.inactive);
		}
		if (showOnlyCoursePaid) filtered = filtered.filter((s) => s.coursePaid);
		if (showOnlyCourseUnpaid) filtered = filtered.filter((s) => !s.coursePaid);
		if (showOnlySupplementary)
			filtered = filtered.filter((s) => s.isSupplementaryCourse);
		if (showOnlyCar) filtered = filtered.filter((s) => s.car);
		if (showOnlyInternalTheory)
			filtered = filtered.filter((s) => s.internalTheoryPassed);
		if (showOnlyInternalPractice)
			filtered = filtered.filter((s) => s.internalPracticePassed);

		if (search) {
			const query = search.toLowerCase();
			filtered = filtered.filter(
				(s) =>
					`${s.firstName} ${s.lastName}`.toLowerCase().includes(query) ||
					s.phone?.includes(search) ||
					s.pkkNumber?.toLowerCase().includes(query)
			);
		}

		filtered.sort((a, b) => {
			let comparison = 0;
			switch (sortField) {
				case 'lastName':
					comparison = a.lastName.localeCompare(b.lastName);
					break;
				case 'firstName':
					comparison = a.firstName.localeCompare(b.firstName);
					break;
				case 'courseStart':
					comparison = (a.courseStartDate || '').localeCompare(
						b.courseStartDate || ''
					);
					break;
			}
			return sortDirection === 'asc' ? comparison : -comparison;
		});

		setFilteredStudents(filtered);
	};

	const handleSortClick = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortField(field);
			setSortDirection('asc');
		}
		setSortDropdownOpen(false);
	};

	const getSortLabel = () => {
		const fieldLabel = {
			lastName: 'Nazwisko',
			firstName: 'Imię',
			courseStart: 'Data rozpoczęcia',
		}[sortField];
		const directionIcon = sortDirection === 'asc' ? '↑' : '↓';
		return `${fieldLabel} ${directionIcon}`;
	};

	const formatHours = (hours: number) => {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	};

	const formatPhone = (phone: string | null) => {
		if (!phone) return null;
		const cleaned = phone.replace(/\D/g, '');
		if (cleaned.length === 9) {
			return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
				6
			)}`;
		}
		return phone;
	};

	const activeFiltersCount =
		(showInactive ? 1 : 0) +
		(showOnlyCoursePaid ? 1 : 0) +
		(showOnlyCourseUnpaid ? 1 : 0) +
		(showOnlySupplementary ? 1 : 0) +
		(showOnlyCar ? 1 : 0) +
		(showOnlyInternalTheory ? 1 : 0) +
		(showOnlyInternalPractice ? 1 : 0);

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
					{/* Mobile Filters */}
					<div className="space-y-3 md:hidden pt-12">
						<div className="grid grid-cols-2 gap-3">
							<div className="relative">
								<Button
									variant="outline"
									className="w-full justify-between text-xs"
									onClick={() => {
										setSortDropdownOpen(!sortDropdownOpen);
										setFilterDropdownOpen(false);
									}}>
									<span className="truncate">{getSortLabel()}</span>
									<ChevronDown className="ml-1 h-3 w-3 flex-shrink-0" />
								</Button>
								{sortDropdownOpen && (
									<div className="absolute left-0 z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
										{[
											{ field: 'lastName' as SortField, label: 'Nazwisko' },
											{ field: 'firstName' as SortField, label: 'Imię' },
											{ field: 'courseStart' as SortField, label: 'Data' },
										].map(({ field, label }) => (
											<button
												key={field}
												className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-gray-100"
												onClick={() => handleSortClick(field)}>
												<span>
													{label}{' '}
													{sortField === field &&
														(sortDirection === 'asc' ? '↑' : '↓')}
												</span>
												{sortField === field && <Check className="h-3 w-3" />}
											</button>
										))}
									</div>
								)}
							</div>

							<div className="relative">
								<Button
									variant="outline"
									className="w-full justify-between text-xs"
									onClick={() => {
										setFilterDropdownOpen(!filterDropdownOpen);
										setSortDropdownOpen(false);
									}}>
									<span className="truncate">Filtry</span>
									{activeFiltersCount > 0 && (
										<span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
											{activeFiltersCount}
										</span>
									)}
									<ChevronDown className="ml-1 h-3 w-3 flex-shrink-0" />
								</Button>
								{filterDropdownOpen && (
									<div className="absolute right-0 z-10 mt-1 w-full rounded-md border bg-white p-2 shadow-lg">
										<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
											<input
												type="checkbox"
												checked={showInactive}
												onChange={(e) => setShowInactive(e.target.checked)}
												className="h-4 w-4"
											/>
											<span className="text-sm">Pokaż nieaktywnych</span>
										</label>

										<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
											<input
												type="checkbox"
												checked={showOnlyCoursePaid}
												onChange={(e) =>
													setShowOnlyCoursePaid(e.target.checked)
												}
												className="h-4 w-4"
											/>
											<span className="text-sm">Tylko opłacone</span>
										</label>

										<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
											<input
												type="checkbox"
												checked={showOnlyCourseUnpaid}
												onChange={(e) =>
													setShowOnlyCourseUnpaid(e.target.checked)
												}
												className="h-4 w-4"
											/>
											<span className="text-sm">Tylko nieopłacone</span>
										</label>

										<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
											<input
												type="checkbox"
												checked={showOnlySupplementary}
												onChange={(e) =>
													setShowOnlySupplementary(e.target.checked)
												}
												className="h-4 w-4"
											/>
											<span className="text-sm">Kurs uzupełniający</span>
										</label>

										<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
											<input
												type="checkbox"
												checked={showOnlyCar}
												onChange={(e) => setShowOnlyCar(e.target.checked)}
												className="h-4 w-4"
											/>
											<span className="text-sm">Auto na egzamin</span>
										</label>

										<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
											<input
												type="checkbox"
												checked={showOnlyInternalTheory}
												onChange={(e) =>
													setShowOnlyInternalTheory(e.target.checked)
												}
												className="h-4 w-4"
											/>
											<span className="text-sm">Teoria wewnętrzny</span>
										</label>

										<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
											<input
												type="checkbox"
												checked={showOnlyInternalPractice}
												onChange={(e) =>
													setShowOnlyInternalPractice(e.target.checked)
												}
												className="h-4 w-4"
											/>
											<span className="text-sm">Praktyka wewnętrzny</span>
										</label>
									</div>
								)}
							</div>
						</div>

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

					{/* Desktop Filters */}
					<div className="hidden gap-4 md:grid md:grid-cols-[1fr,200px,200px]">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
							<Input
								placeholder="Szukaj po imieniu, nazwisku, telefonie, PKK..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-10"
							/>
						</div>

						<div className="relative">
							<Button
								variant="outline"
								className="w-full justify-between"
								onClick={() => {
									setSortDropdownOpen(!sortDropdownOpen);
									setFilterDropdownOpen(false);
								}}>
								{getSortLabel()}
								<ChevronDown className="ml-2 h-4 w-4" />
							</Button>
							{sortDropdownOpen && (
								<div className="absolute right-0 z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
									{[
										{ field: 'lastName' as SortField, label: 'Nazwisko' },
										{ field: 'firstName' as SortField, label: 'Imię' },
										{
											field: 'courseStart' as SortField,
											label: 'Data rozpoczęcia',
										},
									].map(({ field, label }) => (
										<button
											key={field}
											className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-gray-100"
											onClick={() => handleSortClick(field)}>
											<span>
												{label}{' '}
												{sortField === field &&
													(sortDirection === 'asc' ? '↑' : '↓')}
											</span>
											{sortField === field && <Check className="h-4 w-4" />}
										</button>
									))}
								</div>
							)}
						</div>

						<div className="relative">
							<Button
								variant="outline"
								className="w-full justify-between"
								onClick={() => {
									setFilterDropdownOpen(!filterDropdownOpen);
									setSortDropdownOpen(false);
								}}>
								Filtry
								{activeFiltersCount > 0 && (
									<span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
										{activeFiltersCount}
									</span>
								)}
								<ChevronDown className="ml-2 h-4 w-4" />
							</Button>
							{filterDropdownOpen && (
								<div className="absolute right-0 z-10 mt-1 w-full rounded-md border bg-white p-2 shadow-lg">
									<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
										<input
											type="checkbox"
											checked={showInactive}
											onChange={(e) => setShowInactive(e.target.checked)}
											className="h-4 w-4"
										/>
										<span className="text-sm">Pokaż nieaktywnych</span>
									</label>

									<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
										<input
											type="checkbox"
											checked={showOnlyCoursePaid}
											onChange={(e) => setShowOnlyCoursePaid(e.target.checked)}
											className="h-4 w-4"
										/>
										<span className="text-sm">Tylko opłacone</span>
									</label>

									<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
										<input
											type="checkbox"
											checked={showOnlyCourseUnpaid}
											onChange={(e) =>
												setShowOnlyCourseUnpaid(e.target.checked)
											}
											className="h-4 w-4"
										/>
										<span className="text-sm">Tylko nieopłacone</span>
									</label>

									<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
										<input
											type="checkbox"
											checked={showOnlySupplementary}
											onChange={(e) =>
												setShowOnlySupplementary(e.target.checked)
											}
											className="h-4 w-4"
										/>
										<span className="text-sm">Kurs uzupełniający</span>
									</label>

									<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
										<input
											type="checkbox"
											checked={showOnlyCar}
											onChange={(e) => setShowOnlyCar(e.target.checked)}
											className="h-4 w-4"
										/>
										<span className="text-sm">Auto na egzamin</span>
									</label>

									<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
										<input
											type="checkbox"
											checked={showOnlyInternalTheory}
											onChange={(e) =>
												setShowOnlyInternalTheory(e.target.checked)
											}
											className="h-4 w-4"
										/>
										<span className="text-sm">Teoria wewnętrzny</span>
									</label>

									<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
										<input
											type="checkbox"
											checked={showOnlyInternalPractice}
											onChange={(e) =>
												setShowOnlyInternalPractice(e.target.checked)
											}
											className="h-4 w-4"
										/>
										<span className="text-sm">Praktyka wewnętrzny</span>
									</label>
								</div>
							)}
						</div>
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
									student.inactive ? 'opacity-60' : ''
								}`}
								onClick={() => navigate(`/instructor/students/${student.id}`)}>
								<CardContent className="p-4">
									<div className="flex items-start justify-between gap-3">
										<div className="flex-1 min-w-0">
											<div className="mb-2">
												<div className="flex items-start justify-between gap-2">
													{/* Nazwisko + badge'y inline */}
													<div className="flex flex-wrap items-center gap-1.5 min-w-0">
														<h3 className="text-base font-semibold sm:text-lg truncate">
															{student.firstName} {student.lastName}
														</h3>

														{student.coursePaid && (
															<Badge
																variant="default"
																className="px-1.5 py-0 text-[10px] sm:px-2 sm:py-0.5 sm:text-xs">
																Opłacony
															</Badge>
														)}

														{student.isSupplementaryCourse && (
															<Badge
																variant="secondary"
																className="px-1.5 py-0 text-[10px] sm:px-2 sm:py-0.5 sm:text-xs">
																Uzupełniający
															</Badge>
														)}
													</div>

													{/* Status po prawej */}
													<div className="flex flex-wrap gap-1 justify-end">
														{student.inactive && (
															<Badge
																variant="secondary"
																className="px-1.5 py-0 text-[10px] sm:px-2 sm:py-0.5 sm:text-xs">
																Nieaktywny
															</Badge>
														)}
													</div>
												</div>
											</div>

											<div className="space-y-1 text-sm text-gray-600">
												{/* {student.phone && (
													<a
														href={`tel:${student.phone}`}
														className="flex items-center gap-2 hover:text-primary transition-colors"
														onClick={(e) => e.stopPropagation()}>
														<Phone className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
														<span className="truncate">
															{formatPhone(student.phone)}
														</span>
													</a>
												)} */}

												{student.phone && (
													<div className="flex items-center gap-2">
														<a
															href={`tel:${student.phone}`}
															onClick={(e) => e.stopPropagation()}
															className="hover:text-primary transition-colors">
															<Phone className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
														</a>

														<span className="truncate">
															{formatPhone(student.phone)}
														</span>
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

										{/* Godziny */}
										<div className="flex-shrink-0 text-right">
											<div className="text-base font-semibold text-primary sm:text-lg">
												{formatHours(student.totalHoursDriven)}
											</div>
											<div className="text-xs text-gray-500 sm:text-sm">
												wyjeżdżone
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
