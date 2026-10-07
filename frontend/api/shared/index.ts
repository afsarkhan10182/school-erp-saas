// Shared API - Main entry point
export { Auth } from './auth';
export { Dashboard } from './dashboard';
export { DynamicEntities, PublicAdmission, Portal } from './dynamic-entities';

// Re-export types
export type { LoginCredentials, ResetPasswordData } from './auth';
export type { DashboardParams } from './dashboard';
