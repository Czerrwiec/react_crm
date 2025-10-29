import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { instructorService } from '@/services/instructor.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function AddInstructorPage() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		phone: '',
	});

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			await instructorService.createInstructor(formData);
			navigate('/admin/instructors');
		} catch (error) {
			console.error('Error creating instructor:', error);
			alert('Błąd dodawania instruktora. Może email już istnieje?');
		} finally {
			// setLoading(false);
		}
	};

	return (
		<div className="p-8">
			<Button
				variant="ghost"
				onClick={() => navigate('/admin/instructors')}
				className="mb-4">
				<ArrowLeft className="mr-2 h-4 w-4" />
				Powrót
			</Button>

			<h1 className="mb-6 text-3xl font-bold">Dodaj instruktora</h1>

			<form onSubmit={handleSubmit}>
				<Card className="max-w-2xl">
					<CardHeader>
						<CardTitle>Dane instruktora</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="firstName">Imię *</Label>
								<Input
									id="firstName"
									required
									value={formData.firstName}
									onChange={(e) =>
										setFormData({ ...formData, firstName: e.target.value })
									}
								/>
							</div>
							<div>
								<Label htmlFor="lastName">Nazwisko *</Label>
								<Input
									id="lastName"
									required
									value={formData.lastName}
									onChange={(e) =>
										setFormData({ ...formData, lastName: e.target.value })
									}
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="email">Email *</Label>
							<Input
								id="email"
								type="email"
								required
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
							/>
							<p className="mt-1 text-xs text-gray-500">
								Email będzie służył do logowania
							</p>
						</div>

						<div>
							<Label htmlFor="password">Hasło *</Label>
							<Input
								id="password"
								type="password"
								required
								minLength={6}
								value={formData.password}
								onChange={(e) =>
									setFormData({ ...formData, password: e.target.value })
								}
							/>
							<p className="mt-1 text-xs text-gray-500">Minimum 6 znaków</p>
						</div>

						<div>
							<Label htmlFor="phone">Telefon</Label>
							<Input
								id="phone"
								type="tel"
								value={formData.phone}
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
							/>
						</div>
					</CardContent>
				</Card>

				<div className="mt-6 flex justify-end gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate('/admin/instructors')}>
						Anuluj
					</Button>
					<Button type="submit" disabled={loading}>
						{loading ? 'Dodawanie...' : 'Dodaj instruktora'}
					</Button>
				</div>
			</form>
		</div>
	);
}
