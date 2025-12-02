import {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from 'react';
import { authService } from '@/services/auth.service';
import type { UserRole } from '@/types';
import { supabase } from '@/lib/supabase';

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
		let mounted = true;

		authService.getCurrentUser().then(async ({ data: { user } }) => {
			if (!mounted) return;
			setUser(user);

			if (user) {
				const { data: userRecord } = await supabase
					.from('users')
					.select('role, active') // DODAJ active
					.eq('id', user.id)
					.single();

				if (userRecord) {
					// Sprawdź czy aktywny
					if (!userRecord.active) {
						await authService.signOut();
						setUser(null);
						setRole(null);
						alert(
							'Twoje konto zostało dezaktywowane. Skontaktuj się z administratorem.'
						);
						return;
					}
					setRole(userRecord.role as UserRole);
				}
			}
			setLoading(false);
		});

		const {
			data: { subscription },
		} = authService.onAuthStateChange(async (user) => {
			if (!mounted) return;
			setUser(user);

			if (user) {
				const { data: userRecord } = await supabase
					.from('users')
					.select('role, active')
					.eq('id', user.id)
					.single();

				if (userRecord) {
					if (!userRecord.active) {
						await authService.signOut();
						setUser(null);
						setRole(null);
						alert('Twoje konto zostało dezaktywowane.');
						return;
					}
					setRole(userRecord.role as UserRole);
				}
			} else {
				setRole(null);
			}
		});

		return () => {
			mounted = false;
			subscription.unsubscribe();
		};
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within AuthProvider');
	}
	return context;
}
