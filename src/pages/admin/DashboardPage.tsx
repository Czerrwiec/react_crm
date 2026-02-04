import { useEffect, useState } from 'react';
import { studentService } from '@/services/student.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { paymentService } from '@/services/payment.service';
import { useNavigate } from 'react-router-dom';

interface DebtorStudent {
	id: string;
	firstName: string;
	lastName: string;
	debt: number;
	courseStartDate: string;
	daysOnCourse: number;
}

export default function DashboardPage() {
	const navigate = useNavigate();
	const [activeStudentsCount, setActiveStudentsCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [topDebtors, setTopDebtors] = useState<DebtorStudent[]>([]);
	
	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			const students = await studentService.getStudents();
			const activeCount = students.filter((s) => !s.inactive).length;
			setActiveStudentsCount(activeCount);

			// Pobierz wszystkie płatności
			const allPayments = await Promise.all(
				students.map((s) => paymentService.getPaymentsByStudent(s.id)),
			);

			// Oblicz zadłużenia
			const debtors: DebtorStudent[] = students
				.filter((s) => !s.inactive && s.courseStartDate) // Tylko aktywni z datą startu
				.map((s, idx) => {
					const payments = allPayments[idx];
					const totalPaid = payments
						.filter((p) => p.type === 'course')
						.reduce((sum, p) => sum + p.amount, 0);
					const debt = s.coursePrice - totalPaid;

					// Oblicz dni na kursie
					const startDate = new Date(s.courseStartDate!);
					const today = new Date();
					const daysOnCourse = Math.floor(
						(today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
					);

					return {
						id: s.id,
						firstName: s.firstName,
						lastName: s.lastName,
						debt,
						courseStartDate: s.courseStartDate!,
						daysOnCourse,
					};
				})
				.filter((s) => s.debt > 0) // Tylko z zadłużeniem
				.sort((a, b) => {
					// Sortuj: najpierw największe zadłużenie, potem najwięcej dni
					if (b.debt !== a.debt) {
						return b.debt - a.debt;
					}
					return b.daysOnCourse - a.daysOnCourse;
				})
				.slice(0, 5); // Top 5

			setTopDebtors(debtors);
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
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Najdłużej z zadłużeniem
						</CardTitle>
					</CardHeader>
					<CardContent>
						{topDebtors.length === 0 ? (
							<p className="text-sm text-gray-500">
								Brak kursantów z zadłużeniem
							</p>
						) : (
							<div className="space-y-2">
								{topDebtors.map((debtor, idx) => (
									<div
										key={debtor.id}
										className="flex items-center justify-between text-sm border-b pb-2 last:border-0 cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2 transition-colors"
										onClick={() => navigate(`/admin/students/${debtor.id}`)}>
										<div className="flex-1">
											<div className="font-medium">
												{idx + 1}. {debtor.firstName} {debtor.lastName}
											</div>
											<div className="text-xs text-gray-500">
												Na kursie: {debtor.daysOnCourse} dni
											</div>
										</div>
										{/* <div className="text-right">
											<div className="font-semibold text-600">
												{debtor.debt.toFixed(0)} zł
											</div>
										</div> */}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
