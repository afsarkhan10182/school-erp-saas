export interface ScheduleConflict {
  type: 'hall_conflict' | 'time_conflict' | 'teacher_conflict';
  message: string;
  conflictingSchedules: any[];
  severity: 'warning' | 'error';
}

export interface ScheduleItem {
  id?: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  exam_hall_id?: string;
  invigilator_id?: string;
  subject_id?: string;
  class_id?: string;
  section_id?: string;
}

export class ScheduleConflictDetector {
  private existingSchedules: ScheduleItem[] = [];

  constructor(existingSchedules: ScheduleItem[] = []) {
    this.existingSchedules = existingSchedules;
  }

  /**
   * Check for conflicts in a new schedule
   */
  checkConflicts(newSchedule: ScheduleItem): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    // Check hall conflicts
    if (newSchedule.exam_hall_id) {
      const hallConflicts = this.checkHallConflicts(newSchedule);
      conflicts.push(...hallConflicts);
    }

    // Check time conflicts
    const timeConflicts = this.checkTimeConflicts(newSchedule);
    conflicts.push(...timeConflicts);

    // Check teacher conflicts
    if (newSchedule.invigilator_id) {
      const teacherConflicts = this.checkTeacherConflicts(newSchedule);
      conflicts.push(...teacherConflicts);
    }

    return conflicts;
  }

  /**
   * Check for conflicts in multiple schedules
   */
  checkBulkConflicts(schedules: ScheduleItem[]): ScheduleConflict[] {
    const allConflicts: ScheduleConflict[] = [];

    // Check conflicts with existing schedules
    schedules.forEach(schedule => {
      const conflicts = this.checkConflicts(schedule);
      allConflicts.push(...conflicts);
    });

    // Check conflicts between new schedules
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const conflicts = this.checkSchedulePairConflicts(schedules[i], schedules[j]);
        allConflicts.push(...conflicts);
      }
    }

    return allConflicts;
  }

  /**
   * Check for hall conflicts
   */
  private checkHallConflicts(schedule: ScheduleItem): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    const scheduleStart = this.parseDateTime(schedule.exam_date, schedule.start_time);
    const scheduleEnd = this.parseDateTime(schedule.exam_date, schedule.end_time);

    const conflictingSchedules = this.existingSchedules.filter(existing => {
      if (existing.exam_hall_id !== schedule.exam_hall_id) return false;
      if (existing.exam_date !== schedule.exam_date) return false;

      const existingStart = this.parseDateTime(existing.exam_date, existing.start_time);
      const existingEnd = this.parseDateTime(existing.exam_date, existing.end_time);

      return this.timeRangesOverlap(scheduleStart, scheduleEnd, existingStart, existingEnd);
    });

    if (conflictingSchedules.length > 0) {
      conflicts.push({
        type: 'hall_conflict',
        message: `Hall is already booked during this time slot`,
        conflictingSchedules,
        severity: 'error'
      });
    }

    return conflicts;
  }

  /**
   * Check for time conflicts (same class/section having multiple exams at same time)
   */
  private checkTimeConflicts(schedule: ScheduleItem): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    const scheduleStart = this.parseDateTime(schedule.exam_date, schedule.start_time);
    const scheduleEnd = this.parseDateTime(schedule.exam_date, schedule.end_time);

    const conflictingSchedules = this.existingSchedules.filter(existing => {
      if (existing.exam_date !== schedule.exam_date) return false;
      if (existing.class_id !== schedule.class_id) return false;
      if (existing.section_id !== schedule.section_id) return false;

      const existingStart = this.parseDateTime(existing.exam_date, existing.start_time);
      const existingEnd = this.parseDateTime(existing.exam_date, existing.end_time);

      return this.timeRangesOverlap(scheduleStart, scheduleEnd, existingStart, existingEnd);
    });

    if (conflictingSchedules.length > 0) {
      conflicts.push({
        type: 'time_conflict',
        message: `Class/Section already has an exam scheduled during this time`,
        conflictingSchedules,
        severity: 'error'
      });
    }

    return conflicts;
  }

  /**
   * Check for teacher conflicts
   */
  private checkTeacherConflicts(schedule: ScheduleItem): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    const scheduleStart = this.parseDateTime(schedule.exam_date, schedule.start_time);
    const scheduleEnd = this.parseDateTime(schedule.exam_date, schedule.end_time);

    const conflictingSchedules = this.existingSchedules.filter(existing => {
      if (existing.invigilator_id !== schedule.invigilator_id) return false;
      if (existing.exam_date !== schedule.exam_date) return false;

      const existingStart = this.parseDateTime(existing.exam_date, existing.start_time);
      const existingEnd = this.parseDateTime(existing.exam_date, existing.end_time);

      return this.timeRangesOverlap(scheduleStart, scheduleEnd, existingStart, existingEnd);
    });

    if (conflictingSchedules.length > 0) {
      conflicts.push({
        type: 'teacher_conflict',
        message: `Teacher is already assigned to another exam during this time`,
        conflictingSchedules,
        severity: 'warning'
      });
    }

    return conflicts;
  }

  /**
   * Check for conflicts between two schedules
   */
  private checkSchedulePairConflicts(
    schedule1: ScheduleItem,
    schedule2: ScheduleItem
  ): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    // Check if same hall is used at overlapping times
    if (
      schedule1.exam_hall_id &&
      schedule2.exam_hall_id &&
      schedule1.exam_hall_id === schedule2.exam_hall_id &&
      schedule1.exam_date === schedule2.exam_date
    ) {
      const start1 = this.parseDateTime(schedule1.exam_date, schedule1.start_time);
      const end1 = this.parseDateTime(schedule1.exam_date, schedule1.end_time);
      const start2 = this.parseDateTime(schedule2.exam_date, schedule2.start_time);
      const end2 = this.parseDateTime(schedule2.exam_date, schedule2.end_time);

      if (this.timeRangesOverlap(start1, end1, start2, end2)) {
        conflicts.push({
          type: 'hall_conflict',
          message: `Multiple schedules using same hall at overlapping times`,
          conflictingSchedules: [schedule1, schedule2],
          severity: 'error'
        });
      }
    }

    // Check if same teacher is assigned to overlapping times
    if (
      schedule1.invigilator_id &&
      schedule2.invigilator_id &&
      schedule1.invigilator_id === schedule2.invigilator_id &&
      schedule1.exam_date === schedule2.exam_date
    ) {
      const start1 = this.parseDateTime(schedule1.exam_date, schedule1.start_time);
      const end1 = this.parseDateTime(schedule1.exam_date, schedule1.end_time);
      const start2 = this.parseDateTime(schedule2.exam_date, schedule2.start_time);
      const end2 = this.parseDateTime(schedule2.exam_date, schedule2.end_time);

      if (this.timeRangesOverlap(start1, end1, start2, end2)) {
        conflicts.push({
          type: 'teacher_conflict',
          message: `Same teacher assigned to multiple overlapping schedules`,
          conflictingSchedules: [schedule1, schedule2],
          severity: 'warning'
        });
      }
    }

    return conflicts;
  }

  /**
   * Parse date and time into a Date object
   */
  private parseDateTime(date: string, time: string): Date {
    return new Date(`${date}T${time}`);
  }

  /**
   * Check if two time ranges overlap
   */
  private timeRangesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Get conflict summary
   */
  getConflictSummary(conflicts: ScheduleConflict[]): {
    total: number;
    errors: number;
    warnings: number;
    byType: Record<string, number>;
  } {
    const summary = {
      total: conflicts.length,
      errors: 0,
      warnings: 0,
      byType: {} as Record<string, number>
    };

    conflicts.forEach(conflict => {
      if (conflict.severity === 'error') summary.errors++;
      if (conflict.severity === 'warning') summary.warnings++;

      summary.byType[conflict.type] = (summary.byType[conflict.type] || 0) + 1;
    });

    return summary;
  }

  /**
   * Update existing schedules
   */
  updateExistingSchedules(schedules: ScheduleItem[]): void {
    this.existingSchedules = schedules;
  }
}

/**
 * Utility function to check schedule conflicts
 */
export function checkScheduleConflicts(
  newSchedules: ScheduleItem[],
  existingSchedules: ScheduleItem[] = []
): ScheduleConflict[] {
  const detector = new ScheduleConflictDetector(existingSchedules);
  return detector.checkBulkConflicts(newSchedules);
}

/**
 * Utility function to validate schedule data
 */
export function validateScheduleData(schedule: ScheduleItem): string[] {
  const errors: string[] = [];

  if (!schedule.exam_date) {
    errors.push('Exam date is required');
  }

  if (!schedule.start_time) {
    errors.push('Start time is required');
  }

  if (!schedule.end_time) {
    errors.push('End time is required');
  }

  if (schedule.start_time && schedule.end_time) {
    const start = new Date(`2000-01-01T${schedule.start_time}`);
    const end = new Date(`2000-01-01T${schedule.end_time}`);

    if (start >= end) {
      errors.push('End time must be after start time');
    }
  }

  if (schedule.exam_date) {
    const examDate = new Date(schedule.exam_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (examDate < today) {
      errors.push('Exam date cannot be in the past');
    }
  }

  return errors;
}
