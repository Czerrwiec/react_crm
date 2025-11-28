// import { supabase } from '@/lib/supabase';
// import { mapInstructorHours } from '@/lib/mappers';

// export const instructorHoursService = {
//     async getHoursByStudent(studentId: string) {
//         const { data, error } = await supabase
//             .from('instructor_hours')
//             .select('*')
//             .eq('student_id', studentId);

//         if (error) throw error;
//         return data.map(mapInstructorHours);
//     },

//     async updateHours(studentId: string, instructorId: string, hours: number) {
//         const { data, error } = await supabase
//             .from('instructor_hours')
//             .upsert({
//                 student_id: studentId,
//                 instructor_id: instructorId,
//                 hours_driven: hours,
//             })
//             .select()
//             .single();

//         if (error) throw error;
//         return mapInstructorHours(data);
//     },

//     async incrementHours(studentId: string, instructorId: string, duration: number) {
//         // Pobierz aktualne godziny
//         const { data: existing } = await supabase
//             .from('instructor_hours')
//             .select('hours_driven')
//             .eq('student_id', studentId)
//             .eq('instructor_id', instructorId)
//             .single();

//         const currentHours = existing?.hours_driven || 0;
//         return this.updateHours(studentId, instructorId, currentHours + duration);
//     },
// };