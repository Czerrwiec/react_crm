import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
	LayoutDashboard,
	Users,
	UserCog,
	Calendar,
	Settings,
	LogOut,
} from 'lucide-react';
import StudentsPage from '@/pages/admin/StudentsPage';
import AddStudentPage from '@/pages/admin/AddStudentPage';
import StudentDetailPage from '@/pages/admin/StudentDetailPage';
import EditStudentPage from '@/pages/admin/EditStudentPage';
import InstructorsPage from '@/pages/admin/InstructorsPage';
import AddInstructorPage from '@/pages/admin/AddInstructorPage';
import InstructorDetailPage from '@/pages/admin/InstructorDetailPage';
import CalendarPage from '@/pages/admin/CalendarPage';
import SettingsPage from '@/pages/admin/SettingsPage'
import NotificationBell from '@/components/NotificationBell';
import NotificationsPage from '@/pages/admin/NotificationsPage';


const navigation = [
	{ name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
	{ name: 'Kursanci', path: '/admin/students', icon: Users },
	{ name: 'Instruktorzy', path: '/admin/instructors', icon: UserCog },
	{ name: 'Kalendarz', path: '/admin/calendar', icon: Calendar },
	{ name: 'Ustawienia', path: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
	const location = useLocation();
	const { signOut } = useAuth();

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Sidebar */}
			<aside className="flex w-64 flex-col border-r bg-white">
				<div className="flex h-16 items-center justify-center border-b px-6">
					<h1 className="text-xl font-bold">CRM Admin</h1>
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

			{/* Main content */}
			<main className="flex-1 overflow-auto">
				<Routes>
					<Route index element={<Navigate to="/admin/students" replace />} />
					<Route path="students" element={<StudentsPage />} />
					<Route path="students/add" element={<AddStudentPage />} />
					<Route path="students/:id/edit" element={<EditStudentPage />} />
					<Route path="students/:id" element={<StudentDetailPage />} />
					<Route path="instructors" element={<InstructorsPage />} />
					<Route path="instructors/add" element={<AddInstructorPage />} />
					<Route path="instructors/:id" element={<InstructorDetailPage />} />
					<Route path="calendar" element={<CalendarPage />} />
					<Route path="settings" element={<SettingsPage />} />
					<Route path="notifications" element={<NotificationsPage />} />
				</Routes>
			</main>
		</div>
	);
}

function cn(...classes: (string | boolean | undefined)[]) {
	return classes.filter(Boolean).join(' ');
}
