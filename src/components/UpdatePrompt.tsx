import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function UpdatePrompt() {
	const [showPrompt, setShowPrompt] = useState(false);
	const [updateAvailable, setUpdateAvailable] = useState(false);

	useEffect(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				setUpdateAvailable(true);
				setShowPrompt(true);
			});
		}
	}, []);

	// Pytaj co 30 min jeśli user odmówił
	useEffect(() => {
		if (!updateAvailable) return;

		const interval = setInterval(() => {
			setShowPrompt(true);
		}, 3 * 60 * 1000); // 3 minuty

		return () => clearInterval(interval);
	}, [updateAvailable]);

	const handleUpdate = () => {
		window.location.reload();
	};

	const handleLater = () => {
		setShowPrompt(false);
		// Zapyta ponownie za 30 min
	};

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
							Później
						</Button>
						<Button onClick={handleUpdate}>Zaktualizuj teraz</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
