<template>
  <div
    class="min-h-screen w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950 relative overflow-hidden"
  >
    <!-- Animated background elements -->
    <div class="absolute inset-0">
      <div class="absolute top-0 left-0 w-full h-full">
        <div
          class="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
        ></div>
        <div
          class="absolute top-40 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"
        ></div>
        <div
          class="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-2000"
        ></div>
      </div>
    </div>

    <!-- Floating particles -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-bounce"></div>
      <div
        class="absolute top-1/3 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-bounce delay-500"
      ></div>
      <div
        class="absolute bottom-1/4 left-1/2 w-3 h-3 bg-white/20 rounded-full animate-bounce delay-1000"
      ></div>
      <div
        class="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-white/35 rounded-full animate-bounce delay-1500"
      ></div>
    </div>

    <div class="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div class="w-full max-w-md">
        <!-- Glassmorphic card -->
        <div class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
          <!-- Logo/Brand -->
          <div class="text-center mb-8">
            <div
              class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <span class="text-white font-bold text-2xl">S</span>
            </div>
            <h1 class="text-white text-xl font-semibold mb-2">Reset Password</h1>
            <p class="text-white/70 text-sm">Enter your new password below</p>
          </div>

          <!-- Error Message -->
          <div
            v-if="error"
            class="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl"
          >
            <p class="text-red-200 text-sm text-center">{{ error }}</p>
          </div>

          <!-- Success Message -->
          <div
            v-if="success"
            class="mb-6 p-4 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-xl"
          >
            <p class="text-green-200 text-sm text-center">{{ success }}</p>
          </div>

          <!-- Reset Password Form -->
          <form v-if="!success" @submit.prevent="handleResetPassword" class="space-y-6">
            <div>
              <label class="block text-white/80 text-sm font-medium mb-2">New Password</label>
              <div class="relative">
                <Lock
                  class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70 z-10"
                />
                <input
                  v-model="form.password"
                  type="password"
                  required
                  minlength="8"
                  class="w-full pl-10 pr-4 py-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/20 transition-all duration-300"
                  placeholder="Enter new password"
                />
              </div>
              <p class="text-white/50 text-xs mt-1">Password must be at least 8 characters long</p>
            </div>

            <div>
              <label class="block text-white/80 text-sm font-medium mb-2">Confirm Password</label>
              <div class="relative">
                <Lock
                  class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70 z-10"
                />
                <input
                  v-model="form.confirmPassword"
                  type="password"
                  required
                  class="w-full pl-10 pr-4 py-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/20 transition-all duration-300"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button
              type="submit"
              :disabled="loading || form.password !== form.confirmPassword"
              class="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!loading">Reset Password</span>
              <span v-else class="flex items-center justify-center">
                <div
                  class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"
                ></div>
                Resetting...
              </span>
            </button>
          </form>

          <!-- Back to Login -->
          <div class="mt-6 pt-6 border-t border-white/20 text-center">
            <NuxtLink
              to="/auth/login"
              class="text-blue-300 hover:text-blue-200 transition-colors text-sm"
            >
              ← Back to Login
            </NuxtLink>
          </div>

          <!-- Footer -->
          <div class="mt-6 pt-6 border-t border-white/20">
            <p class="text-white/60 text-sm text-center">
              © 2025 School ERP - Developed by DigitalFuzed
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Lock } from 'lucide-vue-next';
import { Auth } from '~/api';

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

// No layout needed - use default

const route = useRoute();
const router = useRouter();

const form = reactive({
  password: '',
  confirmPassword: ''
});

const error = ref('');
const success = ref('');
const loading = ref(false);
const token = ref('');

// Get token from URL query parameter
onMounted(() => {
  const tokenParam = route.query.token;
  if (!tokenParam) {
    error.value = 'Invalid reset link. Please request a new password reset.';
    return;
  }
  token.value = tokenParam;
});

const handleResetPassword = async () => {
  if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match.';
    return;
  }

  if (form.password.length < 8) {
    error.value = 'Password must be at least 8 characters long.';
    return;
  }

  error.value = '';
  loading.value = true;

  try {
    const response = await Auth.resetPassword(token.value, form.password);

    if (response.success) {
      success.value = 'Password reset successfully! Redirecting to login...';
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } else {
      error.value = response.message || 'Failed to reset password. Please try again.';
    }
  } catch (err) {
    console.error('Reset password error:', err);
    if (err.response?.status === 400) {
      error.value = 'Invalid or expired reset token. Please request a new password reset.';
    } else if (err.response?.status >= 500) {
      error.value = 'Server error. Please try again later.';
    } else {
      error.value = 'Network error. Please check your connection and try again.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Browser autofill styling */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px rgba(255, 255, 255, 0.15) inset !important;
  -webkit-text-fill-color: white !important;
  background-color: rgba(255, 255, 255, 0.15) !important;
  transition: background-color 5000s ease-in-out 0s;
}

/* Firefox autofill */
input:-moz-autofill {
  background-color: rgba(255, 255, 255, 0.15) !important;
  color: white !important;
}

/* Ensure autofilled text is visible */
input[type='password']:-webkit-autofill {
  -webkit-text-fill-color: white !important;
  color: white !important;
}
</style>
