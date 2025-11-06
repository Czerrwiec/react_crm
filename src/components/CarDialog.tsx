import { useState, useEffect, FormEvent } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { carService } from '@/services/car.service';
import type { Car } from '@/types';

interface CarDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	car?: Car | null;
	onSuccess: () => void;
}

const initialFormData = {
	name: '',
	year: new Date().getFullYear(),
	inspectionDate: '',
	insuranceDate: '',
	active: true,
};

export default function CarDialog({
	open,
	onOpenChange,
	car,
	onSuccess,
}: CarDialogProps) {
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState(initialFormData);

	useEffect(() => {
		if (open) {
			if (car) {
				setFormData({
					name: car.name,
					year: car.year,
					inspectionDate: car.inspectionDate || '',
					insuranceDate: car.insuranceDate || '',
					active: car.active,
				});
			} else {
				setFormData(initialFormData);
			}
		}
	}, [open, car]);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const carData = {
				name: formData.name,
				year: formData.year,
				inspectionDate: formData.inspectionDate || null,
				insuranceDate: formData.insuranceDate || null,
				active: formData.active,
			};

			if (car) {
				await carService.updateCar(car.id, carData);
			} else {
				await carService.createCar(carData);
			}

			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error('Error saving car:', error);
			alert('Błąd zapisywania samochodu');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{car ? 'Edytuj samochód' : 'Dodaj samochód'}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label htmlFor="name">Nazwa *</Label>
						<Input
							id="name"
							required
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="np. Toyota Corolla XYZ 1234"
						/>
					</div>

					<div>
						<Label htmlFor="year">Rocznik *</Label>
						<Input
							id="year"
							type="number"
							required
							min="1900"
							max={new Date().getFullYear() + 1}
							value={formData.year}
							onChange={(e) =>
								setFormData({ ...formData, year: parseInt(e.target.value) })
							}
						/>
					</div>

					<div>
						<Label htmlFor="inspectionDate">Data przeglądu</Label>
						<Input
							id="inspectionDate"
							type="date"
							value={formData.inspectionDate}
							onChange={(e) =>
								setFormData({ ...formData, inspectionDate: e.target.value })
							}
						/>
					</div>

					<div>
						<Label htmlFor="insuranceDate">Data ubezpieczenia</Label>
						<Input
							id="insuranceDate"
							type="date"
							value={formData.insuranceDate}
							onChange={(e) =>
								setFormData({ ...formData, insuranceDate: e.target.value })
							}
						/>
					</div>

					<label className="flex items-center gap-2">
						<Checkbox
							checked={formData.active}
							onChange={(e) =>
								setFormData({ ...formData, active: e.target.checked })
							}
						/>
						<span className="text-sm">Samochód aktywny</span>
					</label>

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}>
							Anuluj
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? 'Zapisywanie...' : car ? 'Zapisz zmiany' : 'Dodaj'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
