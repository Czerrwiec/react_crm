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
import { X } from 'lucide-react';

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
	reminderEmails: [] as string[],
	newEmail: '',
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
					reminderEmails: car.reminderEmails || [], // DODAJ
					newEmail: '', // DODAJ
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
				reminderEmails: formData.reminderEmails, // DODAJ
				reminderDaysBefore: [7, 3], // DODAJ - domyślnie 7 i 3 dni
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

	const handleAddEmail = () => {
		const email = formData.newEmail.trim();
		if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setFormData({
				...formData,
				reminderEmails: [...formData.reminderEmails, email],
				newEmail: '',
			});
		} else {
			alert('Podaj prawidłowy adres email');
		}
	};

	const handleRemoveEmail = (index: number) => {
		setFormData({
			...formData,
			reminderEmails: formData.reminderEmails.filter((_, i) => i !== index),
		});
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

					{/* NOWA SEKCJA - Przypomnienia email */}
					<div className="border-t pt-4">
						<Label>Przypomnienia email</Label>
						<p className="text-xs text-gray-500 mb-3">
							Otrzymuj powiadomienia o zbliżających się terminach przeglądu i
							ubezpieczenia
						</p>

						<div className="space-y-2">
							<div className="flex gap-2">
								<Input
									placeholder="email@example.com"
									type="email"
									value={formData.newEmail}
									onChange={(e) =>
										setFormData({ ...formData, newEmail: e.target.value })
									}
									onKeyPress={(e) =>
										e.key === 'Enter' && (e.preventDefault(), handleAddEmail())
									}
								/>
								<Button type="button" onClick={handleAddEmail}>
									Dodaj
								</Button>
							</div>

							{formData.reminderEmails.length > 0 && (
								<div className="space-y-1">
									{formData.reminderEmails.map((email, idx) => (
										<div
											key={idx}
											className="flex items-center justify-between bg-gray-50 p-2 rounded">
											<span className="text-sm">{email}</span>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => handleRemoveEmail(idx)}>
												<X className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							)}
						</div>

						<p className="text-xs text-gray-500 mt-2">
							Przypomnienia wysyłane na 7 i 3 dni przed terminem
						</p>
					</div>

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
