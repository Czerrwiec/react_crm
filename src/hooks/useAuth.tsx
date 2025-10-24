import {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from 'react';
import { authService } from '@/services/auth.service';
import type { UserRole } from '@/types';

interface AuthContextType {
	user: any | null;
	role: UserRole | null;
	loading: boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<any | null>(null);
	const [role, setRole] = useState<UserRole | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Check initial session
		authService.getCurrentUser().then(({ data: { user } }) => {
			setUser(user);
			if (user) {
				authService.getUserRole().then(setRole);
			}
			setLoading(false);
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = authService.onAuthStateChange((user) => {
			setUser(user);
			if (user) {
				authService.getUserRole().then(setRole);
			} else {
				setRole(null);
			}
			setLoading(false);
		});

		return () => subscription.unsubscribe();
	}, []);

	const signIn = async (email: string, password: string) => {
		await authService.signIn(email, password);
	};

	const signOut = async () => {
		await authService.signOut();
		setUser(null);
		setRole(null);
	};

	return (
		<AuthContext.Provider value={{ user, role, loading, signIn, signOut }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within AuthProvider');
	}
	return context;
}
