import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Users, Calendar, LogOut } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import InstructorStudentsPage from '@/pages/instructor/InstructorStudentsPage';
import InstructorCalendarPage from '@/pages/instructor/InstructorCalendarPage';
import StudentDetailPage from '@/pages/admin/StudentDetailPage';
import NotificationsPage from '@/pages/admin/NotificationsPage';

const navigation = [
	{ name: 'Kursanci', path: '/instructor/students', icon: Users },
	{ name: 'Kalendarz', path: '/instructor/calendar', icon: Calendar },
];

export default function InstructorLayout() {
	const location = useLocation();
	const { signOut } = useAuth();

	return (
		<div className="flex h-screen bg-gray-50">
			<aside className="flex w-64 flex-col border-r bg-white">
				<div className="flex h-16 items-center justify-between border-b px-6">
					<h1 className="text-xl font-bold">CRM Instruktor</h1>
					<NotificationBell />
				</div>
				<nav className="flex-1 space-y-1 p-4">
					{navigation.map((item) => {
						const Icon = item.icon;
						const isActive = location.pathname === item.path;
						return (
							<Link key={item.path} to={item.path}>
								<div
									className={cn(
										'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
										isActive
											? 'bg-primary text-primary-foreground'
											: 'text-gray-700 hover:bg-gray-100'
									)}>
									<Icon className="h-5 w-5" />
									{item.name}
								</div>
							</Link>
						);
					})}
				</nav>
				<div className="border-t p-4">
					<Button
						variant="outline"
						className="w-full justify-start"
						onClick={signOut}>
						<LogOut className="mr-2 h-4 w-4" />
						Wyloguj
					</Button>
				</div>
			</aside>

			<main className="flex-1 overflow-auto">
				<Routes>
					<Route path="students" element={<InstructorStudentsPage />} />
					<Route path="students/:id" element={<StudentDetailPage />} />
					<Route path="calendar" element={<InstructorCalendarPage />} />
					<Route path="notifications" element={<NotificationsPage />} />
					<Route path="*" element={<InstructorStudentsPage />} />
				</Routes>
			</main>
		</div>
	);
}

function cn(...classes: (string | boolean | undefined)[]) {
	return classes.filter(Boolean).join(' ');
}
