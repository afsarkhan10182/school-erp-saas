<template>
  <div v-if="hasErrors" class="mb-6">
    <!-- Categorized Error Display -->
    <div v-for="(errors, category) in categorizedErrors" :key="category" class="mb-4">
      <!-- Field-specific errors -->
      <div
        v-if="category === 'field' && Object.keys(errors).length > 0"
        class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 01-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
              Please correct the following {{ Object.keys(errors).length }} field error{{
                Object.keys(errors).length > 1 ? 's' : ''
              }}:
            </h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">
              <ul class="list-disc list-inside space-y-1">
                <li v-for="(message, field) in errors" :key="field" class="flex items-start">
                  <span class="flex-1">
                    <span class="font-medium">{{ formatFieldName(field) }}:</span>
                    {{ message }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div class="ml-auto pl-3">
            <button
              @click="$emit('clear-errors')"
              class="inline-flex text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- General errors -->
      <div
        v-else-if="category === 'general' && Array.isArray(errors) && errors.length > 0"
        class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 01-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
            <div class="mt-1 text-sm text-red-700 dark:text-red-300">
              <p v-for="(message, index) in errors" :key="index">{{ message }}</p>
            </div>
          </div>
          <div class="ml-auto pl-3">
            <button
              @click="$emit('clear-errors')"
              class="inline-flex text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Validation errors -->
      <div
        v-else-if="category === 'validation' && Array.isArray(errors) && errors.length > 0"
        class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Validation Required
            </h3>
            <div class="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              <p v-for="(message, index) in errors" :key="index">{{ message }}</p>
            </div>
          </div>
          <div class="ml-auto pl-3">
            <button
              @click="$emit('clear-errors')"
              class="inline-flex text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300"
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Network errors -->
      <div
        v-else-if="category === 'network' && Array.isArray(errors) && errors.length > 0"
        class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">Connection Issue</h3>
            <div class="mt-1 text-sm text-blue-700 dark:text-blue-300">
              <p v-for="(message, index) in errors" :key="index">{{ message }}</p>
            </div>
          </div>
          <div class="ml-auto pl-3">
            <button
              @click="$emit('clear-errors')"
              class="inline-flex text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Server errors -->
      <div
        v-else-if="category === 'server' && Array.isArray(errors) && errors.length > 0"
        class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Server Error</h3>
            <div class="mt-1 text-sm text-red-700 dark:text-red-300">
              <p v-for="(message, index) in errors" :key="index">{{ message }}</p>
            </div>
          </div>
          <div class="ml-auto pl-3">
            <button
              @click="$emit('clear-errors')"
              class="inline-flex text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Permission errors -->
      <div
        v-else-if="category === 'permission' && Array.isArray(errors) && errors.length > 0"
        class="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-orange-800 dark:text-orange-200">Access Denied</h3>
            <div class="mt-1 text-sm text-orange-700 dark:text-orange-300">
              <p v-for="(message, index) in errors" :key="index">{{ message }}</p>
            </div>
          </div>
          <div class="ml-auto pl-3">
            <button
              @click="$emit('clear-errors')"
              class="inline-flex text-orange-400 hover:text-orange-600 dark:hover:text-orange-300"
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Duplicate errors -->
      <div
        v-else-if="category === 'duplicate' && Array.isArray(errors) && errors.length > 0"
        class="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-purple-800 dark:text-purple-200">
              Duplicate Entry
            </h3>
            <div class="mt-1 text-sm text-purple-700 dark:text-purple-300">
              <p v-for="(message, index) in errors" :key="index">{{ message }}</p>
            </div>
          </div>
          <div class="ml-auto pl-3">
            <button
              @click="$emit('clear-errors')"
              class="inline-flex text-purple-400 hover:text-purple-600 dark:hover:text-purple-300"
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Not found errors -->
      <div
        v-else-if="category === 'not_found' && Array.isArray(errors) && errors.length > 0"
        class="p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-gray-800 dark:text-gray-200">Not Found</h3>
            <div class="mt-1 text-sm text-gray-700 dark:text-gray-300">
              <p v-for="(message, index) in errors" :key="index">{{ message }}</p>
            </div>
          </div>
          <div class="ml-auto pl-3">
            <button
              @click="$emit('clear-errors')"
              class="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Timeout errors -->
      <div
        v-else-if="category === 'timeout' && Array.isArray(errors) && errors.length > 0"
        class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Timeout</h3>
            <div class="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              <p v-for="(message, index) in errors" :key="index">{{ message }}</p>
            </div>
          </div>
          <div class="ml-auto pl-3">
            <button
              @click="$emit('clear-errors')"
              class="inline-flex text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300"
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  categorizedErrors: {
    field: Record<string, string>;
    general: string[];
    validation: string[];
    network: string[];
    server: string[];
    permission: string[];
    duplicate: string[];
    not_found: string[];
    timeout: string[];
  };
  hasErrors: boolean;
  errorCount: number;
}

const props = defineProps<Props>();

defineEmits<{
  'clear-errors': [];
}>();

// Format field names for display
const formatFieldName = (field: string): string => {
  // Handle nested field names (e.g., student.first_name -> Student First Name)
  const parts = field.split('.');
  if (parts.length > 1) {
    const section = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const fieldName = parts[1]
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return `${section} ${fieldName}`;
  }

  // Handle simple field names
  return field
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
</script>
