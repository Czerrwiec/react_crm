import { useState, useEffect, FormEvent } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { packageService } from '@/services/package.service';
import type { Package } from '@/types';

interface PackageDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	package?: Package | null;
	onSuccess: () => void;
}

export default function PackageDialog({
	open,
	onOpenChange,
	package: pkg,
	onSuccess,
}: PackageDialogProps) {
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		price: '',
		hours: '',
		description: '',
		includesCar: false,
	});

	useEffect(() => {
		if (open) {
			if (pkg) {
				setFormData({
					name: pkg.name,
					price: pkg.price.toString(),
					hours: pkg.hours.toString(),
					description: pkg.description || '',
					includesCar: pkg.includesCar,
				});
			} else {
				setFormData({
					name: '',
					price: '',
					hours: '',
					description: '',
					includesCar: false,
				});
			}
		}
	}, [open, pkg]);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const data = {
				name: formData.name,
				price: parseFloat(formData.price),
				hours: parseFloat(formData.hours),
				description: formData.description || null,
				includesCar: formData.includesCar,
			};

			if (pkg) {
				await packageService.updatePackage(pkg.id, data);
			} else {
				await packageService.createPackage(data);
			}

			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error('Error saving package:', error);
			alert('Błąd zapisywania pakietu');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{pkg ? 'Edytuj pakiet' : 'Dodaj pakiet'}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label htmlFor="name">Nazwa pakietu *</Label>
						<Input
							id="name"
							required
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="np. Pakiet Standard"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label htmlFor="price">Cena (zł) *</Label>
							<Input
								id="price"
								type="number"
								step="0.01"
								required
								value={formData.price}
								onChange={(e) =>
									setFormData({ ...formData, price: e.target.value })
								}
							/>
						</div>
						<div>
							<Label htmlFor="hours">Ilość godzin *</Label>
							<Input
								id="hours"
								type="number"
								step="0.5"
								required
								value={formData.hours}
								onChange={(e) =>
									setFormData({ ...formData, hours: e.target.value })
								}
							/>
						</div>
					</div>

					<label className="flex items-center gap-2">
						<Checkbox
							checked={formData.includesCar}
							onChange={(e) =>
								setFormData({ ...formData, includesCar: e.target.checked })
							}
						/>
						<span className="text-sm">Auto na egzamin</span>
					</label>

					<div>
						<Label htmlFor="description">Opis</Label>
						<Textarea
							id="description"
							rows={4}
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							placeholder="Dodatkowe informacje o pakiecie..."
						/>
					</div>

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}>
							Anuluj
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? 'Zapisywanie...' : pkg ? 'Zapisz' : 'Dodaj'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
