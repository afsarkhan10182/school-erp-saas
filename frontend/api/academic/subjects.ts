import { createApiInstance } from '~/utils/api'

export interface Subject {
  id: string
  name: string
  code: string
  description?: string
  category: 'core' | 'elective' | 'extra_curricular' | 'language' | 'science' | 'arts' | 'commerce'
  credit_hours: number
  is_active: boolean
  class_id?: string
  school_id: string
  branch_id?: string
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
  class?: {
    id: string
    name: string
    code: string
  }
  school?: {
    id: string
    name: string
    code: string
  }
  branch?: {
    id: string
    name: string
    code: string
  }
  createdBy?: {
    id: string
    first_name: string
    last_name: string
  }
  updatedBy?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface SubjectFilters {
  page?: number
  limit?: number
  search?: string
  category?: string
  is_active?: string
  class_id?: string
  school_id?: string
  branch_id?: string
  sort_by?: string
  sort_order?: string
}

export interface SubjectStats {
  total: number
  active: number
  inactive: number
  byCategory: Array<{
    category: string
    count: number
  }>
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: {
    subjects: T[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export const subjectApi = {
  // Create subject
  create: async (data: Partial<Subject>) => {
    const api = createApiInstance()
    const response = await api.post<ApiResponse<Subject>>('/subjects', data)
    return response.data
  },

  // Get all subjects with pagination and filtering
  getAll: async (filters: SubjectFilters = {}) => {
    const api = createApiInstance()
    const response = await api.get<PaginatedResponse<Subject>>('/subjects', { params: filters })
    return response.data
  },

  // Get subject by ID
  getById: async (id: string) => {
    const api = createApiInstance()
    const response = await api.get<ApiResponse<Subject>>(`/subjects/${id}`)
    return response.data
  },

  // Update subject
  update: async (id: string, data: Partial<Subject>) => {
    const api = createApiInstance()
    const response = await api.put<ApiResponse<Subject>>(`/subjects/${id}`, data)
    return response.data
  },

  // Delete subject
  delete: async (id: string) => {
    const api = createApiInstance()
    const response = await api.delete<ApiResponse<{ message: string }>>(`/subjects/${id}`)
    return response.data
  },

  // Get subjects for dropdown
  getForDropdown: async (filters?: { class_id?: string; branch_id?: string; category?: string }) => {
    const api = createApiInstance()
    const response = await api.get<ApiResponse<Subject[]>>('/subjects/dropdown', { params: filters })
    return response.data
  },

  // Get subject statistics
  getStats: async () => {
    const api = createApiInstance()
    const response = await api.get<ApiResponse<{ stats: SubjectStats }>>('/subjects/stats')
    return response.data
  }
}
