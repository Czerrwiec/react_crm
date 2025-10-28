import * as React from 'react';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
	HTMLInputElement,
	React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
	<input
		type="checkbox"
		ref={ref}
		className={cn(
			'h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2',
			className
		)}
		{...props}
	/>
));

Checkbox.displayName = 'Checkbox';

export { Checkbox };
