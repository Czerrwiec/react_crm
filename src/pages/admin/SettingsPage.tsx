import AppVersion from '@/components/AppVersion';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { schoolService } from '@/services/school.service';
import type { SchoolInfo } from '@/types';
import { X } from 'lucide-react';

interface NotificationSettings {
	enabled: boolean;
	lessonCreated: boolean;
	lessonUpdated: boolean;
	lessonCancelled: boolean;
	paymentAdded: boolean;
	carReservationCreated: boolean;
	carReservationUpdated: boolean;
	carReservationDeleted: boolean;
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
			carReservationCreated: true,
			carReservationUpdated: true,
			carReservationDeleted: true,
		});
	const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
	const [editingSchool, setEditingSchool] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [savingSchool, setSavingSchool] = useState(false);
	const [newCarEmail, setNewCarEmail] = useState('');

	useEffect(() => {
		if (user) {
			loadSettings();
			loadSchoolInfo();
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
					carReservationCreated: data.car_reservation_created ?? true,
					carReservationUpdated: data.car_reservation_updated ?? true,
					carReservationDeleted: data.car_reservation_deleted ?? true,
				});
			}
		} catch (error) {
			console.error('Error loading settings:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadSchoolInfo = async () => {
		try {
			const data = await schoolService.getSchoolInfo();
			setSchoolInfo(data);
		} catch (error) {
			console.error('Error loading school info:', error);
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
				car_reservation_created: notificationSettings.carReservationCreated,
				car_reservation_updated: notificationSettings.carReservationUpdated,
				car_reservation_deleted: notificationSettings.carReservationDeleted,
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

	const handleSaveSchoolInfo = async () => {
		if (!schoolInfo) return;

		setSavingSchool(true);
		try {
			await schoolService.updateSchoolInfo(schoolInfo);
			setEditingSchool(false);
			alert('Dane szkoły zapisane pomyślnie');
		} catch (error) {
			console.error('Error saving school info:', error);
			alert('Błąd zapisywania danych szkoły');
		} finally {
			setSavingSchool(false);
		}
	};

	const copyToClipboard = async (text: string | null, field: string) => {
		if (!text) return;

		try {
			// Nowoczesny API
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			// Fallback dla starszych przeglądarek/mobile
			const textarea = document.createElement('textarea');
			textarea.value = text;
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.select();
			try {
				document.execCommand('copy');
				setCopiedField(field);
				setTimeout(() => setCopiedField(null), 2000);
			} catch (e) {
				console.error('Copy failed:', e);
			}
			document.body.removeChild(textarea);
		}
	};

	const handleAddCarEmail = () => {
		if (!schoolInfo) return;

		const email = newCarEmail.trim();
		if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setSchoolInfo({
				...schoolInfo,
				carReminderEmails: [...(schoolInfo.carReminderEmails || []), email],
			});
			setNewCarEmail('');
		} else {
			alert('Podaj prawidłowy adres email');
		}
	};

	const handleRemoveCarEmail = (index: number) => {
		if (!schoolInfo) return;

		setSchoolInfo({
			...schoolInfo,
			carReminderEmails: schoolInfo.carReminderEmails.filter(
				(_, i) => i !== index
			),
		});
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col pt-14">
			{/* Scrollable Content */}
			<div className="flex-1 overflow-auto">
				<div className="p-4 sm:p-8">
					<div className="space-y-4 sm:space-y-6">
						{/* Dane szkoły jazdy */}
						<Card>
							<CardHeader>
								<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<CardTitle className="text-base sm:text-xl">
										Dane szkoły jazdy
									</CardTitle>
									{!editingSchool ? (
										<Button
											variant="outline"
											size="sm"
											onClick={() => setEditingSchool(true)}
											className="w-full sm:w-auto">
											Edytuj
										</Button>
									) : (
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												className="flex-1 sm:flex-none"
												onClick={() => {
													setEditingSchool(false);
													loadSchoolInfo();
												}}>
												Anuluj
											</Button>
											<Button
												size="sm"
												className="flex-1 sm:flex-none"
												onClick={handleSaveSchoolInfo}
												disabled={savingSchool}>
												{savingSchool ? 'Zapisywanie...' : 'Zapisz'}
											</Button>
										</div>
									)}
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								{schoolInfo && (
									<>
										{/* NIP */}
										<div>
											<Label className="text-xs sm:text-sm">NIP</Label>
											{editingSchool ? (
												<Input
													value={schoolInfo.nip || ''}
													onChange={(e) =>
														setSchoolInfo({
															...schoolInfo,
															nip: e.target.value,
														})
													}
													placeholder="1234567890"
												/>
											) : (
												<div className="flex items-center gap-2">
													<Input
														value={schoolInfo.nip || '-'}
														readOnly
														className="bg-gray-50"
													/>
													<Button
														variant="ghost"
														size="icon"
														onClick={() =>
															copyToClipboard(schoolInfo.nip, 'nip')
														}>
														{copiedField === 'nip' ? (
															<Check className="h-4 w-4 text-green-600" />
														) : (
															<Copy className="h-4 w-4" />
														)}
													</Button>
												</div>
											)}
										</div>

										{/* Nazwa */}
										<div>
											<Label className="text-xs sm:text-sm">Nazwa</Label>
											{editingSchool ? (
												<Input
													value={schoolInfo.name || ''}
													onChange={(e) =>
														setSchoolInfo({
															...schoolInfo,
															name: e.target.value,
														})
													}
													placeholder="Szkoła Jazdy XYZ"
												/>
											) : (
												<div className="flex items-center gap-2">
													<Input
														value={schoolInfo.name || '-'}
														readOnly
														className="bg-gray-50"
													/>
													<Button
														variant="ghost"
														size="icon"
														onClick={() =>
															copyToClipboard(schoolInfo.name, 'name')
														}>
														{copiedField === 'name' ? (
															<Check className="h-4 w-4 text-green-600" />
														) : (
															<Copy className="h-4 w-4" />
														)}
													</Button>
												</div>
											)}
										</div>

										{/* Miejscowość */}
										<div>
											<Label className="text-xs sm:text-sm">Miejscowość</Label>
											{editingSchool ? (
												<Input
													value={schoolInfo.city || ''}
													onChange={(e) =>
														setSchoolInfo({
															...schoolInfo,
															city: e.target.value,
														})
													}
													placeholder="Wągrowiec"
												/>
											) : (
												<div className="flex items-center gap-2">
													<Input
														value={schoolInfo.city || '-'}
														readOnly
														className="bg-gray-50"
													/>
													<Button
														variant="ghost"
														size="icon"
														onClick={() =>
															copyToClipboard(schoolInfo.city, 'city')
														}>
														{copiedField === 'city' ? (
															<Check className="h-4 w-4 text-green-600" />
														) : (
															<Copy className="h-4 w-4" />
														)}
													</Button>
												</div>
											)}
										</div>

										{/* Ulica */}
										<div>
											<Label className="text-xs sm:text-sm">Ulica</Label>
											{editingSchool ? (
												<Input
													value={schoolInfo.street || ''}
													onChange={(e) =>
														setSchoolInfo({
															...schoolInfo,
															street: e.target.value,
														})
													}
													placeholder="ul. Przykładowa 123"
												/>
											) : (
												<div className="flex items-center gap-2">
													<Input
														value={schoolInfo.street || '-'}
														readOnly
														className="bg-gray-50"
													/>
													<Button
														variant="ghost"
														size="icon"
														onClick={() =>
															copyToClipboard(schoolInfo.street, 'street')
														}>
														{copiedField === 'street' ? (
															<Check className="h-4 w-4 text-green-600" />
														) : (
															<Copy className="h-4 w-4" />
														)}
													</Button>
												</div>
											)}
										</div>

										{/* Kod pocztowy */}
										<div>
											<Label className="text-xs sm:text-sm">Kod pocztowy</Label>
											{editingSchool ? (
												<Input
													value={schoolInfo.postalCode || ''}
													onChange={(e) =>
														setSchoolInfo({
															...schoolInfo,
															postalCode: e.target.value,
														})
													}
													placeholder="62-100"
												/>
											) : (
												<div className="flex items-center gap-2">
													<Input
														value={schoolInfo.postalCode || '-'}
														readOnly
														className="bg-gray-50"
													/>
													<Button
														variant="ghost"
														size="icon"
														onClick={() =>
															copyToClipboard(
																schoolInfo.postalCode,
																'postalCode'
															)
														}>
														{copiedField === 'postalCode' ? (
															<Check className="h-4 w-4 text-green-600" />
														) : (
															<Copy className="h-4 w-4" />
														)}
													</Button>
												</div>
											)}
										</div>

										{/* Telefon */}
										<div>
											<Label className="text-xs sm:text-sm">Telefon</Label>
											{editingSchool ? (
												<Input
													value={schoolInfo.phone || ''}
													onChange={(e) =>
														setSchoolInfo({
															...schoolInfo,
															phone: e.target.value,
														})
													}
													placeholder="+48 123 456 789"
												/>
											) : (
												<div className="flex items-center gap-2">
													<Input
														value={schoolInfo.phone || '-'}
														readOnly
														className="bg-gray-50"
													/>
													<Button
														variant="ghost"
														size="icon"
														onClick={() =>
															copyToClipboard(schoolInfo.phone, 'phone')
														}>
														{copiedField === 'phone' ? (
															<Check className="h-4 w-4 text-green-600" />
														) : (
															<Copy className="h-4 w-4" />
														)}
													</Button>
												</div>
											)}
										</div>
									</>
								)}
							</CardContent>
						</Card>

						{/* Przypomnienia o samochodach */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base sm:text-xl">
									Przypomnienia o terminach samochodów
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<p className="text-xs sm:text-sm text-gray-600">
									Email(e) na które będą wysyłane przypomnienia o zbliżających
									się terminach przeglądów i ubezpieczeń (7, 3 i 1 dzień przed)
								</p>

								{!editingSchool && schoolInfo && (
									<div className="space-y-2">
										{schoolInfo.carReminderEmails &&
										schoolInfo.carReminderEmails.length > 0 ? (
											schoolInfo.carReminderEmails.map((email, idx) => (
												<div
													key={idx}
													className="bg-gray-50 p-2 rounded text-sm">
													{email}
												</div>
											))
										) : (
											<div className="text-sm text-gray-500 italic">
												Brak skonfigurowanych adresów email
											</div>
										)}
									</div>
								)}

								{editingSchool && schoolInfo && (
									<div className="space-y-2">
										<div className="flex gap-2">
											<Input
												placeholder="email@example.com"
												type="email"
												value={newCarEmail}
												onChange={(e) => setNewCarEmail(e.target.value)}
												onKeyPress={(e) => {
													if (e.key === 'Enter') {
														e.preventDefault();
														handleAddCarEmail();
													}
												}}
											/>
											<Button type="button" onClick={handleAddCarEmail}>
												Dodaj
											</Button>
										</div>

										{schoolInfo.carReminderEmails &&
											schoolInfo.carReminderEmails.length > 0 && (
												<div className="space-y-1">
													{schoolInfo.carReminderEmails.map((email, idx) => (
														<div
															key={idx}
															className="flex items-center justify-between bg-gray-50 p-2 rounded">
															<span className="text-sm">{email}</span>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																onClick={() => handleRemoveCarEmail(idx)}>
																<X className="h-4 w-4" />
															</Button>
														</div>
													))}
												</div>
											)}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Powiadomienia */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base sm:text-xl">
									Powiadomienia dla mnie
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="rounded-lg bg-blue-50 border border-blue-200 p-3 sm:p-4">
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
											<Label className="cursor-pointer font-semibold text-sm sm:text-base">
												Włącz moje powiadomienia
											</Label>
											<p className="text-xs sm:text-sm text-gray-600 mt-1">
												Włącz lub wyłącz wszystkie powiadomienia dla swojego
												konta. Każdy admin ma osobne ustawienia.
											</p>
										</div>
									</label>
								</div>

								<p className="text-xs sm:text-sm text-gray-600">
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
										<Label className="cursor-pointer text-xs sm:text-sm">
											Dodanie nowej lekcji
										</Label>
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
										<Label className="cursor-pointer text-xs sm:text-sm">
											Edycja lekcji
										</Label>
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
										<Label className="cursor-pointer text-xs sm:text-sm">
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
										<Label className="cursor-pointer text-xs sm:text-sm">
											Dodanie/edycja/usunięcie płatności
										</Label>
									</label>

									<label className="flex items-center gap-2 cursor-pointer">
										<Checkbox
											checked={notificationSettings.carReservationCreated}
											onChange={(e) =>
												setNotificationSettings({
													...notificationSettings,
													carReservationCreated: e.target.checked,
												})
											}
											disabled={!notificationSettings.enabled}
										/>
										<Label className="cursor-pointer text-xs sm:text-sm">
											Dodanie rezerwacji samochodu
										</Label>
									</label>

									<label className="flex items-center gap-2 cursor-pointer">
										<Checkbox
											checked={notificationSettings.carReservationUpdated}
											onChange={(e) =>
												setNotificationSettings({
													...notificationSettings,
													carReservationUpdated: e.target.checked,
												})
											}
											disabled={!notificationSettings.enabled}
										/>
										<Label className="cursor-pointer text-xs sm:text-sm">
											Edycja rezerwacji samochodu
										</Label>
									</label>

									<label className="flex items-center gap-2 cursor-pointer">
										<Checkbox
											checked={notificationSettings.carReservationDeleted}
											onChange={(e) =>
												setNotificationSettings({
													...notificationSettings,
													carReservationDeleted: e.target.checked,
												})
											}
											disabled={!notificationSettings.enabled}
										/>
										<Label className="cursor-pointer text-xs sm:text-sm">
											Usunięcie rezerwacji samochodu
										</Label>
									</label>
								</div>

								<div className="pt-4 border-t">
									<p className="text-xs text-gray-500 mb-3">
										💡 Powiadomienia pokazują kto wykonał akcję
										(Admin/Instruktor). Nie otrzymasz powiadomienia o własnych
										działaniach. Inni admini mogą mieć własne ustawienia.
									</p>
									<Button
										onClick={handleSave}
										disabled={saving}
										className="w-full sm:w-auto">
										{saving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Wersja */}
						<div>
							<AppVersion />
						</div>
						
					</div>
				</div>
			</div>
		</div>
	);
}
