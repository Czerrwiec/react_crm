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

	useEffect(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				setShowPrompt(true);
			});
		}
	}, []);

	const handleUpdate = () => {
		window.location.reload();
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
						Dostępna jest nowa wersja aplikacji z poprawkami i nowymi funkcjami.
					</p>

					<div className="flex gap-2 justify-end pt-2">
						<Button variant="outline" onClick={() => setShowPrompt(false)}>
							Później
						</Button>
						<Button onClick={handleUpdate}>Zaktualizuj teraz</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
