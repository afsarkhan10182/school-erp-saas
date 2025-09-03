// Academic API - Main entry point
export { Classes } from './classes';
export { Sections } from './sections';
export { Streams } from './streams';
export { subjectApi as Subjects } from './subjects';
export { AcademicYears } from './academic-years';
export { AcademicCalendar } from './academic-calendar';
export { Academic } from './academic';
export { examTypeApi as ExamTypes } from './exam-types';
export { examApi as Exams } from './exams';

// Re-export types
export type { ClassParams, ClassData } from './classes';
export type { SectionParams, SectionData } from './sections';
export type { StreamParams, StreamData } from './streams';
export type { Subject, SubjectFilters, SubjectStats } from './subjects';
export type { AcademicYearParams, AcademicYearData } from './academic-years';
export type { CalendarEntry, BulkCalendarData } from './academic-calendar';
export type { AcademicParams } from './academic';
export type { ExamType, ExamTypeFilters } from './exam-types';
export type { Exam, ExamResult, ExamFilters, ExamResultData } from './exams';
