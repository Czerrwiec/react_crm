import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { NotificationsProvider } from '@/hooks/notificationContext';
import LoginPage from '@/pages/LoginPage';
import AdminLayout from '@/components/layout/AdminLayout';
import InstructorLayout from '@/components/layout/InstructorLayout';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import UpdatePasswordPage from '@/pages/UpdatePasswordPage'

function ProtectedRoute({
	children,
	allowedRoles,
}: {
	children: React.ReactNode;
	allowedRoles: string[];
}) {
	const auth = useAuth();

	if (auth.loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!auth.user || !auth.role || !allowedRoles.includes(auth.role)) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
}

function AppRoutes() {
	const auth = useAuth();

	if (auth.loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!auth.user) {
		return (
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="*" element={<Navigate to="/login" replace />} />
				<Route path="/reset-password" element={<ResetPasswordPage />} />
				<Route path="/update-password" element={<UpdatePasswordPage />} />
			</Routes>
		);
	}

	return (
		<Routes>
			{auth.role === 'admin' && (
				<Route
					path="/admin/*"
					element={
						<ProtectedRoute allowedRoles={['admin']}>
							<AdminLayout />
						</ProtectedRoute>
					}
				/>
			)}
			{auth.role === 'instructor' && (
				<Route
					path="/instructor/*"
					element={
						<ProtectedRoute allowedRoles={['instructor']}>
							<InstructorLayout />
						</ProtectedRoute>
					}
				/>
			)}
			<Route
				path="*"
				element={
					<Navigate to={auth.role === 'admin' ? '/admin' : '/instructor'} replace />
				}
			/>
		</Routes>
	);
}

export default function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<NotificationsProvider>
					<AppRoutes />
				</NotificationsProvider>
			</AuthProvider>
		</BrowserRouter>
	);
}
