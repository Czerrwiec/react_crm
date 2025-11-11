import { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { carService } from '@/services/car.service';
import type { CarReservation } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface CarReservationDetailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	reservation: CarReservation | null;
	carNames: Map<string, string>;
	studentNames: Map<string, string>;
	onEdit: (reservation: CarReservation) => void;
	onSuccess: () => void;
}

export default function CarReservationDetailDialog({
	open,
	onOpenChange,
	reservation,
	carNames,
	studentNames,
	onEdit,
	onSuccess,
}: CarReservationDetailDialogProps) {
	const [deleting, setDeleting] = useState(false);

	if (!reservation) return null;

	const formatDuration = (startTime: string, endTime: string) => {
		const [startH, startM] = startTime.split(':').map(Number);
		const [endH, endM] = endTime.split(':').map(Number);
		const startMinutes = startH * 60 + startM;
		const endMinutes = endH * 60 + endM;
		const durationMinutes = endMinutes - startMinutes;
		const hours = Math.floor(durationMinutes / 60);
		const minutes = durationMinutes % 60;
		return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	};

	const handleDelete = async () => {
		const confirmed = window.confirm(
			`Czy na pewno chcesz usunąć tę rezerwację?\n\nData: ${format(
				new Date(reservation.date),
				'd MMMM yyyy',
				{ locale: pl }
			)}\nGodzina: ${reservation.startTime} - ${reservation.endTime}`
		);

		if (!confirmed) return;

		setDeleting(true);
		try {
			await carService.deleteReservation(reservation.id);
			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error('Error deleting reservation:', error);
			alert('Błąd usuwania rezerwacji');
		} finally {
			setDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Rezerwacja {reservation.startTime} - {reservation.endTime}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<div className="text-sm text-gray-500">Data</div>
						<div className="font-medium">
							{format(new Date(reservation.date), 'd MMMM yyyy', {
								locale: pl,
							})}
						</div>
					</div>

					<div>
						<div className="text-sm text-gray-500">Samochód</div>
						<div className="font-medium">
							{carNames.get(reservation.carId) || 'Nieznany'}
						</div>
					</div>

					<div>
						<div className="text-sm text-gray-500">Czas trwania</div>
						<div className="font-medium">
							{formatDuration(reservation.startTime, reservation.endTime)}
						</div>
					</div>

					{reservation.studentIds.length > 0 && (
						<div>
							<div className="text-sm text-gray-500 mb-1">Kursanci</div>
							<div className="space-y-1">
								{reservation.studentIds.map((id) => (
									<div key={id} className="text-sm font-medium">
										{studentNames.get(id) || 'Nieznany'}
									</div>
								))}
							</div>
						</div>
					)}

					{reservation.notes && (
						<div>
							<div className="text-sm text-gray-500">Notatki</div>
							<div className="text-sm italic">{reservation.notes}</div>
						</div>
					)}

					<div className="flex gap-2 pt-4">
						<Button
							variant="outline"
							className="flex-1"
							onClick={() => {
								onEdit(reservation);
								onOpenChange(false);
							}}>
							<Pencil className="mr-2 h-4 w-4" />
							Edytuj
						</Button>
						<Button
							variant="destructive"
							className="flex-1"
							onClick={handleDelete}
							disabled={deleting}>
							<Trash2 className="mr-2 h-4 w-4" />
							{deleting ? 'Usuwanie...' : 'Usuń'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
