import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface NotificationSettings {
	enabled: boolean;
	lessonCreated: boolean;
	lessonUpdated: boolean;
	lessonCancelled: boolean;
	paymentAdded: boolean;
}

export default function SettingsPage() {
	const { user } = useAuth();
	const [notificationSettings, setNotificationSettings] =
		useState<NotificationSettings>({
			enabled: true,
			lessonCreated: true,
			lessonUpdated: true,
			lessonCancelled: true,
			paymentAdded: true,
		});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (user) {
			loadSettings();
		}
	}, [user]);

	const loadSettings = async () => {
		if (!user) return;

		try {
			const { data, error } = await supabase
				.from('notification_settings')
				.select('*')
				.eq('user_id', user.id)
				.single();

			if (error && error.code !== 'PGRST116') {
				throw error;
			}

			if (data) {
				setNotificationSettings({
					enabled: data.enabled ?? true,
					lessonCreated: data.lesson_created,
					lessonUpdated: data.lesson_updated,
					lessonCancelled: data.lesson_cancelled,
					paymentAdded: data.payment_added,
				});
			}
		} catch (error) {
			console.error('Error loading settings:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		if (!user) return;

		setSaving(true);
		try {
			const { error } = await supabase.from('notification_settings').upsert({
				user_id: user.id,
				enabled: notificationSettings.enabled,
				lesson_created: notificationSettings.lessonCreated,
				lesson_updated: notificationSettings.lessonUpdated,
				lesson_cancelled: notificationSettings.lessonCancelled,
				payment_added: notificationSettings.paymentAdded,
			});

			if (error) throw error;

			alert('Ustawienia zapisane pomyślnie');
		} catch (error) {
			console.error('Error saving settings:', error);
			alert('Błąd zapisywania ustawień');
		} finally {
			setSaving(false);
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
						<div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-4">
							<label className="flex items-start gap-3 cursor-pointer">
								<Checkbox
									checked={notificationSettings.enabled}
									onChange={(e) =>
										setNotificationSettings({
											...notificationSettings,
											enabled: e.target.checked,
										})
									}
								/>
								<div>
									<Label className="cursor-pointer font-semibold text-base">
										Włącz powiadomienia
									</Label>
									<p className="text-sm text-gray-600 mt-1">
										Główny przełącznik powiadomień. Gdy wyłączony, nie będziesz
										otrzymywać żadnych powiadomień, niezależnie od ustawień
										poniżej.
									</p>
								</div>
							</label>
						</div>

						<p className="text-sm text-gray-600 mb-4">
							Wybierz, o jakich wydarzeniach chcesz otrzymywać powiadomienia
						</p>

						<div
							className={`space-y-3 ${
								!notificationSettings.enabled ? 'opacity-50' : ''
							}`}>
							<label className="flex items-center gap-2 cursor-pointer">
								<Checkbox
									checked={notificationSettings.lessonCreated}
									onChange={(e) =>
										setNotificationSettings({
											...notificationSettings,
											lessonCreated: e.target.checked,
										})
									}
									disabled={!notificationSettings.enabled}
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
									disabled={!notificationSettings.enabled}
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
									disabled={!notificationSettings.enabled}
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
									disabled={!notificationSettings.enabled}
								/>
								<Label className="cursor-pointer">
									Dodanie/edycja/usunięcie płatności
								</Label>
							</label>
						</div>

						<div className="pt-4 border-t">
							<p className="text-xs text-gray-500 mb-3">
								💡 Powiadomienia pokazują kto faktycznie wykonał akcję (Admin
								lub Instruktor). Nie otrzymasz powiadomienia o własnych
								działaniach.
							</p>
							<Button onClick={handleSave} disabled={saving}>
								{saving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
							</Button>
						</div>
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
