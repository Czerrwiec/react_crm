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
		<div className="p-8">
			<Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
				<ArrowLeft className="mr-2 h-4 w-4" />
				Powrót
			</Button>

			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Powiadomienia</h1>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => setShowUnreadOnly(!showUnreadOnly)}>
						<Filter className="mr-2 h-4 w-4" />
						{showUnreadOnly ? 'Pokaż wszystkie' : 'Nieprzeczytane'}
					</Button>
					{unreadCount > 0 && (
						<Button onClick={handleMarkAllAsRead}>
							<Check className="mr-2 h-4 w-4" />
							Oznacz wszystkie jako przeczytane
						</Button>
					)}
				</div>
			</div>

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
											<h3 className="font-semibold">{notification.title}</h3>
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
	);
}
