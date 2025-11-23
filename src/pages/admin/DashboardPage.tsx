import { useEffect, useState } from 'react';
import { studentService } from '@/services/student.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function DashboardPage() {
	const [activeStudentsCount, setActiveStudentsCount] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			const students = await studentService.getStudents();
			const activeCount = students.filter((s) => !s.inactive).length;
			setActiveStudentsCount(activeCount);
		} catch (error) {
			console.error('Error loading data:', error);
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
		<div className="p-4 sm:p-8 pt-16">
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Aktywni kursanci
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{activeStudentsCount}</div>
						<p className="text-xs text-muted-foreground mt-2">
							Więcej statystyk wkrótce
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
