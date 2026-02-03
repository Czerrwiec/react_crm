import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface SuccessDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	message: string;
}

export default function SuccessDialog({
	open,
	onOpenChange,
	title,
	message,
}: SuccessDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<div className="flex items-start gap-3">
						<div className="rounded-full bg-green-100 p-2">
							<CheckCircle className="h-5 w-5 text-green-600" />
						</div>
						<div className="flex-1">
							<DialogTitle className="text-lg">{title}</DialogTitle>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4">
					<p className="text-sm text-gray-600">{message}</p>

					<div className="flex justify-end">
						<Button onClick={() => onOpenChange(false)}>OK</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
