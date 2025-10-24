import { useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h2 className="mt-6 text-3xl font-bold">CRM</h2>
				</div>

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
				</form>
			</div>
		</div>
	);
}
