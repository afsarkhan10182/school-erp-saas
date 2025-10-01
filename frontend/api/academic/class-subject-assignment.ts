import { apiCall } from '~/utils/api';

export interface ClassSubjectAssignment {
  id: string;
  class_id: string;
  subject_id: string;
  section_id?: string;
  stream_id?: string;
  academic_year: string;
  is_active: boolean;
  school_id: string;
  branch_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  class?: {
    id: string;
    name: string;
    code: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
    category: string;
  };
  section?: {
    id: string;
    name: string;
    capacity: number;
  };
  stream?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface CreateAssignmentData {
  class_id: string;
  subject_id: string;
  section_id?: string;
  stream_id?: string;
  academic_year: string;
}

export interface BulkAssignmentData {
  assignments: CreateAssignmentData[];
}

export interface AssignmentResponse {
  assignment: ClassSubjectAssignment;
}

export interface AssignmentsResponse {
  assignments: ClassSubjectAssignment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BulkAssignmentResponse {
  successful: number;
  failed: number;
  results: Array<{
    success: boolean;
    assignment: ClassSubjectAssignment;
    class_id: string;
    subject_id: string;
  }>;
  errors: Array<{
    assignment: CreateAssignmentData;
    error: string;
  }>;
}

class ClassSubjectAssignmentAPI {
  /**
   * Get all class-subject assignments
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    class_id?: string;
    subject_id?: string;
    section_id?: string;
    stream_id?: string;
    academic_year?: string;
    branch_id?: string;
    search?: string;
  }): Promise<AssignmentsResponse> {
    return apiCall('get', '/class-subject-assignments', { params });
  }

  /**
   * Get assignment by ID
   */
  async getById(id: string): Promise<AssignmentResponse> {
    return apiCall('get', `/class-subject-assignments/${id}`);
  }

  /**
   * Create new assignment
   */
  async create(data: CreateAssignmentData): Promise<AssignmentResponse> {
    return apiCall('post', '/class-subject-assignments', data);
  }

  /**
   * Bulk create assignments
   */
  async bulkCreate(data: BulkAssignmentData): Promise<BulkAssignmentResponse> {
    return apiCall('post', '/class-subject-assignments/bulk', data);
  }

  /**
   * Delete assignment
   */
  async delete(id: string): Promise<void> {
    return apiCall('delete', `/class-subject-assignments/${id}`);
  }
}

export const classSubjectAssignmentApi = new ClassSubjectAssignmentAPI();
