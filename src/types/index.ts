export type UserRole = 'admin' | 'instructor'

export interface User {
    id: string
    email: string
    role: UserRole
    firstName: string | null
    lastName: string | null
    phone: string | null
    active: boolean
}

export interface Student {
    id: string
    firstName: string
    lastName: string
    phone: string | null
    email: string | null
    pkkNumber: string | null
    city: string | null
    instructorId: string | null
    coursePrice: number
    coursePaid: boolean
    theoryPassed: boolean
    internalExamPassed: boolean
    isSupplementaryCourse: boolean
    car: boolean
    active: boolean
    totalHoursDriven: number
    courseStartDate: string | null
    notes: string | null
}

export interface Lesson {
    id: string
    studentIds: string[]
    instructorId: string
    date: string
    startTime: string
    endTime: string
    duration: number
    status: 'scheduled' | 'completed' | 'cancelled'
    notes: string | null
    createdAt: string
    updatedAt: string | null
}

export interface Payment {
    id: string
    studentId: string
    amount: number
    type: 'course' | 'extra_lessons'
    method: 'cash' | 'card' | 'transfer'
    createdAt: string
    createdBy: string | null
    updatedBy: string | null
    updatedAt: string | null
}

export interface Notification {
    id: string
    userId: string
    type: string
    title: string
    message: string
    relatedId: string | null
    read: boolean
    createdAt: string
}