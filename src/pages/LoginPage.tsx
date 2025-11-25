import { useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const { signIn } = useAuth();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			await signIn(email, password);
		} catch (err: any) {
			setError(err.message || 'Błąd logowania');
		} finally {
			setLoading(false);
		}
	};

	const navigate = useNavigate();

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<div className="w-full max-w-md space-y-8 -mt-20">
				<form onSubmit={handleSubmit} className="mt-8 space-y-6">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}

					<div className="space-y-4">
						<Input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							disabled={loading}
						/>
						<Input
							type="password"
							placeholder="Hasło"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							disabled={loading}
						/>
					</div>

					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? 'Logowanie...' : 'Zaloguj się'}
					</Button>

					<div className="text-center">
						<button
							type="button"
							onClick={() => navigate('/reset-password')}
							className="text-sm text-primary hover:underline">
							Zapomniałeś hasła?
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
