import { ref } from 'vue'
import { apiClient } from '~/utils/api'
import { useToast } from '~/composables/useToast'

interface DropdownOption {
  label: string
  value: string | number
}

/**
 * Composable for managing dropdown data across the application
 * Centralizes the loading of classes, sections, and other common dropdown options
 */
export const useDropdowns = () => {
  const { showToast } = useToast()
  
  // Reactive state
  const classOptions = ref<DropdownOption[]>([])
  const sectionOptions = ref<DropdownOption[]>([])
  const streamOptions = ref<DropdownOption[]>([])
  const subjectOptions = ref<DropdownOption[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Load all active classes
   */
  const loadClasses = async () => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiClient.classes.getAll({ 
        page: 1, 
        limit: 100, 
        is_active: 'true' 
      })
      
      const classes = response.data?.rows || response.data || []
      classOptions.value = classes.map((cls: any) => ({
        label: cls.name,
        value: cls.id
      }))
      
    } catch (err: any) {
      error.value = 'Failed to load classes'
      console.error('Error loading classes:', err)
      showToast({ type: 'error', message: 'Failed to load classes' })
    } finally {
      loading.value = false
    }
  }

  /**
   * Load sections for a specific class or all sections
   */
  const loadSections = async (classId?: string) => {
    try {
      loading.value = true
      error.value = null
      
      const params: any = { 
        page: 1, 
        limit: 100, 
        is_active: 'true' 
      }
      
      if (classId) {
        params.class_id = classId
      }
      
      const response = await apiClient.sections.getAll(params)
      
      const sections = response.data?.rows || response.data || []
      sectionOptions.value = sections.map((section: any) => ({
        label: section.name,
        value: section.id
      }))
      
    } catch (err: any) {
      error.value = 'Failed to load sections'
      console.error('Error loading sections:', err)
      showToast({ type: 'error', message: 'Failed to load sections' })
    } finally {
      loading.value = false
    }
  }

  /**
   * Load all active streams
   */
  const loadStreams = async () => {
    try {
      loading.value = true
      error.value = null
      
      const response = await apiClient.streams.getAll({ 
        page: 1, 
        limit: 100, 
        is_active: 'true' 
      })
      
      const streams = response.data?.rows || response.data || []
      streamOptions.value = streams.map((stream: any) => ({
        label: stream.name,
        value: stream.id
      }))
      
    } catch (err: any) {
      error.value = 'Failed to load streams'
      console.error('Error loading streams:', err)
      showToast({ type: 'error', message: 'Failed to load streams' })
    } finally {
      loading.value = false
    }
  }

  /**
   * Load subjects for a specific class/stream or all subjects
   */
  const loadSubjects = async (filters?: { classId?: string; streamId?: string }) => {
    try {
      loading.value = true
      error.value = null
      
      const params: any = { 
        page: 1, 
        limit: 100, 
        is_active: 'true' 
      }
      
      if (filters?.classId) {
        params.class_id = filters.classId
      }
      if (filters?.streamId) {
        params.stream_id = filters.streamId
      }
      
      // Note: Assuming subjects API exists, adjust endpoint as needed
      const response = await apiClient.subjects?.getAll?.(params) || { data: [] }
      
      const subjects = response.data?.rows || response.data || []
      subjectOptions.value = subjects.map((subject: any) => ({
        label: subject.name,
        value: subject.id
      }))
      
    } catch (err: any) {
      error.value = 'Failed to load subjects'
      console.error('Error loading subjects:', err)
      showToast({ type: 'error', message: 'Failed to load subjects' })
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset all dropdown data
   */
  const resetDropdowns = () => {
    classOptions.value = []
    sectionOptions.value = []
    streamOptions.value = []
    subjectOptions.value = []
    error.value = null
  }

  /**
   * Load all common dropdowns at once
   */
  const loadAllDropdowns = async () => {
    await Promise.all([
      loadClasses(),
      loadStreams()
    ])
  }

  /**
   * Get class name by ID
   */
  const getClassName = (classId: string | number): string => {
    const cls = classOptions.value.find(c => c.value === classId)
    return cls?.label || 'Unknown Class'
  }

  /**
   * Get section name by ID
   */
  const getSectionName = (sectionId: string | number): string => {
    const section = sectionOptions.value.find(s => s.value === sectionId)
    return section?.label || 'Unknown Section'
  }

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
  }
}