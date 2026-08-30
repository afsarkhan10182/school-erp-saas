<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Result Publication</h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Control when exam results become visible to students and parents
              </p>
            </div>
            <div class="flex space-x-3">
              <button
                @click="bulkPublish"
                :disabled="!selectedExams.length || publishing"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Globe class="h-4 w-4 mr-2" />
                {{ publishing ? 'Publishing...' : 'Bulk Publish' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div v-if="showBranchDropdown">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Branch
            </label>
            <EnhancedDropdown
              v-model="selectedBranchId"
              :options="branchOptions"
              placeholder="Choose branch"
              :loading="branchesLoading"
              @change="onBranchChange"
            />
          </div>

          <!-- Exam Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Exam
            </label>
            <EnhancedDropdown
              v-model="selectedExamId"
              :options="examOptions"
              placeholder="Choose exam"
              :loading="false"
              @change="onExamChange"
            />
          </div>

          <!-- Class Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Class
            </label>
            <EnhancedDropdown
              v-model="selectedClassId"
              :options="classOptions"
              placeholder="Choose class"
              :loading="classesLoading"
              @change="onClassChange"
            />
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Publication Status
            </label>
            <select
              v-model="statusFilter"
              class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <!-- Load Exams Button -->
          <div class="flex items-end">
            <button
              @click="loadPublicationExams"
              :disabled="publicationLoading"
              class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search class="h-4 w-4 mr-2" />
              {{ publicationLoading ? 'Loading...' : 'Load Exams' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Exams List -->
    <div v-if="exams.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Exam Results Publication ({{ exams.length }} exams)
            </h3>
            <div class="flex space-x-2">
              <button @click="selectAllExams" class="text-sm text-blue-600 hover:text-blue-800">
                Select All
              </button>
              <button @click="deselectAllExams" class="text-sm text-gray-600 hover:text-gray-800">
                Deselect All
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  <input
                    v-model="selectAll"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    @change="toggleAllExams"
                  />
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Exam
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Class
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Publish Status
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Result Status
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Published Date
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="exam in exams"
                :key="exam.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model="selectedExams"
                    :value="exam.id"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ exam.name }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ exam.examType?.name }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ exam.class?.name }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      exam.publish_status
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ exam.publish_status ? 'Published' : 'Unpublished' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      exam.result_status
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    ]"
                  >
                    {{ exam.result_status ? 'Results Available' : 'Results Pending' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ exam.published_at ? formatDate(exam.published_at) : 'Not published' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex space-x-2">
                    <button
                      @click="togglePublish(exam)"
                      :disabled="publishing"
                      :class="[
                        'inline-flex items-center px-3 py-1 text-xs font-medium rounded-md',
                        exam.publish_status
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      ]"
                    >
                      {{ exam.publish_status ? 'Unpublish' : 'Publish' }}
                    </button>
                    <button
                      @click="openNotificationModal(exam)"
                      :disabled="!exam.publish_status"
                      class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Notify
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- No Exams Message -->
    <div
      v-else-if="!publicationLoading && exams.length === 0"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <Globe class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No exams found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Please select filters to load exams.
        </p>
      </div>
    </div>

    <!-- Notification Modal -->
    <div
      v-if="showNotificationModal"
      class="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
      >
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          @click="closeNotificationModal"
        ></div>
        <div
          class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Send Notifications
            </h3>
            <div class="space-y-4">
              <div>
                <label class="flex items-center">
                  <input
                    v-model="notificationSettings.email_enabled"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >Email notifications</span
                  >
                </label>
              </div>
              <div>
                <label class="flex items-center">
                  <input
                    v-model="notificationSettings.sms_enabled"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >SMS notifications</span
                  >
                </label>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Message
                </label>
                <textarea
                  v-model="notificationSettings.notification_message"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional custom message for notifications..."
                />
              </div>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              @click="sendNotifications"
              :disabled="sendingNotifications"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ sendingNotifications ? 'Sending...' : 'Send Notifications' }}
            </button>
            <button
              @click="closeNotificationModal"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Globe, Search } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useExamPublication } from '~/composables/useExamPublication';
import { useAuth } from '~/composables/useAuth';
import { useBranches } from '~/composables/useBranches';

// Types
interface Exam {
  id: string;
  name: string;
  examType?: { name: string };
  class?: { name: string };
  publish_status: boolean;
  result_status: boolean;
  published_at?: string;
}

// Composables
const { showToast } = useToast();
const { user } = useAuth();
const { classes, classOptions, fetchClasses, loading: classesLoading } = useAcademics();
const { branches, fetchBranches, loading: branchesLoading } = useBranches();
const {
  getPublicationStatus,
  publishExam,
  bulkPublish: bulkPublishAPI,
  sendNotifications: sendNotificationsAPI,
  loading: publicationLoading,
  publishing,
  sendingNotifications
} = useExamPublication();

// Reactive data
const selectedExamId = ref('');
const selectedBranchId = ref('');
const selectedClassId = ref('');
const statusFilter = ref('');
const exams = ref<Exam[]>([]);
const selectedExams = ref<string[]>([]);
const showNotificationModal = ref(false);
const selectedExamForNotification = ref<Exam | null>(null);
const notificationSettings = reactive({
  email_enabled: true,
  sms_enabled: false,
  notification_message: ''
});

// Computed properties
const examOptions = computed(() =>
  exams.value.map(exam => ({
    value: exam.id,
    label: exam.name,
    description: exam.examType?.name
  }))
);
const branchOptions = computed(() =>
  branches.value.map(branch => ({ value: branch.id, label: branch.name }))
);
const showBranchDropdown = computed(() => branches.value.length > 1);

const selectAll = computed({
  get: () => selectedExams.value.length === exams.value.length && exams.value.length > 0,
  set: (value: boolean) => {
    if (value) {
      selectedExams.value = exams.value.map(e => e.id);
    } else {
      selectedExams.value = [];
    }
  }
});

// Methods
const onExamChange = () => {
  selectedClassId.value = '';
  exams.value = [];
  selectedExams.value = [];
};

const onClassChange = () => {
  exams.value = [];
  selectedExams.value = [];
};

const onBranchChange = async () => {
  selectedExamId.value = '';
  selectedClassId.value = '';
  exams.value = [];
  selectedExams.value = [];
  await fetchClasses({ branchId: selectedBranchId.value || user.value?.branch_id });
};

const loadPublicationExams = async () => {
  try {
    const filters: any = {
      school_id: user.value?.school_id,
      branch_id: selectedBranchId.value || user.value?.branch_id
    };

    if (selectedExamId.value) {
      filters.exam_id = selectedExamId.value;
    }
    if (selectedClassId.value) {
      filters.class_id = selectedClassId.value;
    }
    if (statusFilter.value) {
      if (statusFilter.value === 'published') {
        filters.publish_status = true;
      } else if (statusFilter.value === 'unpublished') {
        filters.publish_status = false;
      }
    }

    const response = await getPublicationStatus(filters);

    if (response.success) {
      exams.value = response.data;
      showToast('Exams loaded successfully', 'success');
    }
  } catch (error) {
    showToast('Failed to load exams', 'error');
  }
};

const selectAllExams = () => {
  selectedExams.value = exams.value.map(e => e.id);
};

const deselectAllExams = () => {
  selectedExams.value = [];
};

const toggleAllExams = () => {
  if (selectAll.value) {
    selectAllExams();
  } else {
    deselectAllExams();
  }
};

const togglePublish = async (exam: Exam) => {
  try {
    const response = await publishExam({
      exam_id: exam.id,
      publish_status: !exam.publish_status,
      result_status: exam.result_status,
      notify_students: true,
      notify_parents: true
    });

    if (response.success) {
      exam.publish_status = !exam.publish_status;
      if (exam.publish_status) {
        exam.published_at = new Date().toISOString();
      }
      showToast(
        `Exam ${exam.publish_status ? 'published' : 'unpublished'} successfully`,
        'success'
      );
    }
  } catch (error) {
    showToast('Failed to update publication status', 'error');
  }
};

const bulkPublish = async () => {
  try {
    const response = await bulkPublishAPI({
      exam_ids: selectedExams.value,
      publish_status: true,
      result_status: true
    });

    if (response.success) {
      // Update local state
      exams.value = exams.value.map(exam => {
        if (selectedExams.value.includes(exam.id)) {
          return {
            ...exam,
            publish_status: true,
            result_status: true,
            published_at: new Date().toISOString()
          };
        }
        return exam;
      });

      selectedExams.value = [];
      showToast(`Published ${selectedExams.value.length} exams successfully`, 'success');
    }
  } catch (error) {
    showToast('Failed to publish exams', 'error');
  }
};

const openNotificationModal = (exam: Exam) => {
  selectedExamForNotification.value = exam;
  showNotificationModal.value = true;
  notificationSettings.notification_message = `Results for ${exam.name} have been published. Please check your portal for details.`;
};

const closeNotificationModal = () => {
  showNotificationModal.value = false;
  selectedExamForNotification.value = null;
  notificationSettings.email_enabled = true;
  notificationSettings.sms_enabled = false;
  notificationSettings.notification_message = '';
};

const sendNotifications = async () => {
  if (!selectedExamForNotification.value) return;

  try {
    const response = await sendNotificationsAPI(
      selectedExamForNotification.value.id,
      notificationSettings
    );

    if (response.success) {
      showToast('Notifications sent successfully', 'success');
      closeNotificationModal();
    }
  } catch (error) {
    showToast('Failed to send notifications', 'error');
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

// Load initial data
onMounted(async () => {
  await fetchBranches();
  if (user.value?.branch_id) selectedBranchId.value = user.value.branch_id;
  else if (branches.value.length === 1) selectedBranchId.value = branches.value[0].id;
  await fetchClasses({ branchId: selectedBranchId.value || user.value?.branch_id });
});
</script>
