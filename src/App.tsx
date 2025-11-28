import {
	BrowserRouter,
	Routes,
	Route,
	Navigate,
	useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { NotificationsProvider } from '@/hooks/notificationContext';
import LoginPage from '@/pages/LoginPage';
import AdminLayout from '@/components/layout/AdminLayout';
import InstructorLayout from '@/components/layout/InstructorLayout';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import UpdatePasswordPage from '@/pages/UpdatePasswordPage';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';

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
	const location = useLocation();

	// Sprawdź czy to link resetu hasła
	const isPasswordReset =
		location.pathname === '/update-password' ||
		window.location.hash.includes('type=recovery');

	if (auth.loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	// Pozwól na dostęp do update-password nawet dla zalogowanych
	if (isPasswordReset) {
		return (
			<Routes>
				<Route path="/update-password" element={<UpdatePasswordPage />} />
				<Route path="*" element={<Navigate to="/update-password" replace />} />
			</Routes>
		);
	}

	if (!auth.user) {
		return (
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/reset-password" element={<ResetPasswordPage />} />
				<Route path="/update-password" element={<UpdatePasswordPage />} />
				<Route path="*" element={<Navigate to="/login" replace />} />
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
			<Route path="/update-password" element={<UpdatePasswordPage />} />
			<Route
				path="*"
				element={
					<Navigate
						to={auth.role === 'admin' ? '/admin' : '/instructor'}
						replace
					/>
				}
			/>
		</Routes>
	);
}

export default function App() {

	usePWAUpdate();
	
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
