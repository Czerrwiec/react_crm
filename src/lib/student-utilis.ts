// src/lib/student-utils.ts
import type { Student } from '@/types';

export const getStateExamDisplayStatus = (student: Student): string => {
    // Sprawdź warunki dopuszczenia
    const isAllowed =
        student.profileUpdated &&
        student.internalTheoryPassed &&
        student.internalPracticePassed;

    if (!isAllowed) {
        return 'Niedopuszczony';
    }

    switch (student.stateExamStatus) {
        case 'passed':
            return `Zdany (${student.stateExamAttempts}. próba)`;
        case 'failed':
            return `Niezdany (${student.stateExamAttempts} ${student.stateExamAttempts === 1 ? 'próba' : 'próby/prób'})`;
        default:
            return 'Dopuszczony';
    }
};

export const getStateExamStatusColor = (student: Student): string => {
    const isAllowed =
        student.profileUpdated &&
        student.internalTheoryPassed &&
        student.internalPracticePassed;

    if (!isAllowed) return 'text-gray-500';

    switch (student.stateExamStatus) {
        case 'passed':
            return 'text-green-600';
        case 'failed':
            return 'text-red-600';
        default:
            return 'text-blue-600';
    }
};