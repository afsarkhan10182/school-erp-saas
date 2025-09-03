import { createApiInstance } from '~/utils/api';

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
    const api = createApiInstance();
    const response = await api.post('/attendance-notifications/absence', data);
    return response.data;
  },

  sendLateArrivalNotifications: async (data: LateArrivalNotificationData) => {
    const api = createApiInstance();
    const response = await api.post('/attendance-notifications/late-arrival', data);
    return response.data;
  },

  sendAttendanceSummary: async (data: AttendanceSummaryData) => {
    const api = createApiInstance();
    const response = await api.post('/attendance-notifications/summary', data);
    return response.data;
  },

  getNotificationSettings: async () => {
    const api = createApiInstance();
    const response = await api.get('/attendance-notifications/settings');
    return response.data;
  }
};
