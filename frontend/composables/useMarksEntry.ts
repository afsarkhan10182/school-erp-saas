import { ref } from 'vue';
import { marksEntryApi } from '~/api/academic/marks-entry';

export const useMarksEntry = () => {
  const loading = ref(false);
  const saving = ref(false);

  /**
   * Get students for marks entry
   */
  const getStudentsForMarksEntry = async (params: {
    exam_id: string;
    class_id: string;
    section_id?: string;
    school_id?: string;
    branch_id?: string;
  }) => {
    try {
      loading.value = true;
      return await marksEntryApi.getStudents(params);
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Save marks for multiple students
   */
  const saveMarks = async (data: {
    exam_id: string;
    marks_data: Array<{
      student_id: string;
      theory_marks_obtained?: number;
      practical_marks_obtained?: number;
      viva_marks_obtained?: number;
      assignment_marks_obtained?: number;
      is_absent?: boolean;
    }>;
  }) => {
    try {
      saving.value = true;
      return await marksEntryApi.saveMarks(data);
    } catch (error) {
      throw error;
    } finally {
      saving.value = false;
    }
  };

  /**
   * Get marks entry summary
   */
  const getMarksEntrySummary = async (params: {
    exam_id: string;
    class_id: string;
    section_id?: string;
    school_id?: string;
    branch_id?: string;
  }) => {
    try {
      return await marksEntryApi.getSummary(params);
    } catch (error) {
      throw error;
    }
  };

  return {
    loading,
    saving,
    getStudentsForMarksEntry,
    saveMarks,
    getMarksEntrySummary
  };
};
