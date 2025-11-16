import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '@/services/notification.service';
import { useNotifications } from '@/hooks/notificationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Trash2, Filter } from 'lucide-react';
import type { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

export default function NotificationsPage() {
	const navigate = useNavigate();
	const { refresh } = useNotifications();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(true);
	const [showUnreadOnly, setShowUnreadOnly] = useState(false);

	useEffect(() => {
		loadNotifications();
	}, [showUnreadOnly]);

	const loadNotifications = async () => {
		setLoading(true);
		try {
			const data = await notificationService.getNotifications(showUnreadOnly);
			setNotifications(data);
		} catch (error) {
			console.error('Error loading notifications:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleNotificationClick = async (notification: Notification) => {
		if (!notification.read) {
			try {
				await notificationService.markAsRead(notification.id);
				setNotifications((prev) =>
					prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
				);
				await refresh();
			} catch (error) {
				console.error('Error marking as read:', error);
			}
		}

		// Nawiguj do powiązanego zasobu
		if (notification.relatedId) {
			if (notification.type.includes('lesson')) {
				// Przekieruj do szczegółów kursanta
				navigate(`/admin/students/${notification.relatedId}`);
			} else if (
				notification.type.includes('student') ||
				notification.type.includes('payment')
			) {
				navigate(`/admin/students/${notification.relatedId}`);
			}
		}
	};

	const handleMarkAllAsRead = async () => {
		try {
			await notificationService.markAllAsRead();
			await loadNotifications();
			await refresh();
		} catch (error) {
			console.error('Error marking all as read:', error);
		}
	};

	const handleDelete = async (e: React.MouseEvent, id: string) => {
		e.stopPropagation();
		try {
			await notificationService.deleteNotification(id);
			await loadNotifications();
			await refresh();
		} catch (error) {
			console.error('Error deleting notification:', error);
		}
	};

	const getNotificationIcon = (type: string) => {
		if (type.includes('lesson')) return '📅';
		if (type.includes('payment')) return '💰';
		if (type.includes('student')) return '👤';
		return '🔔';
	};

	const getTimeAgo = (date: string) => {
		return formatDistanceToNow(new Date(date), { addSuffix: true, locale: pl });
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	const unreadCount = notifications.filter((n) => !n.read).length;

	return (
		<div className="flex h-screen flex-col">
			{/* Fixed Header */}
			<div className="flex-shrink-0 border-b bg-white">
				<div className="p-4 sm:p-8">
					<div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between relative">
						{/* Strzałka powrotu */}

						<div className="hidden sm:block">
							<Button variant="ghost" onClick={() => navigate(-1)}>
								<ArrowLeft className="mr-2 h-4 w-4" />
								Powrót
							</Button>
						</div>
						{/* Mobile – tylko strzałka po prawej */}
						<div className="relative sm:hidden">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => navigate(-1)}
								className="absolute right-0 top-0">
								<ArrowLeft className="h-5 w-5" />
							</Button>
						</div>

						{/* Zawartość przycisków filtrów */}
						<div className="flex flex-col gap-2 sm:flex-row sm:ml-auto pt-12 sm:pt-0">
							<Button
								variant="outline"
								onClick={() => setShowUnreadOnly(!showUnreadOnly)}
								className="w-full sm:w-auto">
								<Filter className="mr-2 h-4 w-4" />
								{showUnreadOnly ? 'Pokaż wszystkie' : 'Nieprzeczytane'}
							</Button>
							{unreadCount > 0 && (
								<Button
									onClick={handleMarkAllAsRead}
									className="w-full sm:w-auto">
									<Check className="mr-2 h-4 w-4" />
									Oznacz wszystkie
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-auto">
				<div className="p-4 sm:p-8">
					{notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12">
							<div className="text-6xl mb-4">🔔</div>
							<p className="text-gray-500">
								{showUnreadOnly
									? 'Brak nieprzeczytanych powiadomień'
									: 'Brak powiadomień'}
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{notifications.map((notification) => (
								<Card
									key={notification.id}
									className={`cursor-pointer transition-all hover:shadow-md ${
										!notification.read
											? 'border-l-4 border-l-primary bg-blue-50'
											: ''
									}`}
									onClick={() => handleNotificationClick(notification)}>
									<CardContent className="flex items-start gap-4 pt-6">
										<div className="text-3xl">
											{getNotificationIcon(notification.type)}
										</div>
										<div className="flex-1">
											<div className="mb-1 flex items-start justify-between">
												<div className="flex items-center gap-2">
													<h3 className="font-semibold">
														{notification.title}
													</h3>
													{!notification.read && (
														<Badge variant="default" className="text-xs">
															Nowe
														</Badge>
													)}
												</div>
												<Button
													variant="ghost"
													size="icon"
													onClick={(e) => handleDelete(e, notification.id)}>
													<Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
												</Button>
											</div>
											<p className="text-sm text-gray-600">
												{notification.message}
											</p>
											<p className="mt-2 text-xs text-gray-400">
												{getTimeAgo(notification.createdAt)}
											</p>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
