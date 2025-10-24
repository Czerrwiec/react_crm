import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import LoginPage from '@/pages/LoginPage';
import AdminLayout from '@/components/layout/AdminLayout';
import InstructorLayout from '@/components/layout/InstructorLayout';

function ProtectedRoute({
	children,
	allowedRoles,
}: {
	children: React.ReactNode;
	allowedRoles: string[];
}) {
	const { user, role, loading } = useAuth();

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!user || !role || !allowedRoles.includes(role)) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
}

function AppRoutes() {
	const { user, role, loading } = useAuth();

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!user) {
		return (
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="*" element={<Navigate to="/login" replace />} />
			</Routes>
		);
	}

	return (
		<Routes>
			{role === 'admin' && (
				<Route
					path="/admin/*"
					element={
						<ProtectedRoute allowedRoles={['admin']}>
							<AdminLayout />
						</ProtectedRoute>
					}
				/>
			)}
			{role === 'instructor' && (
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
					<Navigate to={role === 'admin' ? '/admin' : '/instructor'} replace />
				}
			/>
		</Routes>
	);
}

export default function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<AppRoutes />
			</AuthProvider>
		</BrowserRouter>
	);
}
