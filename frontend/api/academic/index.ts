// Academic API - Main entry point
export { Classes } from './classes';
export { Sections } from './sections';
export { Streams } from './streams';
export { subjectApi as Subjects } from './subjects';
export { AcademicYears } from './academic-years';
export { AcademicCalendar } from './academic-calendar';
export { Academic } from './academic';
export { examApi as Exams } from './exams';
export { subjectTeacherApi as SubjectTeachers } from './subject-teachers';

// Re-export types
export type { ClassParams, ClassData } from './classes';
export type { SectionParams, SectionData } from './sections';
export type { StreamParams, StreamData } from './streams';
export type { Subject, SubjectFilters, SubjectStats } from './subjects';
export type { AcademicYearParams, AcademicYearData } from './academic-years';
export type {
  AcademicCalendarEvent,
  AcademicCalendarFilters,
  CreateCalendarEventData,
  UpdateCalendarEventData
} from './academic-calendar';
export type { AcademicParams } from './academic';
export type { Exam, ExamResult, ExamFilters, ExamResultData } from './exams';
