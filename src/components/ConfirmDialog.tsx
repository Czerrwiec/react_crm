import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string | React.ReactNode;
	confirmText?: string;
	cancelText?: string;
	variant?: 'default' | 'destructive';
	onConfirm: () => void | Promise<void>;
	loading?: boolean;
}

export default function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmText = 'Potwierdź',
	cancelText = 'Anuluj',
	variant = 'destructive',
	onConfirm,
	loading = false,
}: ConfirmDialogProps) {
	const handleConfirm = async () => {
		await onConfirm();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<div className="flex items-start gap-3">
						{variant === 'destructive' && (
							<div className="rounded-full bg-red-100 p-2">
								<AlertTriangle className="h-5 w-5 text-red-600" />
							</div>
						)}
						<div className="flex-1">
							<DialogTitle className="text-lg">{title}</DialogTitle>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4">
					<div className="text-sm text-gray-600">{description}</div>

					<div className="flex gap-2 justify-end pt-2">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={loading}>
							{cancelText}
						</Button>
						<Button
							variant={variant}
							onClick={handleConfirm}
							disabled={loading}>
							{loading ? 'Usuwanie...' : confirmText}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
