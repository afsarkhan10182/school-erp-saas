<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading branding settings...</span>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Receipt Branding -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Receipt & Document Branding
        </h3>
        <div class="space-y-6">
          <!-- Receipt Logo -->
          <div>
            <label class="block font-medium mb-2 text-gray-700 dark:text-gray-300"
              >Receipt Logo</label
            >
            <div class="flex items-center gap-4">
              <input
                type="file"
                @change="handleReceiptLogoUpload"
                accept="image/*"
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <div v-if="receiptSettings.receiptLogo" class="flex-shrink-0">
                <img
                  :src="
                    receiptSettings.receiptLogo.startsWith('data:')
                      ? receiptSettings.receiptLogo
                      : getLogoUrl(
                          receiptSettings.receiptLogo,
                          authStore.currentSchool?.code || authStore.user?.school?.code
                        )
                  "
                  alt="Receipt Logo"
                  class="w-16 h-16 object-cover rounded border-2 border-gray-200"
                />
              </div>
              <div
                v-else
                class="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded border-2 border-gray-200 flex items-center justify-center"
              >
                <span class="text-xs text-gray-400">No logo</span>
              </div>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              Upload a logo specifically for receipts and documents (separate from main school logo)
            </p>
          </div>

          <!-- Receipt Title -->
          <div>
            <label class="block font-medium mb-2 text-gray-700 dark:text-gray-300"
              >Receipt Title</label
            >
            <input
              v-model="receiptSettings.defaultReceiptTitle"
              type="text"
              class="input-field"
              placeholder="Fee Receipt"
            />
            <p class="text-sm text-gray-500 mt-1">This will appear at the top of all receipts</p>
          </div>

          <!-- Footer Text -->
          <div>
            <label class="block font-medium mb-2 text-gray-700 dark:text-gray-300"
              >Footer Message</label
            >
            <textarea
              v-model="receiptSettings.receiptFooter"
              rows="2"
              class="input-field"
              placeholder="Thank you for your payment"
            ></textarea>
            <p class="text-sm text-gray-500 mt-1">
              Optional message to appear at the bottom of receipts
            </p>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button @click="saveSettings" class="btn-primary" :disabled="isSaving">
          <span
            v-if="isSaving"
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
          ></span>
          {{ isSaving ? 'Saving...' : 'Save Branding Settings' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { getLogoUrl } from '~/utils/image';
import { Settings } from '~/api/administration/settings';
import { useAuthStore } from '~/stores/auth';

// Props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  branches: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['save', 'update:loading']);

// Composables
const authStore = useAuthStore();

// Computed properties
const safeBranches = computed(() => {
  return Array.isArray(props.branches) ? props.branches : [];
});

// Reactive data
const receiptSettings = reactive({
  schoolName: '',
  defaultReceiptTitle: 'Fee Receipt',
  receiptLogo: '',
  receiptFooter: '',
  showSchoolLogo: true,
  showReceiptLogo: true,
  showSchoolAddress: true,
  showSchoolContact: true,
  showBranchInfo: true
});

const isSaving = ref(false);
const isLoading = ref(false);

// Methods
const loadBrandingSettings = async () => {
  try {
    isLoading.value = true;
    const response = await Settings.getBrandingSettings();

    if (response.success && response.data) {
      const data = response.data;

      // Load receipt settings
      if (data.receiptSettings) {
        Object.assign(receiptSettings, {
          schoolName: data.receiptSettings.schoolName || authStore.currentSchool?.name || '',
          defaultReceiptTitle: data.receiptSettings.defaultReceiptTitle || 'Fee Receipt',
          receiptLogo: data.receiptSettings.receiptLogo || '',
          receiptFooter: data.receiptSettings.receiptFooter || '',
          showSchoolLogo: data.receiptSettings.showSchoolLogo !== false,
          showReceiptLogo: data.receiptSettings.showReceiptLogo !== false,
          showSchoolAddress: data.receiptSettings.showSchoolAddress !== false,
          showSchoolContact: data.receiptSettings.showSchoolContact !== false,
          showBranchInfo: data.receiptSettings.showBranchInfo !== false
        });

        // Clear any file reference when loading saved data
        delete receiptSettings.receiptLogoFile;
      }

      // Load branch settings if available
      if (data.branches && Array.isArray(data.branches) && safeBranches.value.length > 0) {
        data.branches.forEach(branchData => {
          const branch = safeBranches.value.find(b => b.id === branchData.id);
          if (branch) {
            Object.assign(branch, {
              receiptName: branchData.receiptName || branch.name,
              receiptLogo: branchData.receiptLogo || '',
              receiptAddress: branchData.receiptAddress || branch.address || '',
              receiptContact: branchData.receiptContact || branch.phone || ''
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('Error loading branding settings:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleReceiptLogoUpload = event => {
  const file = event.target.files[0];
  if (file) {
    receiptSettings.receiptLogoFile = file;
    // Create preview URL for immediate display
    const reader = new FileReader();
    reader.onload = e => {
      receiptSettings.receiptLogo = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const handleBranchLogoUpload = (event, branch) => {
  const file = event.target.files[0];
  if (file) {
    branch.receiptLogoFile = file;
    // Create preview URL for immediate display
    const reader = new FileReader();
    reader.onload = e => {
      branch.receiptLogo = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const saveSettings = async () => {
  isSaving.value = true;
  try {
    const settingsData = {
      receiptSettings,
      branches: safeBranches.value
    };
    await emit('save', settingsData);

    // Only reload settings if there's no pending file upload
    // This prevents overwriting the preview state with server data
    if (!receiptSettings.receiptLogoFile) {
      await loadBrandingSettings();
    }
  } finally {
    isSaving.value = false;
  }
};

// Load data on mount
onMounted(() => {
  loadBrandingSettings();
});

// Expose methods for parent component
defineExpose({
  receiptSettings,
  saveSettings,
  loadBrandingSettings
});
</script>
