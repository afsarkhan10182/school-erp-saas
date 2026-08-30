// Shared API - Main entry point
export { Auth } from './auth';
export { Dashboard } from './dashboard';
export { SchoolOps, PublicAdmission, Portal } from './school-ops';

// Re-export types
export type { LoginCredentials, ResetPasswordData } from './auth';
export type { DashboardParams } from './dashboard';
