import { createApiInstance, apiCall } from '~/utils/api';

export interface ExamPublication {
  id: string;
  exam_id: string;
  publish_status: boolean;
  result_status: boolean;
  published_at?: string;
  published_by?: string;
  school_id: string;
  branch_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PublicationFilters {
  exam_id?: string;
  class_id?: string;
  school_id?: string;
  branch_id?: string;
  publish_status?: boolean;
  result_status?: boolean;
}

export interface PublishExamData {
  exam_id: string;
  publish_status: boolean;
  result_status: boolean;
  school_id?: string;
  branch_id?: string;
  notify_students?: boolean;
  notify_parents?: boolean;
  notification_message?: string;
}

export interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  school_id?: string;
  branch_id?: string;
  email_template?: string;
  sms_template?: string;
  notification_message?: string;
}

export const examPublicationApi = {
  // Get publication status for exams
  getPublicationStatus: async (filters: PublicationFilters) => {
    return apiCall('get', '/exam-publication/status', { params: filters });
  },

  // Publish/unpublish exam results
  publishExam: async (data: PublishExamData) => {
    return apiCall('post', '/exam-publication/publish', data);
  },

  // Bulk publish multiple exams
  bulkPublish: async (data: {
    exam_ids: string[];
    publish_status: boolean;
    result_status: boolean;
    school_id?: string;
    branch_id?: string;
  }) => {
    return apiCall('post', '/exam-publication/bulk-publish', data);
  },

  // Send notifications for published results
  sendNotifications: async (examId: string, settings: NotificationSettings) => {
    return apiCall('post', `/exam-publication/${examId}/notify`, settings);
  },

  // Get notification history
  getNotificationHistory: async (examId: string) => {
    return apiCall('get', `/exam-publication/${examId}/notifications`);
  },

  // Get publication statistics
  getStats: async (filters?: PublicationFilters) => {
    return apiCall('get', '/exam-publication/stats', { params: filters });
  }
};
