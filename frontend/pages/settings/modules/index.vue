<template>
  <div class="min-h-screen">
    <div class="container mx-auto py-8 px-4">
      <h1 class="text-2xl font-bold mb-4">Module Settings</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="module in modules"
          :key="module.id"
          class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">{{ module.name }}</h3>
            <toggle-switch
              :value="module.enabled"
              @toggle="toggleModule(module.id, $event)"
            />
          </div>
          
          <p class="text-gray-600 text-sm mb-4">{{ module.description }}</p>
          
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium" :class="module.enabled ? 'text-green-600' : 'text-gray-400'">
              {{ module.enabled ? 'Enabled' : 'Disabled' }}
            </span>
            <button
              v-if="module.enabled"
              @click="configureModule(module.id)"
              class="text-blue-600 hover:text-blue-800 text-sm"
            >
              Configure
            </button>
          </div>
        </div>
      </div>

      <div class="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Module Permissions</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="role in roles" :key="role.id" class="border rounded-lg p-4">
            <h3 class="font-semibold mb-3">{{ role.name }}</h3>
            <div class="space-y-2">
              <div v-for="permission in role.permissions" :key="permission.id" class="flex items-center">
                <input
                  :id="`${role.id}-${permission.id}`"
                  v-model="permission.enabled"
                  type="checkbox"
                  class="mr-3"
                />
                <label :for="`${role.id}-${permission.id}`" class="text-sm text-gray-700">
                  {{ permission.name }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button
          @click="saveModuleSettings"
          class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useModulesStore } from '@/stores/modules';
import ToggleSwitch from '@/components/ToggleSwitch.vue';

const modulesStore = useModulesStore();

const modules = ref(modulesStore.getModules());
const roles = ref(modulesStore.getRoles());

const toggleModule = (moduleId, enabled) => {
  modulesStore.toggleModule(moduleId, enabled);
};

const configureModule = (moduleId) => {
  navigateTo(`/settings/modules/${moduleId}`);
};

const saveModuleSettings = async () => {
  try {
    await modulesStore.saveModuleSettings();
    alert('Module settings saved successfully!');
  } catch (error) {
    console.error('Error saving module settings:', error);
  }
};

onMounted(async () => {
  await modulesStore.fetchModules();
});
</script>

<style scoped>
.container {
  max-width: 1024px;
}
</style>

