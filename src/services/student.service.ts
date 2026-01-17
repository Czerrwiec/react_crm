import { supabase } from '@/lib/supabase'
import type { Student } from '@/types'
import { mapStudent } from '@/lib/mappers'
import { notificationService } from './notification.service'

export const studentService = {
  async getStudents() {
    // Krok 1: Pobierz studentów
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('last_name');

    if (error) throw error;

    // Krok 2: Pobierz wszystkich instruktorów
    const { data: allInstructors } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('role', 'instructor');

    const instructorsMap = new Map(
      allInstructors?.map(i => [i.id, {
        id: i.id,
        firstName: i.first_name,
        lastName: i.last_name
      }]) || []
    );

    // Krok 3: Mapuj studentów z ich instruktorami
    return data.map(student => {
      const mapped = mapStudent(student);
      return {
        ...mapped,
        instructors: (mapped.instructorIds || [])
          .map(id => instructorsMap.get(id))
          .filter(Boolean) as Array<{ id: string; firstName: string; lastName: string }>
      };
    });
  },

  async getActiveStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('inactive', false)
      .order('last_name');

    if (error) throw error;
    return data.map(mapStudent);
  },

  async getStudent(id: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return mapStudent(data)
  },

  async createStudent(student: Omit<Student, 'id'>) {

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('students')
      .insert({
        first_name: student.firstName,
        last_name: student.lastName,
        phone: student.phone,
        email: student.email,
        pesel: student.pesel, // NOWE
        pkk_number: student.pkkNumber,
        city: student.city,
        instructor_ids: student.instructorIds,
        course_price: student.coursePrice,
        course_paid: student.coursePaid,
        profile_updated: student.profileUpdated, // NOWE
        internal_theory_passed: student.internalTheoryPassed, // NOWE
        internal_practice_passed: student.internalPracticePassed, // NOWE
        state_exam_status: student.stateExamStatus, // NOWE
        state_exam_attempts: student.stateExamAttempts, // NOWE
        is_supplementary_course: student.isSupplementaryCourse,
        car: student.car,
        inactive: student.inactive,
        total_hours_driven: student.totalHoursDriven,
        course_start_date: student.courseStartDate,
        notes: student.notes,
        state_exam_date: student.stateExamDate,
        state_exam_time: student.stateExamTime,
        package_id: student.packageId,
        custom_course_hours: student.customCourseHours,
        mark_progress_complete: student.markProgressComplete,
      })
      .select()
      .single();

    if (error) throw error;

    if (user) {
      // Powiadom adminów o nowym kursancie
      await notificationService.notifyAdminsAboutNewStudent(
        data.id,
        `${student.firstName} ${student.lastName}`,
        user.id
      );

      // Powiadom instruktorów o przypisaniu
      if (student.instructorIds && student.instructorIds.length > 0) {
        for (const instructorId of student.instructorIds) {
          await notificationService.notifyInstructorAboutAssignment(
            instructorId,
            data.id,
            `${student.firstName} ${student.lastName}`,
            user.id
          );
        }
      }
    }

    return mapStudent(data);
  },

  async updateStudent(id: string, updates: Partial<Student>) {
    /**
     * =====================================
     * PRZYPADEK 1: EDYTOWANE SĄ TYLKO NOTES
     * =====================================
     */
    const isOnlyNotes =
      Object.keys(updates).length === 1 &&
      updates.notes !== undefined;

    if (isOnlyNotes) {
      const { data, error } = await supabase.rpc(
        'update_student_notes',
        {
          student_id: id,
          new_notes: updates.notes
        }
      );

      if (error) throw error;

      // --- użytkownik i rola ---
      const { data: { user } } = await supabase.auth.getUser();

      const { data: userRole } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id || '')
        .single();

      if (user && updates.notes) {
        const student = await this.getStudent(id);

        // Instruktor → admini
        if (userRole?.role === 'instructor') {
          await notificationService.notifyAdminsAboutInstructorNote(
            id,
            `${student.firstName} ${student.lastName}`,
            updates.notes,
            user.id
          );
        }

        // Admin → instruktorzy
        if (
          userRole?.role === 'admin' &&
          student.instructorIds &&
          student.instructorIds.length > 0
        ) {
          await notificationService.notifyInstructorsAboutNote(
            student.instructorIds,
            id,
            `${student.firstName} ${student.lastName}`,
            updates.notes,
            user.id
          );
        }
      }

      return mapStudent(data);
    }

    /**
     * =====================================
     * PRZYPADEK 2 i 3: NORMALNY UPDATE
     * =====================================
     */

    const snakeCaseUpdates: any = {};

    if (updates.firstName !== undefined) snakeCaseUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) snakeCaseUpdates.last_name = updates.lastName;
    if (updates.phone !== undefined) snakeCaseUpdates.phone = updates.phone;
    if (updates.email !== undefined) snakeCaseUpdates.email = updates.email;
    if (updates.pesel !== undefined) snakeCaseUpdates.pesel = updates.pesel;
    if (updates.pkkNumber !== undefined) snakeCaseUpdates.pkk_number = updates.pkkNumber;
    if (updates.city !== undefined) snakeCaseUpdates.city = updates.city;
    if (updates.instructorIds !== undefined) snakeCaseUpdates.instructor_ids = updates.instructorIds;
    if (updates.coursePrice !== undefined) snakeCaseUpdates.course_price = updates.coursePrice;
    if (updates.coursePaid !== undefined) snakeCaseUpdates.course_paid = updates.coursePaid;
    if (updates.profileUpdated !== undefined) snakeCaseUpdates.profile_updated = updates.profileUpdated;
    if (updates.internalTheoryPassed !== undefined)
      snakeCaseUpdates.internal_theory_passed = updates.internalTheoryPassed;
    if (updates.internalPracticePassed !== undefined)
      snakeCaseUpdates.internal_practice_passed = updates.internalPracticePassed;
    if (updates.stateExamStatus !== undefined)
      snakeCaseUpdates.state_exam_status = updates.stateExamStatus;
    if (updates.stateExamAttempts !== undefined)
      snakeCaseUpdates.state_exam_attempts = updates.stateExamAttempts;
    if (updates.isSupplementaryCourse !== undefined)
      snakeCaseUpdates.is_supplementary_course = updates.isSupplementaryCourse;
    if (updates.car !== undefined) snakeCaseUpdates.car = updates.car;
    if (updates.inactive !== undefined) snakeCaseUpdates.inactive = updates.inactive;
    if (updates.totalHoursDriven !== undefined)
      snakeCaseUpdates.total_hours_driven = updates.totalHoursDriven;
    if (updates.courseStartDate !== undefined)
      snakeCaseUpdates.course_start_date = updates.courseStartDate;
    if (updates.notes !== undefined) snakeCaseUpdates.notes = updates.notes;
    if (updates.stateExamDate !== undefined)
      snakeCaseUpdates.state_exam_date = updates.stateExamDate;
    if (updates.stateExamTime !== undefined)
      snakeCaseUpdates.state_exam_time = updates.stateExamTime;
    if (updates.packageId !== undefined)
      snakeCaseUpdates.package_id = updates.packageId;
    if (updates.customCourseHours !== undefined)
      snakeCaseUpdates.custom_course_hours = updates.customCourseHours;
    if (updates.markProgressComplete !== undefined)
      snakeCaseUpdates.mark_progress_complete = updates.markProgressComplete;

    // Zapamiętujemy stan sprzed aktualizacji (tylko jeśli zmieniamy instruktorów)
    let beforeUpdate = null;
    if (updates.instructorIds !== undefined) {
      const { data } = await supabase
        .from('students')
        .select('instructor_ids, first_name, last_name')
        .eq('id', id)
        .single();
      beforeUpdate = data;
    }

    // --- właściwy update ---
    const { data, error } = await supabase
      .from('students')
      .update(snakeCaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Powiadomienia o nowych instruktorach
    if (updates.instructorIds && beforeUpdate) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const oldInstructorIds = beforeUpdate.instructor_ids || [];
        const newInstructorIds = updates.instructorIds.filter(
          newId => !oldInstructorIds.includes(newId)
        );

        for (const instructorId of newInstructorIds) {
          await notificationService.notifyInstructorAboutAssignment(
            instructorId,
            id,
            `${beforeUpdate.first_name} ${beforeUpdate.last_name}`,
            user.id
          );
        }
      }
    }

    return mapStudent(data);
  },


  async deleteStudent(id: string) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}