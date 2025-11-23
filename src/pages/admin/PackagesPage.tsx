// src/pages/admin/PackagesPage.tsx (NOWY PLIK)
import { useEffect, useState } from 'react';
import { packageService } from '@/services/package.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import PackageDialog from '@/components/PackageDialog';
import type { Package } from '@/types';

export default function PackagesPage() {
	const [packages, setPackages] = useState<Package[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingPackage, setEditingPackage] = useState<Package | null>(null);

	useEffect(() => {
		loadPackages();
	}, []);

	const loadPackages = async () => {
		try {
			const data = await packageService.getPackages();
			setPackages(data);
		} catch (error) {
			console.error('Error loading packages:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Czy na pewno chcesz usunąć ten pakiet?')) return;

		try {
			await packageService.deletePackage(id);
			loadPackages();
		} catch (error) {
			console.error('Error deleting package:', error);
			alert('Błąd usuwania pakietu');
		}
	};

	const handleEdit = (pkg: Package) => {
		setEditingPackage(pkg);
		setDialogOpen(true);
	};

	const handleAdd = () => {
		setEditingPackage(null);
		setDialogOpen(true);
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="p-4 sm:p-8 pt-16 sm:pt-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold sm:text-3xl">Cennik</h1>
				<Button onClick={handleAdd}>
					<Plus className="mr-2 h-4 w-4" />
					Dodaj pakiet
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{packages.map((pkg) => (
					<Card key={pkg.id}>
						<CardHeader>
							<div className="flex items-start justify-between">
								<CardTitle>{pkg.name}</CardTitle>
								<div className="flex gap-2">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleEdit(pkg)}>
										<Pencil className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleDelete(pkg.id)}>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="text-2xl font-bold text-primary">
									{pkg.price.toFixed(2)} zł
								</div>
								<div className="text-sm text-gray-600">{pkg.hours}h jazdy</div>
								{pkg.description && (
									<p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">
										{pkg.description}
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				))}

				{packages.length === 0 && (
					<div className="col-span-full py-12 text-center text-gray-500">
						Brak pakietów
					</div>
				)}
			</div>

			<PackageDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				package={editingPackage}
				onSuccess={loadPackages}
			/>
		</div>
	);
}
