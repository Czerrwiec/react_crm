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
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    pesel: string | null; // NOWE
    pkkNumber: string | null;
    city: string | null;
    instructorIds: string[];
    coursePrice: number;
    coursePaid: boolean;
    profileUpdated: boolean; // NOWE
    internalTheoryPassed: boolean; // NOWE (zastępuje internalExamPassed)
    internalPracticePassed: boolean; // NOWE
    stateExamStatus: 'allowed' | 'failed' | 'passed'; // NOWE
    stateExamDate?: string | null; // NOWE
    stateExamTime?: string | null; // NOWE
    stateExamAttempts: number; // NOWE
    isSupplementaryCourse: boolean;
    car: boolean;
    inactive: boolean;
    totalHoursDriven: number;
    courseStartDate: string | null;
    notes: string | null;
    packageId?: string | null; // NOWE
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

export interface NotificationSettings {
    lessonCreated: boolean
    lessonUpdated: boolean
    lessonCancelled: boolean
    paymentAdded: boolean
    studentAdded: boolean
}

export interface Car {
    id: string;
    name: string;
    year: number;
    registrationNumber: string | null;
    inspectionDate: string | null;
    insuranceDate: string | null;
    active: boolean;
    color: string;
}

export interface CarReservation {
    id: string
    carId: string
    studentIds: string[]
    date: string
    startTime: string
    endTime: string
    notes: string | null
    createdAt: string
    createdBy: string | null
}

export interface SchoolInfo {
    id: string
    nip: string | null
    name: string | null
    city: string | null
    street: string | null
    postalCode: string | null
    phone: string | null
    carReminderEmails: string[];
}

export interface InstructorHours {
    id: string;
    studentId: string;
    instructorId: string;
    hoursDriven: number;
}

export interface StudentWithInstructors extends Student {
    instructors: Array<{ id: string; firstName: string; lastName: string }>;
}

export interface Package {
    id: string;
    name: string;
    price: number;
    hours: number;
    description: string | null;
    includesCar: boolean; 
}