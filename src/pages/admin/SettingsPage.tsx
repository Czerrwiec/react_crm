import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
	const [notificationSettings, setNotificationSettings] = useState({
		lessonCreated: true,
		lessonUpdated: true,
		lessonCancelled: true,
		paymentAdded: true,
		studentAdded: false,
	});

	const handleSave = () => {
		// TODO: Zapisz w bazie danych lub localStorage
		alert('Ustawienia zapisane (funkcja w przygotowaniu)');
	};

	return (
		<div className="p-8">
			<h1 className="mb-6 text-3xl font-bold">Ustawienia</h1>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Profil</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-gray-500">Zarządzaj swoim profilem</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Dane szkoły jazdy</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-gray-500">Nazwa, adres, NIP</p>
					</CardContent>
				</Card>

				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>Powiadomienia</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-gray-600 mb-4">
							Wybierz, o jakich wydarzeniach chcesz otrzymywać powiadomienia
						</p>

						<div className="space-y-3">
							<label className="flex items-center gap-2 cursor-pointer">
								<Checkbox
									checked={notificationSettings.lessonCreated}
									onChange={(e) =>
										setNotificationSettings({
											...notificationSettings,
											lessonCreated: e.target.checked,
										})
									}
								/>
								<Label className="cursor-pointer">Dodanie nowej lekcji</Label>
							</label>

							<label className="flex items-center gap-2 cursor-pointer">
								<Checkbox
									checked={notificationSettings.lessonUpdated}
									onChange={(e) =>
										setNotificationSettings({
											...notificationSettings,
											lessonUpdated: e.target.checked,
										})
									}
								/>
								<Label className="cursor-pointer">Edycja lekcji</Label>
							</label>

							<label className="flex items-center gap-2 cursor-pointer">
								<Checkbox
									checked={notificationSettings.lessonCancelled}
									onChange={(e) =>
										setNotificationSettings({
											...notificationSettings,
											lessonCancelled: e.target.checked,
										})
									}
								/>
								<Label className="cursor-pointer">
									Usunięcie/anulowanie lekcji
								</Label>
							</label>

							<label className="flex items-center gap-2 cursor-pointer">
								<Checkbox
									checked={notificationSettings.paymentAdded}
									onChange={(e) =>
										setNotificationSettings({
											...notificationSettings,
											paymentAdded: e.target.checked,
										})
									}
								/>
								<Label className="cursor-pointer">Dodanie płatności</Label>
							</label>

							<label className="flex items-center gap-2 cursor-pointer">
								<Checkbox
									checked={notificationSettings.studentAdded}
									onChange={(e) =>
										setNotificationSettings({
											...notificationSettings,
											studentAdded: e.target.checked,
										})
									}
								/>
								<Label className="cursor-pointer">
									Dodanie nowego kursanta
								</Label>
							</label>
						</div>

						<Button onClick={handleSave} className="mt-4">
							Zapisz ustawienia
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Wygląd</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-gray-500">Motyw, język</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
