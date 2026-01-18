import { supabase } from '@/lib/supabase'
import { mapNotification } from '@/lib/mappers'

export const notificationService = {
    async getNotifications(unreadOnly: boolean = false) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (unreadOnly) {
            query = query.eq('read', false)
        }

        const { data, error } = await query
        if (error) throw error

        return data.map(mapNotification)
    },

    async getUnreadCount() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return 0

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false)

        if (error) throw error
        return count || 0
    },

    async markAsRead(notificationId: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)

        if (error) throw error
    },

    async markAllAsRead() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false)

        if (error) throw error
    },

    async deleteNotification(notificationId: string) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)

        if (error) throw error
    },

    async sendNotification(params: {
        userIds: string[];
        type: string;
        title: string;
        message: string;
        relatedId?: string | null;
        excludeUserId?: string | null;
    }) {

        try {
            // Filtruj userIds jeśli mamy excludeUserId
            const targetUserIds = params.excludeUserId
                ? params.userIds.filter(id => id !== params.excludeUserId)
                : params.userIds;

            if (targetUserIds.length === 0) return;

            const notifications = targetUserIds.map(userId => ({
                user_id: userId,
                type: params.type,
                title: params.title,
                message: params.message,
                related_id: params.relatedId || null,
                created_by: params.excludeUserId || null,
                read: false,
            }));

            const { error } = await supabase
                .from('notifications')
                .insert(notifications);

            if (error) {
                console.error('Error sending notifications:', error);
            }
        } catch (error) {
            console.error('Error in sendNotification:', error);
        }
    },

    // ============================================
    // POMOCNICZE FUNKCJE
    // ============================================

    async getAllAdminIds(excludeUserId?: string) {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'admin');

        if (error) {
            console.error('Error fetching admins:', error);
            return [];
        }

        return data
            .map(u => u.id)
            .filter(id => excludeUserId ? id !== excludeUserId : true);
    },

    async getActorName(userId: string | null) {
        if (!userId) return 'Nieznany użytkownik';

        try {
            const { data, error } = await supabase
                .from('users')
                .select('first_name, last_name, role')
                .eq('id', userId)
                .single();

            if (error || !data) return 'Nieznany użytkownik';

            const roleName = data.role === 'admin' ? 'Admin' : 'Instruktor';
            return `${data.first_name} ${data.last_name} (${roleName})`;
        } catch {
            return 'Nieznany użytkownik';
        }
    },

    // ============================================
    // NOTYFIKACJE DLA KURSANTÓW
    // ============================================

    async notifyAdminsAboutNewStudent(studentId: string, studentName: string, createdByUserId: string) {
        const adminIds = await this.getAllAdminIds(createdByUserId);
        const actorName = await this.getActorName(createdByUserId);

        await this.sendNotification({
            userIds: adminIds,
            type: 'student_created',
            title: 'Nowy kursant',
            message: `${actorName} dodał kursanta: ${studentName}`,
            relatedId: studentId,
            excludeUserId: createdByUserId,
        });
    },

    async notifyInstructorAboutAssignment(instructorId: string, studentId: string, studentName: string, assignedByUserId: string) {
        const actorName = await this.getActorName(assignedByUserId);

        await this.sendNotification({
            userIds: [instructorId],
            type: 'student_assigned',
            title: 'Przypisano kursanta',
            message: `${actorName} przypisał Ci kursanta: ${studentName}`,
            relatedId: studentId,
            excludeUserId: assignedByUserId,
        });
    },

    async notifyAboutStudentUpdate(studentId: string, studentName: string, updatedByUserId: string, changeDescription: string) {
        // Pobierz wszystkich adminów
        const adminIds = await this.getAllAdminIds(updatedByUserId);
        const actorName = await this.getActorName(updatedByUserId);

        await this.sendNotification({
            userIds: adminIds,
            type: 'student_updated',
            title: 'Edycja kursanta',
            message: `${actorName} zaktualizował ${studentName}: ${changeDescription}`,
            relatedId: studentId,
            excludeUserId: updatedByUserId,
        });
    },

    // ============================================
    // NOTYFIKACJE DLA NOTATEK
    // ============================================

    async notifyInstructorsAboutNote(instructorIds: string[], studentId: string, studentName: string, notePreview: string, createdByUserId: string) {
        const actorName = await this.getActorName(createdByUserId);
        const preview = notePreview.length > 50
            ? notePreview.substring(0, 50) + '...'
            : notePreview;

        // Powiadom instruktorów
        if (instructorIds.length > 0) {
            await this.sendNotification({
                userIds: instructorIds,
                type: 'note_added_by_admin',
                title: 'Nowa notatka',
                message: `${actorName} dodał notatkę do ${studentName}: "${preview}"`,
                relatedId: studentId,
                excludeUserId: createdByUserId,
            });
        }

        // NOWE: Powiadom również innych adminów
        const adminIds = await this.getAllAdminIds(createdByUserId);
        if (adminIds.length > 0) {
            await this.sendNotification({
                userIds: adminIds,
                type: 'note_added_by_admin',
                title: 'Nowa notatka od admina',
                message: `${actorName} dodał notatkę do ${studentName}: "${preview}"`,
                relatedId: studentId,
                excludeUserId: createdByUserId,
            });
        }
    },

    async notifyAdminsAboutInstructorNote(studentId: string, studentName: string, notePreview: string, instructorId: string) {
        const adminIds = await this.getAllAdminIds();

        console.log('DEBUG notifyAdminsAboutInstructorNote:', {
            adminIds,
            studentId,
            instructorId,
            notePreview: notePreview.substring(0, 50)
        });

        if (adminIds.length === 0) {
            console.warn('No admins found to notify!');
            return;
        }

        const instructorName = await this.getActorName(instructorId);
        const preview = notePreview.length > 50
            ? notePreview.substring(0, 50) + '...'
            : notePreview;

        const result = await this.sendNotification({
            userIds: adminIds,
            type: 'note_added_by_instructor',
            title: 'Notatka od instruktora',
            message: `${instructorName} dodał notatkę do ${studentName}: "${preview}"`,
            relatedId: studentId,
            excludeUserId: instructorId,
        });

        console.log('Notification sent result:', result);
    }
}