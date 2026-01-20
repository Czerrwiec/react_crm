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
import type { CarReservation, Car } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';

interface CarReservationDetailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	reservation: CarReservation | null;
	carNames: Map<string, string>;
	cars: Car[]; 
	studentNames: Map<string, string>;
	onEdit: (reservation: CarReservation) => void;
	onSuccess: () => void;
}

export default function CarReservationDetailDialog({
	open,
	onOpenChange,
	reservation,
	carNames,
	cars,
	studentNames,
	onEdit,
	onSuccess,
}: CarReservationDetailDialogProps) {
	const { role } = useAuth();
	const [deleting, setDeleting] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	if (!reservation) return null;

	// const formatDuration = (startTime: string, endTime: string) => {
	// 	const [startH, startM] = startTime.split(':').map(Number);
	// 	const [endH, endM] = endTime.split(':').map(Number);
	// 	const startMinutes = startH * 60 + startM;
	// 	const endMinutes = endH * 60 + endM;
	// 	const durationMinutes = endMinutes - startMinutes;
	// 	const hours = Math.floor(durationMinutes / 60);
	// 	const minutes = durationMinutes % 60;
	// 	return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	// };

	const handleDeleteConfirm = async () => {
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
							{(() => {
								const car = cars.find((c) => c.id === reservation.carId);
								if (!car) return 'Nieznany';

								const reg = car.registrationNumber || '';
								const name = car.name || '';

								if (reg && name) return `${reg} - ${name}`;
								return reg || name || 'Nieznany';
							})()}
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

					{role === 'admin' && (
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
								onClick={() => setDeleteDialogOpen(true)}
								disabled={deleting}>
								<Trash2 className="mr-2 h-4 w-4" />
								Usuń
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
			<ConfirmDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				title="Usunąć rezerwację?"
				description={
					<>
						<strong>Data:</strong>{' '}
						{format(new Date(reservation.date), 'd MMMM yyyy', { locale: pl })}
						<br />
						<strong>Godzina:</strong> {reservation.startTime} -{' '}
						{reservation.endTime}
						<br />
						<strong>Samochód:</strong>{' '}
						{carNames.get(reservation.carId) || 'Nieznany'}
					</>
				}
				confirmText="Usuń rezerwację"
				onConfirm={handleDeleteConfirm}
				loading={deleting}
			/>
		</Dialog>
	);
}
