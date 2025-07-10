<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <div class="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-xl">S</span>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          School ERP SaaS Platform
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">Email address</label>
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="input-field rounded-t-md"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="input-field rounded-b-md"
              placeholder="Password"
            />
          </div>
        </div>

        <!-- Autofill Demo Credentials -->
        <div class="flex justify-between gap-2 mb-2">
          <button type="button" @click="autofillSuperAdmin" class="btn-secondary w-1/2">Super Admin Demo</button>
          <button type="button" @click="autofillSchoolAdmin" class="btn-secondary w-1/2">School Admin Demo</button>
        </div>

        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                {{ error }}
              </h3>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </div>

        <div class="text-center">
          <p class="text-sm text-gray-600">
            Demo Credentials:
          </p>
          <div class="mt-2 space-y-1 text-xs text-gray-500">
            <p><strong>Super Admin:</strong> superadmin@example.com / Admin@123</p>
            <p><strong>School Admin:</strong> admin@demoschool.edu / School@123</p>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useCookie } from 'nuxt/app';

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

// Set layout to 'login'
definePageMeta({ layout: 'login' });

// Form data
const form = reactive({
  email: '',
  password: ''
});

// State
const error = ref('');
const loading = ref(false);
const router = useRouter();

// Autofill functions
function autofillSuperAdmin() {
  form.email = 'superadmin@example.com';
  form.password = 'Admin@123';
}
function autofillSchoolAdmin() {
  form.email = 'admin@demoschool.edu';
  form.password = 'School@123';
}

// Handle login
const handleLogin = async () => {
  error.value = '';
  loading.value = true;
  
  try {
    const response = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: form.email,
        password: form.password
      })
    });

    const data = await response.json();
    console.log('LOGIN RESPONSE:', data); // Debug: log the response
    
    if (data.success) {
      // Try to extract token from different possible structures
      let accessToken = data.data?.tokens?.access?.token || data.data?.token || data.data?.accessToken;
      let refreshToken = data.data?.tokens?.refresh?.token || data.data?.refreshToken;
      // Fallback: if user object contains token
      if (!accessToken && data.data?.user?.token) accessToken = data.data.user.token;
      if (!refreshToken && data.data?.user?.refreshToken) refreshToken = data.data.user.refreshToken;
      // Set cookies (secure: false for localhost)
      useCookie('auth-token', { secure: false }).value = accessToken;
      useCookie('refresh-token', { secure: false }).value = refreshToken;
      // Optionally, also keep in localStorage for legacy code
      localStorage.setItem('auth-token', accessToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      // Redirect to dashboard
      await router.push('/dashboard');
    } else {
      error.value = data.message || 'Login failed';
    }
  } catch (err) {
    console.error('Login error:', err);
    error.value = 'Network error. Please check if the backend is running.';
  } finally {
    loading.value = false;
  }
};

// Set page title
useHead({
  title: 'Login - School ERP'
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f7f7;
}
.login-form {
  background: #fff;
  padding: 2rem 2.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  width: 320px;
}
.form-group {
  margin-bottom: 1.2rem;
}
label {
  display: block;
  margin-bottom: 0.3rem;
  font-weight: 500;
}
input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
button {
  width: 100%;
  padding: 0.7rem;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
button:disabled {
  background: #b3d1ff;
  cursor: not-allowed;
}
.error {
  color: #d32f2f;
  margin-bottom: 1rem;
  text-align: center;
}
</style> 