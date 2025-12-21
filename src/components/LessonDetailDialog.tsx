import { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { lessonService } from '@/services/lesson.service';
import type { Lesson } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import ConfirmDialog from '@/components/ConfirmDialog';

interface LessonDetailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	lesson: Lesson | null;
	studentNames: Map<string, string>;
	onEdit: (lesson: Lesson) => void;
	onSuccess: () => void;
}

export default function LessonDetailDialog({
	open,
	onOpenChange,
	lesson,
	studentNames,
	onEdit,
	onSuccess,
}: LessonDetailDialogProps) {
	const [deleting, setDeleting] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	if (!lesson) return null;

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'scheduled':
				return 'Zaplanowana';
			case 'completed':
				return 'Ukończona';
			case 'cancelled':
				return 'Anulowana';
			default:
				return status;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'scheduled':
				return 'default';
			case 'completed':
				return 'default';
			case 'cancelled':
				return 'secondary';
			default:
				return 'default';
		}
	};

	const formatDuration = (duration: number) => {
		const h = Math.floor(duration);
		const m = Math.round((duration - h) * 60);
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	};

	const handleDeleteConfirm = async () => {
		setDeleting(true);
		try {
			await lessonService.deleteLesson(lesson.id);
			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error('Error deleting lesson:', error);
			alert('Błąd usuwania lekcji');
		} finally {
			setDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Lekcja {lesson.startTime} - {lesson.endTime}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<div className="text-sm text-gray-500">Data</div>
						<div className="font-medium">
							{format(new Date(lesson.date), 'd MMMM yyyy', { locale: pl })}
						</div>
					</div>

					<div>
						<div className="text-sm text-gray-500">Czas trwania</div>
						<div className="font-medium">{formatDuration(lesson.duration)}</div>
					</div>

					<div>
						<div className="text-sm text-gray-500">Status</div>
						<Badge variant={getStatusColor(lesson.status)}>
							{getStatusLabel(lesson.status)}
						</Badge>
					</div>

					{lesson.studentIds.length > 0 && (
						<div>
							<div className="text-sm text-gray-500 mb-1">Kursanci</div>
							<div className="space-y-1">
								{lesson.studentIds.map((id) => (
									<div key={id} className="text-sm font-medium">
										{studentNames.get(id) || 'Nieznany'}
									</div>
								))}
							</div>
						</div>
					)}

					{lesson.notes && (
						<div>
							<div className="text-sm text-gray-500">Notatki</div>
							<div className="text-sm italic">{lesson.notes}</div>
						</div>
					)}

					<div className="flex gap-2 pt-4">
						<Button
							variant="outline"
							className="flex-1"
							onClick={() => {
								onEdit(lesson);
								onOpenChange(false);
							}}>
							<Pencil className="mr-2 h-4 w-4" />
							Edytuj
						</Button>
						{lesson.status !== 'completed' && (
							<Button
								variant="destructive"
								className="flex-1"
								onClick={() => setDeleteDialogOpen(true)}
								disabled={deleting}>
								<Trash2 className="mr-2 h-4 w-4" />
								Usuń
							</Button>
						)}
					</div>
				</div>
			</DialogContent>
			<ConfirmDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				title="Usunąć lekcję?"
				description={
					<>
						<strong>Data:</strong>{' '}
						{format(new Date(lesson.date), 'd MMMM yyyy', { locale: pl })}
						<br />
						<strong>Godzina:</strong> {lesson.startTime} - {lesson.endTime}
					</>
				}
				confirmText="Usuń lekcję"
				onConfirm={handleDeleteConfirm}
				loading={deleting}
			/>
		</Dialog>
	);
}
