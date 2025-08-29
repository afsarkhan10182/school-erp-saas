import { defineStore } from 'pinia';
import { apiClient } from '~/utils/api';

interface Module {
  key: string;
  name: string;
  description: string;
  icon: string;
  features: string[];
  enabled: boolean;
  config?: any;
}

interface Permission {
  id: string;
  name: string;
  enabled: boolean;
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

interface ModulesState {
  modules: Module[];
  roles: Role[];
  isLoading: boolean;
  availableModules: Module[];
}

export const useModulesStore = defineStore('modules', {
  state: (): ModulesState => ({
    modules: [],
    roles: [
      {
        id: 'school_admin',
        name: 'School Admin',
        permissions: [
          { id: 'manage_fees', name: 'Manage Fees', enabled: true },
          { id: 'manage_students', name: 'Manage Students', enabled: true },
          { id: 'manage_staff', name: 'Manage Staff', enabled: true },
          { id: 'view_reports', name: 'View Reports', enabled: true },
          { id: 'manage_modules', name: 'Manage Modules', enabled: true },
          { id: 'system_settings', name: 'System Settings', enabled: true },
        ],
      },
      {
        id: 'branch_admin',
        name: 'Branch Admin',
        permissions: [
          { id: 'manage_fees', name: 'Manage Fees', enabled: true },
          { id: 'manage_students', name: 'Manage Students', enabled: true },
          { id: 'manage_staff', name: 'Manage Staff', enabled: false },
          { id: 'view_reports', name: 'View Reports', enabled: true },
          { id: 'manage_modules', name: 'Manage Modules', enabled: false },
          { id: 'system_settings', name: 'System Settings', enabled: false },
        ],
      },
      {
        id: 'accountant',
        name: 'Accountant',
        permissions: [
          { id: 'manage_fees', name: 'Manage Fees', enabled: true },
          { id: 'manage_students', name: 'Manage Students', enabled: false },
          { id: 'manage_staff', name: 'Manage Staff', enabled: false },
          { id: 'view_reports', name: 'View Reports', enabled: true },
          { id: 'manage_modules', name: 'Manage Modules', enabled: false },
          { id: 'system_settings', name: 'System Settings', enabled: false },
        ],
      },
      {
        id: 'teacher',
        name: 'Teacher',
        permissions: [
          { id: 'manage_fees', name: 'Manage Fees', enabled: false },
          { id: 'manage_students', name: 'Manage Students', enabled: true },
          { id: 'manage_staff', name: 'Manage Staff', enabled: false },
          { id: 'view_reports', name: 'View Reports', enabled: true },
          { id: 'manage_modules', name: 'Manage Modules', enabled: false },
          { id: 'system_settings', name: 'System Settings', enabled: false },
        ],
      },
      {
        id: 'librarian',
        name: 'Librarian',
        permissions: [
          { id: 'manage_fees', name: 'Manage Fees', enabled: false },
          { id: 'manage_students', name: 'Manage Students', enabled: false },
          { id: 'manage_staff', name: 'Manage Staff', enabled: false },
          { id: 'view_reports', name: 'View Reports', enabled: true },
          { id: 'manage_modules', name: 'Manage Modules', enabled: false },
          { id: 'system_settings', name: 'System Settings', enabled: false },
        ],
      },
      {
        id: 'receptionist',
        name: 'Receptionist',
        permissions: [
          { id: 'manage_fees', name: 'Manage Fees', enabled: false },
          { id: 'manage_students', name: 'Manage Students', enabled: true },
          { id: 'manage_staff', name: 'Manage Staff', enabled: false },
          { id: 'view_reports', name: 'View Reports', enabled: false },
          { id: 'manage_modules', name: 'Manage Modules', enabled: false },
          { id: 'system_settings', name: 'System Settings', enabled: false },
        ],
      },
    ],
    isLoading: false,
    availableModules: [],
  }),

  getters: {
    getModules: (state) => () => state.modules,
    getRoles: (state) => () => state.roles,
    getModuleById: (state) => (id: string) => state.modules.find(m => m.key === id),
    getEnabledModules: (state) => state.modules.filter(m => m.enabled),
    isModuleEnabled: (state) => (moduleId: string) => {
      const module = state.modules.find(m => m.key === moduleId);
      return module?.enabled || false;
    },
    getAvailableModules: (state) => state.availableModules,
  },

  actions: {
    async fetchModules() {
      this.isLoading = true;
      try {
        // Fetch available modules from API
        const response = await apiClient.saas.getAvailableModules();
        if (response.success) {
          this.availableModules = response.data;
        }
      } catch (error) {
        console.error('Error fetching modules:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchSchoolModules(schoolId: string) {
      this.isLoading = true;
      try {
        const response = await apiClient.schools.getModules(schoolId);
        if (response.success) {
          this.modules = response.data.modules || [];
        }
      } catch (error) {
        console.error('Error fetching school modules:', error);
      } finally {
        this.isLoading = false;
      }
    },

    toggleModule(moduleId: string, enabled: boolean) {
      const module = this.modules.find(m => m.key === moduleId);
      if (module) {
        module.enabled = enabled;
      }
    },

    updateModuleConfig(moduleId: string, config: any) {
      const module = this.modules.find(m => m.key === moduleId);
      if (module) {
        module.config = { ...module.config, ...config };
      }
    },

    updateRolePermission(roleId: string, permissionId: string, enabled: boolean) {
      const role = this.roles.find(r => r.id === roleId);
      if (role) {
        const permission = role.permissions.find(p => p.id === permissionId);
        if (permission) {
          permission.enabled = enabled;
        }
      }
    },

    async saveModuleSettings() {
      try {
        // TODO: Replace with actual API call when backend is ready
        // await apiClient.modules.updateSettings({
        //   modules: this.modules,
        //   roles: this.roles,
        // });
        
        // For now, just save to localStorage
        localStorage.setItem('moduleSettings', JSON.stringify({
          modules: this.modules,
          roles: this.roles,
        }));
      } catch (error) {
        throw error;
      }
    },

    loadModuleSettings() {
      try {
        const saved = localStorage.getItem('moduleSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          this.modules = settings.modules || this.modules;
          this.roles = settings.roles || this.roles;
        }
      } catch (error) {
        console.error('Error loading module settings:', error);
      }
    },
  },
});
