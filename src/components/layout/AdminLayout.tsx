import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
	LayoutDashboard,
	Users,
	UserCog,
	Calendar,
	LogOut,
} from 'lucide-react';
import StudentsPage from '@/pages/admin/StudentsPage';
import StudentDetailPage from '@/pages/admin/StudentDetailPage';

const navigation = [
	{ name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
	{ name: 'Kursanci', path: '/admin/students', icon: Users },
	{ name: 'Instruktorzy', path: '/admin/instructors', icon: UserCog },
	{ name: 'Kalendarz', path: '/admin/calendar', icon: Calendar },
];

export default function AdminLayout() {
	const location = useLocation();
	const { signOut } = useAuth();

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Sidebar */}
			<aside className="w-64 border-r bg-white">
				<div className="flex h-16 items-center justify-center border-b px-6">
					<h1 className="text-xl font-bold">CRM Admin</h1>
				</div>
				<nav className="space-y-1 p-4">
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
				<div className="absolute bottom-4 left-4 right-4">
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
					<Route
						path="instructors"
						element={<div className="p-8">Instruktorzy - wkrótce</div>}
					/>
					<Route
						path="calendar"
						element={<div className="p-8">Kalendarz - wkrótce</div>}
					/>
					<Route path="students/:id" element={<StudentDetailPage />} />
				</Routes>
			</main>
		</div>
	);
}

function cn(...classes: (string | boolean | undefined)[]) {
	return classes.filter(Boolean).join(' ');
}
