// User types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  schoolId?: string;
  branchId?: string;
  isActive: boolean;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
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