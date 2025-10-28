import { useState, useEffect } from 'react';
import { notificationService } from '@/services/notification.service';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useNotifications() {
	const [unreadCount, setUnreadCount] = useState(0);
	const { user, role } = useAuth();

	useEffect(() => {
		if (!user || role !== 'admin') return;

		// Załaduj initial count
		loadUnreadCount();

		// Subscribe do zmian w tabeli notifications dla tego użytkownika
		const channel = supabase
			.channel('notifications-changes')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'notifications',
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					console.log('🔔 Notification change detected:', payload);
					loadUnreadCount();
				}
			)
			.subscribe((status) => {
				console.log('🔔 Subscription status:', status);
			});

		return () => {
			supabase.removeChannel(channel);
		};
	}, [user, role]);

	const loadUnreadCount = async () => {
		try {
			const count = await notificationService.getUnreadCount();
			console.log('🔔 Unread count loaded:', count);
			setUnreadCount(count);
		} catch (error) {
			console.error('Error loading unread count:', error);
		}
	};

	return { unreadCount, refresh: loadUnreadCount };
}
