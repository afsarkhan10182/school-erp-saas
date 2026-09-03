import { apiCall } from '~/utils/api';

export interface FeeAllocationParams {
  class_id: string;
  section_id?: string;
  fee_group_id: string;
  branch_id?: string;
}

export interface SaveAllocationPayload {
  class_id: string;
  section_id?: string;
  fee_group_id: string;
  student_ids: string[];
}

export const FeeAllocationAPI = {
  getStudents: (params: FeeAllocationParams) =>
    apiCall('get', '/fee-allocation/students', { params }),

  saveAllocation: (payload: SaveAllocationPayload) =>
    apiCall('post', '/fee-allocation/save', payload)
};

