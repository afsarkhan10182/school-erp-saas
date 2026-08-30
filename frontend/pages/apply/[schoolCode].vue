<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
    <main class="mx-auto w-full max-w-2xl">
      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        <header class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Online admission</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ schoolName || schoolCode }}</p>
        </header>

        <div v-if="submitted" class="p-6">
          <div class="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 px-4 py-3 text-sm text-green-800 dark:text-green-200">
            Application submitted. The school office will contact you.
          </div>
        </div>

        <form v-else class="p-6 space-y-5" @submit.prevent="submit">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label">First name</label>
              <input v-model.trim="form.first_name" required class="input" />
            </div>
            <div>
              <label class="label">Last name</label>
              <input v-model.trim="form.last_name" class="input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label">Phone</label>
              <input v-model.trim="form.phone" required class="input" inputmode="tel" />
            </div>
            <div>
              <label class="label">Email</label>
              <input v-model.trim="form.email" type="email" class="input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label">Class applying for</label>
              <select v-model="form.class_id" class="input">
                <option value="">Select class</option>
                <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="label">Date of birth</label>
              <input v-model="form.date_of_birth" type="date" class="input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label">Gender</label>
              <select v-model="form.gender" class="input">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="label">City</label>
              <input v-model.trim="form.city" class="input" />
            </div>
          </div>

          <div>
            <label class="label">Present Address</label>
            <textarea v-model.trim="form.present_address" class="input min-h-20" />
          </div>

          <div>
            <label class="label">Permanent Address</label>
            <textarea v-model.trim="form.permanent_address" class="input min-h-20" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label">Previous School Name</label>
              <input v-model.trim="form.previous_school_name" class="input" />
            </div>
            <div>
              <label class="label">Qualification</label>
              <input v-model.trim="form.previous_school_qualification" class="input" />
            </div>
          </div>

          <div>
            <label class="label">Previous School Remarks</label>
            <input v-model.trim="form.previous_school_remarks" class="input" />
          </div>

          <div v-if="customFields.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="field in customFields" :key="field.id">
              <label class="label">
                {{ field.title }} <span v-if="field.is_required" class="text-red-500">*</span>
              </label>
              <select
                v-if="field.field_type === 'select'"
                v-model="form.custom_fields[field.id]"
                :required="field.is_required"
                class="input"
              >
                <option value="">Select {{ field.title }}</option>
                <option v-for="option in customFieldOptions(field)" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
              <textarea
                v-else-if="field.field_type === 'textarea'"
                v-model="form.custom_fields[field.id]"
                :required="field.is_required"
                class="input min-h-20"
              />
              <label v-else-if="field.field_type === 'checkbox'" class="inline-flex items-center gap-2 mt-2 text-sm text-gray-700 dark:text-gray-300">
                <input v-model="form.custom_fields[field.id]" type="checkbox" class="rounded border-gray-300" />
                Yes
              </label>
              <input
                v-else
                v-model="form.custom_fields[field.id]"
                :required="field.is_required"
                :type="['date', 'number'].includes(field.field_type) ? field.field_type : 'text'"
                class="input"
              />
            </div>
          </div>

          <div>
            <label class="label">Notes</label>
            <textarea v-model.trim="form.notes" class="input min-h-24" />
          </div>

          <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {{ error }}
          </div>

          <button class="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50" :disabled="submitting" type="submit">
            {{ submitting ? 'Submitting...' : 'Submit application' }}
          </button>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { PublicAdmission } from '~/api/shared/school-ops';
import { apiErrorMessage } from '~/utils/list-response';

definePageMeta({ layout: false });

const route = useRoute();
const schoolCode = String(route.params.schoolCode || '');
const schoolName = ref('');
const classes = ref<any[]>([]);
const customFields = ref<any[]>([]);
const submitted = ref(false);
const submitting = ref(false);
const error = ref('');
const form = reactive({
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  class_id: '',
  date_of_birth: '',
  gender: '',
  city: '',
  present_address: '',
  permanent_address: '',
  previous_school_name: '',
  previous_school_qualification: '',
  previous_school_remarks: '',
  custom_fields: {} as Record<string, any>,
  notes: ''
});

const customFieldOptions = (field: any) =>
  String(field.notes || '')
    .split('\n')
    .map(option => option.trim())
    .filter(Boolean);

onMounted(async () => {
  try {
    const res: any = await PublicAdmission.classes(schoolCode);
    schoolName.value = res.data?.school?.name || '';
    classes.value = res.data?.classes || [];
    customFields.value = res.data?.custom_fields || [];
    customFields.value.forEach(field => {
      form.custom_fields[field.id] = field.field_type === 'checkbox' ? false : '';
    });
  } catch (e: any) {
    error.value = apiErrorMessage(e, 'School not found');
  }
});

const submit = async () => {
  submitting.value = true;
  try {
    error.value = '';
    await PublicAdmission.apply(schoolCode, form);
    submitted.value = true;
  } catch (e: any) {
    error.value = apiErrorMessage(e, 'Failed to submit');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}
.input {
  @apply w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm dark:bg-gray-900 dark:text-white;
}
</style>
