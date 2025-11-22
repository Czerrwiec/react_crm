import { useEffect, useState, useRef } from 'react';
import { studentService } from '@/services/student.service';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus, Phone, Mail, ChevronDown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { StudentWithInstructors } from '@/types';

type SortField = 'lastName' | 'firstName' | 'courseStart';
type SortDirection = 'asc' | 'desc';

export default function StudentsPage() {
	const [students, setStudents] = useState<StudentWithInstructors[]>([]);
	const [filteredStudents, setFilteredStudents] = useState<
		StudentWithInstructors[]
	>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();
	const initialized = useRef(false);

	const [sortField, setSortField] = useState<SortField>('lastName');
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

	const [showInactive, setShowInactive] = useState(false);
	const [showOnlyCoursePaid, setShowOnlyCoursePaid] = useState(false);
	const [showOnlyCourseUnpaid, setShowOnlyCourseUnpaid] = useState(false);
	const [showOnlySupplementary, setShowOnlySupplementary] = useState(false);
	const [showOnlyCar, setShowOnlyCar] = useState(false);
	const [showOnlyInternalTheory, setShowOnlyInternalTheory] = useState(false);
	const [showOnlyInternalPractice, setShowOnlyInternalPractice] =
		useState(false);
	const [showOnlyProfileUpdated, setShowOnlyProfileUpdated] = useState(false);

	const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
	const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
	const [weather, setWeather] = useState<{ city: string; temp: number } | null>(
		null
	);

	useEffect(() => {
		if (initialized.current) return;
		initialized.current = true;
		loadStudents();
		loadWeather();
	}, []);

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
		showOnlyProfileUpdated,
	]);

	const loadStudents = async () => {
		try {
			const data = await studentService.getStudents();
			setStudents(data);
		} catch (error) {
			console.error('Error loading students:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadWeather = async () => {
		try {
			// Sprawdź czy geolokalizacja jest dostępna
			if (!navigator.geolocation) {
				setWeather({ city: 'Wągrowiec', temp: 23 });
				return;
			}

			const position = await new Promise<GeolocationPosition>(
				(resolve, reject) => {
					navigator.geolocation.getCurrentPosition(resolve, reject, {
						timeout: 5000,
						enableHighAccuracy: false,
					});
				}
			);

			const { latitude, longitude } = position.coords;

			const weatherResponse = await fetch(
				`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
			);
			const weatherData = await weatherResponse.json();

			const geocodeResponse = await fetch(
				`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
				{
					headers: {
						'User-Agent': 'CRM-App/1.0',
					},
				}
			);
			const geocodeData = await geocodeResponse.json();

			setWeather({
				city:
					geocodeData.address?.city ||
					geocodeData.address?.town ||
					geocodeData.address?.village ||
					'Nieznana lokalizacja',
				temp: Math.round(weatherData.current_weather.temperature),
			});
		} catch (error) {
			console.error('Error loading weather:', error);
			setWeather({ city: 'Wągrowiec', temp: -13 });
		}
	};

	const applyFiltersAndSort = () => {
		let filtered = students;

		if (!showInactive) filtered = filtered.filter((s) => s.active);
		if (showOnlyCoursePaid) filtered = filtered.filter((s) => s.coursePaid);
		if (showOnlyCourseUnpaid) filtered = filtered.filter((s) => !s.coursePaid);
		if (showOnlySupplementary)
			filtered = filtered.filter((s) => s.isSupplementaryCourse);
		if (showOnlyCar) filtered = filtered.filter((s) => s.car);
		if (showOnlyInternalTheory)
			filtered = filtered.filter((s) => s.internalTheoryPassed);
		if (showOnlyInternalPractice)
			filtered = filtered.filter((s) => s.internalPracticePassed);
		if (showOnlyProfileUpdated)
			filtered = filtered.filter((s) => s.profileUpdated);

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

	const activeFiltersCount =
		(showInactive ? 1 : 0) +
		(showOnlyCoursePaid ? 1 : 0) +
		(showOnlyCourseUnpaid ? 1 : 0) +
		(showOnlySupplementary ? 1 : 0) +
		(showOnlyCar ? 1 : 0) +
		(showOnlyInternalTheory ? 1 : 0) +
		(showOnlyInternalPractice ? 1 : 0) +
		(showOnlyProfileUpdated ? 1 : 0);

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	const today = new Date();
	const dateStr = format(today, 'EEEE, d MMMM', { locale: pl });

	return (
		<div className="flex h-screen flex-col">
			{/* Fixed Header */}
			<div className="flex-shrink-0 border-b bg-white">
				<div className="p-4 sm:p-6">
					{/* Mobile Header */}
					<div className="mb-4 flex items-center justify-end md:hidden">
						<Button size="icon" onClick={() => navigate('/admin/students/add')}>
							<Plus className="h-5 w-5" />
						</Button>
					</div>
					{/* Data i pogoda */}
					<div className="mb-4 flex items-center justify-between text-sm">
						<span className="capitalize text-gray-600">{dateStr}</span>
						<span className="text-gray-400">
							{weather ? `${weather.city} ${weather.temp}℃` : 'Ładowanie...'}
						</span>
					</div>

					{/* Desktop Header */}
					<div className="mb-4 hidden items-center justify-end md:flex">
						<Button onClick={() => navigate('/admin/students/add')}>
							<Plus className="mr-2 h-4 w-4" />
							Dodaj kursanta
						</Button>
					</div>

					{/* Mobile Filters */}
					<div className="space-y-3 md:hidden">
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

										<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
											<input
												type="checkbox"
												checked={showOnlyProfileUpdated}
												onChange={(e) =>
													setShowOnlyProfileUpdated(e.target.checked)
												}
												className="h-4 w-4"
											/>
											<span className="text-sm">Zaktualizowany</span>
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

									<label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-100">
										<input
											type="checkbox"
											checked={showOnlyProfileUpdated}
											onChange={(e) =>
												setShowOnlyProfileUpdated(e.target.checked)
											}
											className="h-4 w-4"
										/>
										<span className="text-sm">Zaktualizowany</span>
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
									!student.active ? 'opacity-60' : ''
								}`}
								onClick={() => navigate(`/admin/students/${student.id}`)}>
								<CardContent className="p-4">
									<div className="flex items-start justify-between gap-3">
										<div className="flex-1 min-w-0">
											<div className="mb-2 flex flex-wrap items-center gap-2">
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
												{student.instructors &&
													student.instructors.length > 0 && (
														<div className="text-xs text-gray-500 sm:text-sm">
															Instruktor
															{student.instructors.length > 1 ? 'zy' : ''}:{' '}
															{student.instructors
																.map((i: any) => `${i.firstName} ${i.lastName}`)
																.join(', ')}
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
								Brak kursantów
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
