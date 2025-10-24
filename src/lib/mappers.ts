import type { Student, Payment } from '@/types'

export function mapStudent(data: any): Student {
    return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone,
        email: data.email,
        pkkNumber: data.pkk_number,
        city: data.city,
        instructorId: data.instructor_id,
        coursePrice: data.course_price,
        coursePaid: data.course_paid,
        theoryPassed: data.theory_passed,
        internalExamPassed: data.internal_exam_passed,
        isSupplementaryCourse: data.is_supplementary_course,
        car: data.car,
        active: data.active,
        totalHoursDriven: data.total_hours_driven,
        courseStartDate: data.course_start_date,
        notes: data.notes,
    }
}

export function mapStudentWithInstructor(data: any) {
    return {
        ...mapStudent(data),
        instructor: data.instructor ? {
            firstName: data.instructor.first_name,
            lastName: data.instructor.last_name,
        } : undefined,
    }
}

export function mapPayment(data: any): Payment {
    return {
        id: data.id,
        studentId: data.student_id,
        amount: data.amount,
        type: data.type,
        method: data.method,
        createdAt: data.created_at,
        createdBy: data.created_by,
        updatedBy: data.updated_by,
        updatedAt: data.updated_at,
    }
}