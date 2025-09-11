// Administration API - Main entry point
export { Schools } from './schools';
export { Branches } from './branches';
export { Users } from './users';
export { Saas } from './saas';
export { Config } from './config';
export { Settings } from './settings';

// Re-export types
export type { SchoolParams, SchoolData } from './schools';
export type { BranchParams, BranchData } from './branches';
export type { UserParams, UserData, ProfileData, PasswordData } from './users';
export type { SaasParams } from './saas';
export type {
  SchoolConfigParams,
  ModuleConfigParams,
  SystemConfigParams,
  ConfigValue
} from './config';
export type {
  SchoolSettings,
  AcademicSettings,
  FeeSettings,
  BrandingSettings,
  SystemSettings
} from './settings';
