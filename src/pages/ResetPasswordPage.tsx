import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState('');
	const navigate = useNavigate();

	const handleSubmit = async (e: any) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/update-password`,
			});

			if (error) throw error;
			setSent(true);
		} catch (err: any) {
			setError(err.message || 'Błąd wysyłania emaila');
		} finally {
			setLoading(false);
		}
	};

	if (sent) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
				<div className="w-full max-w-md space-y-8 text-center">
					<div className="rounded-lg bg-green-50 p-6">
						<h2 className="text-xl font-bold text-green-800">Email wysłany!</h2>
						<p className="mt-2 text-sm text-green-700">
							Sprawdź swoją skrzynkę email i kliknij w link resetujący hasło.
						</p>
					</div>
					<Button
						data-testid="back-login-button-sended"
						onClick={() => navigate('/login')}
						variant="outline"
						className="w-full">
						Powrót do logowania
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h2 className="mt-6 text-3xl font-bold">Reset hasła</h2>
					<p className="mt-2 text-sm text-gray-600">
						Podaj swój email, a wyślemy Ci link do zresetowania hasła
					</p>
				</div>

				<form onSubmit={handleSubmit} className="mt-8 space-y-6">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}

					<div>
						<Label htmlFor="email">Email</Label>
						<Input
							data-testid="recovery-email"
							id="email"
							type="email"
							placeholder="twoj@email.pl"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							disabled={loading}
						/>
					</div>

					<Button
						data-testid="send-link-button"
						type="submit"
						className="w-full"
						disabled={loading}>
						{loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
					</Button>

					<Button
						data-testid="back-login-button"
						type="button"
						variant="ghost"
						className="w-full"
						onClick={() => navigate('/login')}>
						Powrót do logowania
					</Button>
				</form>
			</div>
		</div>
	);
}
