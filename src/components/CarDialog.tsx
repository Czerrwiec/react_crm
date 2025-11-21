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
	registrationNumber: '',
	inspectionDate: '',
	insuranceDate: '',
	active: true,
	color: '#3b82f6',
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
					registrationNumber: car.registrationNumber || '',
					insuranceDate: car.insuranceDate || '',
					active: car.active,
					color: car.color,
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
				registrationNumber: formData.registrationNumber || null,
				inspectionDate: formData.inspectionDate || null,
				insuranceDate: formData.insuranceDate || null,
				active: formData.active,
				color: formData.color,
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
						<Label htmlFor="registrationNumber">Numer rejestracyjny</Label>
						<Input
							id="registrationNumber"
							value={formData.registrationNumber}
							onChange={(e) =>
								setFormData({ ...formData, registrationNumber: e.target.value })
							}
							placeholder="np. ABC 1234"
						/>
					</div>

					<div>
						<Label htmlFor="color">Kolor w kalendarzu</Label>
						<div className="flex items-center gap-3">
							<Input
								id="color"
								type="color"
								value={formData.color}
								onChange={(e) =>
									setFormData({ ...formData, color: e.target.value })
								}
								className="h-10 w-20"
							/>
							<span className="text-sm text-gray-600">{formData.color}</span>
						</div>
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
