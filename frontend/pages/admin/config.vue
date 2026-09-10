<template>
  <div class="max-w-[1400px] mx-auto p-4">
    <div class="page-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">Configuration Management</h1>
          <p class="page-subtitle">
            Manage system-wide settings, school configurations, and module preferences
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="refreshConfigurations"
            :disabled="loading"
            class="btn btn-secondary"
          >
            <svg
              class="w-4 h-4"
              :class="{ 'animate-spin': loading }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <button
            @click="exportConfigurations"
            class="btn btn-primary"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export
          </button>
        </div>
      </div>
    </div>

    <div class="mt-8">
      <ConfigManager />
    </div>

    <!-- Quick Actions Panel -->
    <div class="card mt-8">
      <div class="card-body">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            @click="resetToDefaults"
            class="btn btn-ghost text-left p-4 h-auto"
          >
            <div class="flex items-center">
              <svg
                class="w-8 h-8 text-orange-500 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <div>
                <h4 class="font-medium text-gray-800">Reset to Defaults</h4>
                <p class="text-sm text-gray-500">Restore all settings to default values</p>
              </div>
            </div>
          </button>

          <button
            @click="backupConfigurations"
            class="btn btn-ghost text-left p-4 h-auto"
          >
            <div class="flex items-center">
              <svg
                class="w-8 h-8 text-green-500 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              <div>
                <h4 class="font-medium text-gray-800">Backup Configurations</h4>
                <p class="text-sm text-gray-500">Create a backup of current settings</p>
              </div>
            </div>
          </button>

          <button
            @click="showImportModal = true"
            class="btn btn-ghost text-left p-4 h-auto"
          >
            <div class="flex items-center">
              <svg
                class="w-8 h-8 text-blue-500 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              <div>
                <h4 class="font-medium text-gray-800">Import Configurations</h4>
                <p class="text-sm text-gray-500">Restore settings from backup file</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Configuration Summary -->
    <div class="card mt-8">
      <div class="card-body">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Configuration Summary</h3>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-indigo-600">{{ enabledModulesCount }}</div>
            <div class="text-sm text-gray-500">Enabled Modules</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ totalSettingsCount }}</div>
            <div class="text-sm text-gray-500">Total Settings</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">{{ customSettingsCount }}</div>
            <div class="text-sm text-gray-500">Custom Settings</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ lastUpdated }}</div>
            <div class="text-sm text-gray-500">Last Updated</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div
      v-if="showImportModal"
      class="modal-overlay"
      @click.self="showImportModal = false"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="page-title">Import Configurations</h3>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">
              Select Configuration File
            </label>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              class="form-input"
              @change="handleFileSelect"
            />
          </div>

          <div class="text-sm text-gray-500">
            <p>Supported formats: JSON</p>
            <p>Maximum file size: 10MB</p>
          </div>
        </div>
        <div class="modal-footer">
          <button
            @click="showImportModal = false"
            class="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            @click="importConfigurations"
            :disabled="!selectedFile"
            class="btn btn-primary"
          >
            Import
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="mt-4">
      <div
        :class="[
          'alert',
          message.type === 'success' ? 'alert-success' : 'alert-danger'
        ]"
      >
        {{ message.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useConfig } from '~/composables/useConfig';
import { Settings } from '~/api/administration/settings';

// Meta
definePageMeta({
  layout: 'admin',
  requiresRole: ['admin', 'super_admin']
});

// Composables
const config = useConfig();

// Reactive data
const loading = ref(false);
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null);
const showImportModal = ref(false);
const selectedFile = ref<File | null>(null);
const enabledModules = ref<any[]>([]);
const lastUpdated = ref<string>('');

// Computed properties
const enabledModulesCount = computed(() => {
  return enabledModules.value.filter(module => module.is_enabled).length;
});

const totalSettingsCount = computed(() => {
  return enabledModules.value.reduce((total, module) => {
    return total + (module.settings?.length || 0);
  }, 0);
});

const customSettingsCount = computed(() => {
  return enabledModules.value.reduce((total, module) => {
    if (!module.settings) return total;
    return total + module.settings.filter((setting: any) => setting.is_custom).length;
  }, 0);
});

// Methods
const loadConfigurations = async () => {
  try {
    loading.value = true;
    enabledModules.value = await config.getEnabledModules();
    lastUpdated.value = new Date().toLocaleDateString();
  } catch (error) {
    console.error('Error loading configurations:', error);
    showMessage('error', 'Failed to load configurations');
  } finally {
    loading.value = false;
  }
};

const refreshConfigurations = async () => {
  config.clearAllCache();
  await loadConfigurations();
  showMessage('success', 'Configurations refreshed successfully');
};

const exportConfigurations = async () => {
  try {
    const response = await Settings.exportConfig();

    // Create download link
    const blob = new Blob([JSON.stringify(response, null, 2)], {
      type: 'application/json'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `configurations-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showMessage('success', 'Configurations exported successfully');
  } catch (error) {
    console.error('Error exporting configurations:', error);
    showMessage('error', 'Failed to export configurations');
  }
};

const resetToDefaults = async () => {
  if (
    !confirm(
      'Are you sure you want to reset all configurations to default values? This action cannot be undone.'
    )
  ) {
    return;
  }

  try {
    await Settings.resetToDefaults();

    config.clearAllCache();
    await loadConfigurations();
    showMessage('success', 'Configurations reset to defaults successfully');
  } catch (error) {
    console.error('Error resetting configurations:', error);
    showMessage('error', 'Failed to reset configurations');
  }
};

const backupConfigurations = async () => {
  try {
    await Settings.createBackup();
    showMessage('success', 'Configuration backup created successfully');
  } catch (error) {
    console.error('Error creating backup:', error);
    showMessage('error', 'Failed to create backup');
  }
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
  }
};

const importConfigurations = async () => {
  if (!selectedFile.value) return;

  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);

    await Settings.importConfig(formData);

    config.clearAllCache();
    await loadConfigurations();
    showImportModal.value = false;
    selectedFile.value = null;
    showMessage('success', 'Configurations imported successfully');
  } catch (error) {
    console.error('Error importing configurations:', error);
    showMessage('error', 'Failed to import configurations');
  }
};

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text };
  setTimeout(() => {
    message.value = null;
  }, 5000);
};

// Lifecycle
onMounted(() => {
  loadConfigurations();
});
</script>
