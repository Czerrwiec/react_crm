import { useEffect, useState } from 'react';
import { carService } from '@/services/car.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Car } from '@/types';
import CarDialog from '@/components/CarDialog';

console.log('CarsPage loaded');

export default function CarsPage() {
	const [cars, setCars] = useState<Car[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingCar, setEditingCar] = useState<Car | null>(null);
	const [activeTab, setActiveTab] = useState<'calendar' | 'fleet'>('calendar');

	useEffect(() => {
		loadCars();
	}, []);

	const loadCars = async () => {
		try {
			const data = await carService.getAllCars();
			setCars(data);
		} catch (error) {
			console.error('Error loading cars:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleAddCar = () => {
		setEditingCar(null);
		setDialogOpen(true);
	};

	const handleEditCar = (car: Car) => {
		setEditingCar(car);
		setDialogOpen(true);
	};

	const handleDeleteCar = async (id: string) => {
		if (!confirm('Czy na pewno chcesz usunąć ten samochód?')) return;

		try {
			await carService.deleteCar(id);
			loadCars();
		} catch (error) {
			console.error('Error deleting car:', error);
			alert('Błąd usuwania samochodu');
		}
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="p-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Samochody</h1>
			</div>

			{/* Tabs */}
			<div className="mb-6 flex gap-2 border-b">
				<button
					className={`px-4 py-2 text-sm font-medium transition-colors ${
						activeTab === 'calendar'
							? 'border-b-2 border-primary text-primary'
							: 'text-gray-600 hover:text-gray-900'
					}`}
					onClick={() => setActiveTab('calendar')}>
					Kalendarz rezerwacji
				</button>
				<button
					className={`px-4 py-2 text-sm font-medium transition-colors ${
						activeTab === 'fleet'
							? 'border-b-2 border-primary text-primary'
							: 'text-gray-600 hover:text-gray-900'
					}`}
					onClick={() => setActiveTab('fleet')}>
					Flota
				</button>
			</div>

			{activeTab === 'calendar' ? (
				<div className="rounded-lg border bg-gray-50 p-8 text-center">
					<p className="text-gray-500">Kalendarz rezerwacji - wkrótce</p>
				</div>
			) : (
				<div>
					<div className="mb-4 flex justify-end">
						<Button onClick={handleAddCar}>
							<Plus className="mr-2 h-4 w-4" />
							Dodaj samochód
						</Button>
					</div>

					<div className="grid gap-4">
						{cars.map((car) => (
							<Card
								key={car.id}
								className={`cursor-pointer transition-shadow hover:shadow-md ${
									!car.active ? 'opacity-60' : ''
								}`}
								onClick={() => handleEditCar(car)}>
								<CardContent className="p-4">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<h3 className="text-lg font-semibold">
												{car.name} ({car.year})
											</h3>
											<div className="mt-2 space-y-1 text-sm text-gray-600">
												{car.inspectionDate && (
													<div>
														<strong>Przegląd:</strong>{' '}
														{format(new Date(car.inspectionDate), 'dd.MM.yyyy')}
													</div>
												)}
												{car.insuranceDate && (
													<div>
														<strong>Ubezpieczenie:</strong>{' '}
														{format(new Date(car.insuranceDate), 'dd.MM.yyyy')}
													</div>
												)}
											</div>
										</div>
										<Button
											variant="destructive"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteCar(car.id);
											}}>
											Usuń
										</Button>
									</div>
								</CardContent>
							</Card>
						))}

						{cars.length === 0 && (
							<div className="py-12 text-center text-gray-500">
								Brak samochodów w bazie
							</div>
						)}
					</div>
				</div>
			)}

			<CarDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				car={editingCar}
				onSuccess={loadCars}
			/>
		</div>
	);
}
