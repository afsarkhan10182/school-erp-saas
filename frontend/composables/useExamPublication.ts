import { ref } from 'vue';
import { examPublicationApi } from '~/api/academic/exam-publication';

export const useExamPublication = () => {
  const loading = ref(false);
  const publishing = ref(false);
  const sendingNotifications = ref(false);

  /**
   * Get publication status for exams
   */
  const getPublicationStatus = async (filters: {
    exam_id?: string;
    class_id?: string;
    school_id?: string;
    branch_id?: string;
    publish_status?: boolean;
    result_status?: boolean;
  }) => {
    try {
      loading.value = true;
      return await examPublicationApi.getPublicationStatus(filters);
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Publish/unpublish exam results
   */
  const publishExam = async (data: {
    exam_id: string;
    publish_status: boolean;
    result_status: boolean;
    school_id?: string;
    branch_id?: string;
    notify_students?: boolean;
    notify_parents?: boolean;
    notification_message?: string;
  }) => {
    try {
      publishing.value = true;
      return await examPublicationApi.publishExam(data);
    } catch (error) {
      throw error;
    } finally {
      publishing.value = false;
    }
  };

  /**
   * Bulk publish multiple exams
   */
  const bulkPublish = async (data: {
    exam_ids: string[];
    publish_status: boolean;
    result_status: boolean;
    school_id?: string;
    branch_id?: string;
  }) => {
    try {
      publishing.value = true;
      return await examPublicationApi.bulkPublish(data);
    } catch (error) {
      throw error;
    } finally {
      publishing.value = false;
    }
  };

  /**
   * Send notifications for published results
   */
  const sendNotifications = async (
    examId: string,
    settings: {
      email_enabled: boolean;
      sms_enabled: boolean;
      school_id?: string;
      branch_id?: string;
      email_template?: string;
      sms_template?: string;
      notification_message?: string;
    }
  ) => {
    try {
      sendingNotifications.value = true;
      return await examPublicationApi.sendNotifications(examId, settings);
    } catch (error) {
      throw error;
    } finally {
      sendingNotifications.value = false;
    }
  };

  /**
   * Get notification history
   */
  const getNotificationHistory = async (examId: string) => {
    try {
      return await examPublicationApi.getNotificationHistory(examId);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get publication statistics
   */
  const getStats = async (filters?: {
    exam_id?: string;
    class_id?: string;
    school_id?: string;
    branch_id?: string;
    publish_status?: boolean;
    result_status?: boolean;
  }) => {
    try {
      return await examPublicationApi.getStats(filters);
    } catch (error) {
      throw error;
    }
  };

  return {
    loading,
    publishing,
    sendingNotifications,
    getPublicationStatus,
    publishExam,
    bulkPublish,
    sendNotifications,
    getNotificationHistory,
    getStats
  };
};
