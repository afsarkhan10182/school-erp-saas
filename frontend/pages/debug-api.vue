<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">API Debug Information</h1>
    
    <div class="space-y-4">
      <div class="bg-gray-100 p-4 rounded">
        <h2 class="font-semibold">Runtime Config:</h2>
        <pre class="mt-2 text-sm">{{ JSON.stringify(runtimeConfig, null, 2) }}</pre>
      </div>
      
      <div class="bg-gray-100 p-4 rounded">
        <h2 class="font-semibold">API Base URL:</h2>
        <p class="mt-2 font-mono">{{ apiBaseUrl }}</p>
      </div>
      
      <div class="bg-gray-100 p-4 rounded">
        <h2 class="font-semibold">Environment Variables:</h2>
        <pre class="mt-2 text-sm">{{ envInfo }}</pre>
      </div>
      
      <div class="bg-gray-100 p-4 rounded">
        <h2 class="font-semibold">Test API Call:</h2>
        <button @click="testApiCall" class="bg-blue-500 text-white px-4 py-2 rounded">
          Test API Connection
        </button>
        <div v-if="apiTestResult" class="mt-2">
          <pre class="text-sm">{{ apiTestResult }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const runtimeConfig = ref({});
const apiBaseUrl = ref('');
const envInfo = ref({});
const apiTestResult = ref('');

onMounted(() => {
  // Get runtime config
  const config = useRuntimeConfig();
  runtimeConfig.value = config.public;
  apiBaseUrl.value = config.public?.apiBase || 'Not set';
  
  // Get environment info
  envInfo.value = {
    NODE_ENV: process.env.NODE_ENV,
    NUXT_PUBLIC_API_BASE: process.env.NUXT_PUBLIC_API_BASE,
    BASE_URL: process.env.BASE_URL,
    NITRO_HOST: process.env.NITRO_HOST,
    NITRO_PORT: process.env.NITRO_PORT,
  };
});

const testApiCall = async () => {
  try {
    const config = useRuntimeConfig();
    const apiBase = config.public?.apiBase;
    
    apiTestResult.value = `Testing API call to: ${apiBase}/health\n`;
    
    const response = await fetch(`${apiBase}/health`);
    const data = await response.json();
    
    apiTestResult.value += `Status: ${response.status}\n`;
    apiTestResult.value += `Response: ${JSON.stringify(data, null, 2)}`;
  } catch (error) {
    apiTestResult.value = `Error: ${error.message}`;
  }
};
</script> 