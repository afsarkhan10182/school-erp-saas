// User types
export interface User {
  id: string; // Changed from _id to id
  first_name: string; // Changed from firstName to first_name
  last_name: string; // Changed from lastName to last_name
  email: string;
  phone?: string;
  role: UserRole;
  school_id?: string; // Changed from schoolId to school_id
  branch_id?: string; // Changed from branchId to branch_id
  school_name?: string; // Added for convenience
  branch_name?: string; // Added for convenience
  isActive: boolean;
  profile_image?: string; // Changed from profilePicture to profile_image
  status?: string;
  created_at?: string; // Changed from createdAt to created_at
  updated_at?: string; // Changed from updatedAt to updated_at
}

export type UserRole = 
  | 'super_admin'
  | 'school_admin'
  | 'branch_admin'
  | 'teacher'
  | 'student'
  | 'parent'
  | 'accountant'
  | 'hr'
  | 'receptionist'
  | 'librarian'
  | 'transport_manager'
  | 'alumni';

// School types
export interface School {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  website?: string;
  logo?: string;
  isActive: boolean;
  subscriptionPlan?: string;
  maxStudents?: number;
  maxBranches?: number;
  createdAt: string;
  updatedAt: string;
}

// Branch types
export interface Branch {
  _id: string;
  name: string;
  schoolId: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastAuthCheck: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Form types
export interface CreateUserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  schoolId?: string;
  branchId?: string;
}

export interface UpdateUserForm {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  schoolId?: string;
  branchId?: string;
  isActive?: boolean;
}

export interface CreateSchoolForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  website?: string;
  subscriptionPlan?: string;
  maxStudents?: number;
  maxBranches?: number;
}

export interface CreateBranchForm {
  name: string;
  schoolId: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
}

// Navigation types
export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  current: boolean;
  roles?: UserRole[];
}

// Dashboard stats
export interface DashboardStats {
  totalSchools?: number;
  totalBranches?: number;
  totalUsers?: number;
  totalStudents?: number;
  totalTeachers?: number;
  recentUsers?: User[];
  recentSchools?: School[];
} 

export interface PreviousExamDetail {
  exam_name: string; // e.g., "SSC", "FYJC", "SYJC"
  institution: string; // Institution last attended
  board_university: string; // Board/University
  month_year: string; // Month & Year
  exam_seat_number: string; // Exam Seat No.
  class_obtained: string; // Class Obtained
  attempts: number; // No. of Attempts
  percentage: number; // Percent
}

export interface Student {
  id: string;
  admission_number: string;
  roll_number?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  aadhaar_number?: string; // Student's Aadhaar number
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  blood_group?: string;
  religion?: string;
  caste?: string;
  category?: 'general' | 'obc' | 'sc' | 'st' | 'other';
  nationality?: string;
  mother_tongue?: string;
  email?: string;
  phone?: string;
  emergency_contact?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  admission_date: string;
  admission_class: string;
  current_class: string;
  section?: string;
  class_id?: string;
  section_id?: string;
  academic_year: string;
  // Junior College specific fields
  admission_sought_in?: 'arts' | 'commerce' | 'science'; // Stream selection
  previous_exam_details?: PreviousExamDetail[]; // Previous exam details
  status: 'active' | 'inactive' | 'transferred' | 'graduated' | 'dropped';
  photo?: string;
  documents?: any;
  medical_info?: any;
  notes?: string;
  school_id: string;
  branch_id?: string;
  user_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
} 