import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/notificationContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface NotificationBellProps {
	onNavigate?: () => void;
}

export default function NotificationBell({
	onNavigate,
}: NotificationBellProps) {
	const { unreadCount } = useNotifications();
	const { role } = useAuth();
	const navigate = useNavigate();

	if (role !== 'admin') return null;

	const handleClick = () => {
		navigate('/admin/notifications');
		if (onNavigate) onNavigate();
	};

	return (
		<div className="relative">
			<Button variant="ghost" size="icon" onClick={handleClick}>
				<Bell className="h-5 w-5" />
				{unreadCount > 0 && (
					<span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				)}
			</Button>
		</div>
	);
}
