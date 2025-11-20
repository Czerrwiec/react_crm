import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { User } from '@/types';

interface InstructorMultiSelectProps {
	instructors: User[];
	selectedIds: string[];
	onChange: (ids: string[]) => void;
}

export default function InstructorMultiSelect({
	instructors,
	selectedIds,
	onChange,
}: InstructorMultiSelectProps) {
	const handleToggle = (instructorId: string) => {
		if (selectedIds.includes(instructorId)) {
			onChange(selectedIds.filter((id) => id !== instructorId));
		} else {
			onChange([...selectedIds, instructorId]);
		}
	};

	return (
		<div>
			<Label>Instruktorzy</Label>
			<div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
				{instructors.length === 0 ? (
					<div className="text-center text-sm text-gray-500">
						Brak instruktorów
					</div>
				) : (
					instructors.map((instructor) => (
						<label
							key={instructor.id}
							className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
							<Checkbox
								checked={selectedIds.includes(instructor.id)}
								onChange={() => handleToggle(instructor.id)}
							/>
							<span className="text-sm">
								{instructor.firstName} {instructor.lastName}
							</span>
						</label>
					))
				)}
			</div>
			{selectedIds.length === 0 && (
				<p className="mt-1 text-xs text-gray-500">
					Możesz dodać kursanta bez instruktora
				</p>
			)}
		</div>
	);
}
