// src/pages/UpdatePasswordPage.tsx (NOWY PLIK)
import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

export default function UpdatePasswordPage() {
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const navigate = useNavigate();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError('');

		if (password !== confirmPassword) {
			setError('Hasła nie są identyczne');
			return;
		}

		if (password.length < 6) {
			setError('Hasło musi mieć minimum 6 znaków');
			return;
		}

		setLoading(true);

		try {
			const { error } = await supabase.auth.updateUser({
				password: password,
			});

			if (error) throw error;

			alert('Hasło zostało zmienione!');
			navigate('/login');
		} catch (err: any) {
			setError(err.message || 'Błąd zmiany hasła');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h2 className="mt-6 text-3xl font-bold">Nowe hasło</h2>
					<p className="mt-2 text-sm text-gray-600">
						Wprowadź nowe hasło do swojego konta
					</p>
				</div>

				<form onSubmit={handleSubmit} className="mt-8 space-y-6">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}

					<div>
						<Label htmlFor="password">Nowe hasło</Label>
						<Input
							id="password"
							type="password"
							placeholder="Minimum 6 znaków"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={6}
							disabled={loading}
						/>
					</div>

					<div>
						<Label htmlFor="confirmPassword">Potwierdź hasło</Label>
						<Input
							id="confirmPassword"
							type="password"
							placeholder="Powtórz nowe hasło"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							minLength={6}
							disabled={loading}
						/>
					</div>

					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? 'Zapisywanie...' : 'Zmień hasło'}
					</Button>
				</form>
			</div>
		</div>
	);
}