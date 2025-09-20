import { apiCall } from '~/utils/api';

export interface AbsenceNotificationData {
  absentStudents: Array<{ student_id: string; remarks?: string }>;
  sessionData: {
    date: string;
    class_id: string;
    section_id?: string;
    attendance_type?: 'daily' | 'period';
    period_number?: number;
  };
}

export interface LateArrivalNotificationData {
  lateStudents: Array<{ student_id: string; arrival_time?: string; remarks?: string }>;
  sessionData: {
    date: string;
    class_id: string;
    section_id?: string;
    attendance_type?: 'daily' | 'period';
    period_number?: number;
  };
}

export interface AttendanceSummaryData {
  classData: {
    totalStudents?: number;
    presentCount?: number;
    absentCount?: number;
    lateCount?: number;
    attendancePercentage?: number;
    className?: string;
    sectionName?: string;
  };
  sessionData: {
    date: string;
    class_id: string;
    section_id?: string;
    attendance_type?: 'daily' | 'period';
    period_number?: number;
  };
}

export const AttendanceNotifications = {
  sendAbsenceNotifications: async (data: AbsenceNotificationData) => {
    return apiCall('post', '/attendance-notifications/absence', data);
  },

  sendLateArrivalNotifications: async (data: LateArrivalNotificationData) => {
    return apiCall('post', '/attendance-notifications/late-arrival', data);
  },

  sendAttendanceSummary: async (data: AttendanceSummaryData) => {
    return apiCall('post', '/attendance-notifications/summary', data);
  },

  getNotificationSettings: async () => {
    return apiCall('get', '/attendance-notifications/settings');
  }
};
