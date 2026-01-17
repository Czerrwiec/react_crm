import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle } from 'lucide-react';

const UPDATE_PENDING_KEY = 'pwa_update_pending';

export default function UpdatePrompt() {
	const [showPrompt, setShowPrompt] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [updateAvailable, setUpdateAvailable] = useState(false);

	useEffect(() => {
		// Sprawdź czy był wymuszony reload po update
		const updatePending = localStorage.getItem(UPDATE_PENDING_KEY);
		if (updatePending === 'true') {
			localStorage.removeItem(UPDATE_PENDING_KEY);
			setShowSuccess(true);
			return;
		}

		if ('serviceWorker' in navigator) {
			// Sprawdź update przy starcie
			navigator.serviceWorker.getRegistration().then((reg) => {
				reg?.update();
			});

			// Nasłuchuj na nowy SW
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				setUpdateAvailable(true);
				setShowPrompt(true);
			});
		}
	}, []);

	// Pytaj co 3 min jeśli user odmówił
	useEffect(() => {
		if (!updateAvailable) return;

		const interval = setInterval(() => {
			setShowPrompt(true);
		}, 3 * 60 * 1000);

		return () => clearInterval(interval);
	}, [updateAvailable]);

	const handleUpdate = () => {
		// Zapisz że wymuszamy update
		localStorage.setItem(UPDATE_PENDING_KEY, 'true');
		window.location.reload();
	};

	const handleLater = () => {
		setShowPrompt(false);
	};

	if (showSuccess) {
		return (
			<Dialog open={showSuccess} onOpenChange={setShowSuccess}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<div className="flex items-start gap-3">
							<div className="rounded-full bg-green-100 p-2">
								<CheckCircle className="h-5 w-5 text-green-600" />
							</div>
							<div className="flex-1">
								<DialogTitle className="text-lg">
									Aplikacja zaktualizowana
								</DialogTitle>
							</div>
						</div>
					</DialogHeader>

					<div className="space-y-4">
						<p className="text-sm text-gray-600">
							Aplikacja została zaktualizowana do najnowszej wersji.
						</p>

						<div className="flex justify-end pt-2">
							<Button onClick={() => setShowSuccess(false)}>OK</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={showPrompt} onOpenChange={setShowPrompt}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<div className="flex items-start gap-3">
						<div className="rounded-full bg-blue-100 p-2">
							<Download className="h-5 w-5 text-blue-600" />
						</div>
						<div className="flex-1">
							<DialogTitle className="text-lg">
								Nowa wersja dostępna
							</DialogTitle>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4">
					<p className="text-sm text-gray-600">
						Dostępna jest nowa wersja aplikacji z poprawkami.
					</p>

					<div className="flex gap-2 justify-end pt-2">
						<Button variant="outline" onClick={handleLater}>
							Później (za 3 min)
						</Button>
						<Button onClick={handleUpdate}>Zaktualizuj teraz</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
