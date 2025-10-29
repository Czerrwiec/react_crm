import {
	createContext,
	useContext,
	useState,
	useEffect,
	useRef,
	ReactNode,
} from 'react';
import { notificationService } from '@/services/notification.service';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationsContextType {
	unreadCount: number;
	refresh: () => Promise<void>;
}

const NotificationsContext = createContext<
	NotificationsContextType | undefined
>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
	const [unreadCount, setUnreadCount] = useState(0);
	const { user, role } = useAuth();
	const channelRef = useRef<RealtimeChannel | null>(null);
	const loadingRef = useRef(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const loadUnreadCount = async () => {
		if (!user || role !== 'admin' || loadingRef.current) {
			return;
		}

		loadingRef.current = true;
		try {
			const count = await notificationService.getUnreadCount();
			setUnreadCount(count);
		} catch (error) {
			console.error('Error loading unread count:', error);
		} finally {
			loadingRef.current = false;
		}
	};

	useEffect(() => {
		if (!user || role !== 'admin') {
			setUnreadCount(0);
			if (channelRef.current) {
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
			return;
		}

		loadUnreadCount();

		if (channelRef.current) {
			supabase.removeChannel(channelRef.current);
		}

		const channel = supabase
			.channel(`notifications-${user.id}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'notifications',
					filter: `user_id=eq.${user.id}`,
				},
				() => {
					// Debounce refresh to avoid multiple calls
					if (timeoutRef.current) {
						clearTimeout(timeoutRef.current);
					}
					timeoutRef.current = setTimeout(() => {
						loadUnreadCount();
					}, 300);
				}
			)
			.subscribe();

		channelRef.current = channel;

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			if (channelRef.current) {
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
	}, [user, role]);

	return (
		<NotificationsContext.Provider
			value={{ unreadCount, refresh: loadUnreadCount }}>
			{children}
		</NotificationsContext.Provider>
	);
}

export function useNotifications() {
	const context = useContext(NotificationsContext);
	if (context === undefined) {
		throw new Error(
			'useNotifications must be used within NotificationsProvider'
		);
	}
	return context;
}
