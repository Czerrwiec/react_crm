// src/pages/instructor/InstructorDashboardPage.tsx (NOWY PLIK)
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { lessonService } from '@/services/lesson.service';
import { studentService } from '@/services/student.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export default function InstructorDashboardPage() {
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [stats, setStats] = useState({
		scheduled: 0,
		completed: 0,
		studentCount: 0,
	});

	useEffect(() => {
		if (user) {
			loadData();
		}
	}, [user, currentMonth]);

	const loadData = async () => {
		if (!user) return;

		try {
			const [lessonsData, allStudents] = await Promise.all([
				lessonService.getLessonsByInstructor(user.id, currentMonth),
				studentService.getStudents(),
			]);

			const scheduled = lessonsData
				.filter((l) => l.status === 'scheduled')
				.reduce((sum, l) => sum + l.duration, 0);

			const completed = lessonsData
				.filter((l) => l.status === 'completed')
				.reduce((sum, l) => sum + l.duration, 0);

			const myStudents = allStudents.filter(
				(s) => s.instructorIds.includes(user.id) && !s.inactive
			);

			setStats({
				scheduled,
				completed,
				studentCount: myStudents.length,
			});
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			setLoading(false);
		}
	};

	const formatHours = (hours: number) => {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	};

	const handlePrevMonth = () => {
		const prev = new Date(currentMonth);
		prev.setMonth(prev.getMonth() - 1);
		setCurrentMonth(prev);
	};

	const handleNextMonth = () => {
		const next = new Date(currentMonth);
		next.setMonth(next.getMonth() + 1);
		setCurrentMonth(next);
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="p-4 sm:p-8 pt-16 sm:pt-8">
			{/* Month selector */}
			<div className="mb-6 flex items-center justify-between rounded-lg border bg-white p-4">
				<Button variant="outline" size="sm" onClick={handlePrevMonth}>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<span className="text-lg font-semibold capitalize">
					{format(currentMonth, 'LLLL yyyy', { locale: pl })}
				</span>
				<Button variant="outline" size="sm" onClick={handleNextMonth}>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>

			{/* Stats */}
			<div className="grid gap-4 sm:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Zaplanowane godziny
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-amber-600">
							{formatHours(stats.scheduled)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Wyjeżdżone godziny
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{formatHours(stats.completed)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Przypisani kursanci
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5 text-primary" />
							<div className="text-2xl font-bold">{stats.studentCount}</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
