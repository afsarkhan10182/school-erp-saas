import { ref, readonly } from 'vue';
import { Classes } from '~/api/academic/classes';
import { Sections } from '~/api/academic/sections';
import { Streams } from '~/api/academic/streams';
import { useToast } from '~/composables/useToast';
import { subjectApi } from '~/api/academic/subjects';

interface DropdownOption {
  label: string;
  value: string | number;
}

/**
 * Composable for managing dropdown data across the application
 * Centralizes the loading of classes, sections, and other common dropdown options
 */
export const useDropdowns = () => {
  const { showToast } = useToast();

  // Reactive state
  const classOptions = ref<DropdownOption[]>([]);
  const sectionOptions = ref<DropdownOption[]>([]);
  const streamOptions = ref<DropdownOption[]>([]);
  const subjectOptions = ref<DropdownOption[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Load all active classes
   */
  const loadClasses = async () => {
    try {
      loading.value = true;
      error.value = null;

      const response = await Classes.getAll({
        page: 1,
        limit: 100,
        is_active: 'true'
      });

      const classes = response.data?.rows || response.data || [];
      classOptions.value = classes.map((cls: any) => ({
        label: cls.name,
        value: cls.id
      }));
    } catch (err: any) {
      error.value = 'Failed to load classes';
      console.error('Error loading classes:', err);
      showToast('Failed to load classes', 'error');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Load sections for a specific class or all sections
   */
  const loadSections = async (classId?: string) => {
    try {
      loading.value = true;
      error.value = null;

      const params: any = {
        page: 1,
        limit: 100,
        is_active: 'true'
      };

      if (classId) {
        params.class_id = classId;
      }

      const response = await Sections.getAll(params);

      const sections = response.data?.rows || response.data || [];
      sectionOptions.value = sections.map((section: any) => ({
        label: section.name,
        value: section.id
      }));
    } catch (err: any) {
      error.value = 'Failed to load sections';
      console.error('Error loading sections:', err);
      showToast('Failed to load sections', 'error');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Load all active streams
   */
  const loadStreams = async () => {
    try {
      loading.value = true;
      error.value = null;

      const response = await Streams.getAll({
        page: 1,
        limit: 100,
        is_active: 'true'
      });

      const streams = response.data?.rows || response.data || [];
      streamOptions.value = streams.map((stream: any) => ({
        label: stream.name,
        value: stream.id
      }));
    } catch (err: any) {
      error.value = 'Failed to load streams';
      console.error('Error loading streams:', err);
      showToast('Failed to load streams', 'error');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Load subjects for a specific class/stream or all subjects
   */
  const loadSubjects = async (filters?: {
    classId?: string;
    streamId?: string;
    category?: string;
  }) => {
    try {
      loading.value = true;
      error.value = null;

      const params: any = {};
      if (filters?.classId) params.class_id = filters.classId;
      if (filters?.category) params.category = filters.category;

      const response = await subjectApi.getForDropdown(params);
      subjectOptions.value = response.data.subjects.map((subject: any) => ({
        value: subject.id,
        label: `${subject.name} (${subject.code})`,
        category: subject.category,
        credit_hours: subject.credit_hours
      }));
    } catch (err: any) {
      error.value = 'Failed to load subjects';
      console.error('Error loading subjects:', err);
      showToast('Failed to load subjects', 'error');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Reset all dropdown data
   */
  const resetDropdowns = () => {
    classOptions.value = [];
    sectionOptions.value = [];
    streamOptions.value = [];
    subjectOptions.value = [];
    error.value = null;
  };

  /**
   * Load all common dropdowns at once
   */
  const loadAllDropdowns = async () => {
    await Promise.all([loadClasses(), loadStreams()]);
  };

  /**
   * Get class name by ID
   */
  const getClassName = (classId: string | number): string => {
    const cls = classOptions.value.find(c => c.value === classId);
    return cls?.label || 'Unknown Class';
  };

  /**
   * Get section name by ID
   */
  const getSectionName = (sectionId: string | number): string => {
    const section = sectionOptions.value.find(s => s.value === sectionId);
    return section?.label || 'Unknown Section';
  };

  return {
    // State
    classOptions: readonly(classOptions),
    sectionOptions: readonly(sectionOptions),
    streamOptions: readonly(streamOptions),
    subjectOptions: readonly(subjectOptions),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    loadClasses,
    loadSections,
    loadStreams,
    loadSubjects,
    loadAllDropdowns,
    resetDropdowns,

    // Utilities
    getClassName,
    getSectionName
  };
};
