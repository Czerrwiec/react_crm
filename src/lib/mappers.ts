import type { Student, Payment, User, Lesson, Notification, CarReservation, Car } from '@/types'

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

export function mapUser(data: any): User {
    return {
        id: data.id,
        email: data.email,
        role: data.role,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone,
        active: data.active ?? true,
    }
}

export function mapLesson(data: any): Lesson {
    return {
        id: data.id,
        studentIds: data.student_ids || [],
        instructorId: data.instructor_id,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        duration: data.duration,
        status: data.status,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    }
}

export function mapNotification(data: any): Notification {
    return {
        id: data.id,
        userId: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedId: data.related_id,
        read: data.read,
        createdAt: data.created_at,
    }
}

export function mapCar(data: any): Car {
    return {
        id: data.id,
        name: data.name,
        year: data.year,
        inspectionDate: data.inspection_date,
        insuranceDate: data.insurance_date,
        active: data.active ?? true,
        color: data.color || '#3b82f6'
    }
}

export function mapCarReservation(data: any): CarReservation {
    return {
        id: data.id,
        carId: data.car_id,
        studentIds: data.student_ids || [],
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        notes: data.notes,
        createdAt: data.created_at,
        createdBy: data.created_by,
    }
}