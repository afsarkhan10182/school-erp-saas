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

    <!-- Theme toggle -->
    <ClientOnly>
      <button
        @click="toggleTheme"
        class="fixed top-6 right-6 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <Sun v-if="isDark" class="w-5 h-5 text-yellow-300" />
        <Moon v-else class="w-5 h-5 text-white" />
      </button>
    </ClientOnly>

    <ClientOnly>
      <div
        v-if="checkingAuth"
        class="min-h-screen flex items-center justify-center p-4 relative z-10"
      >
        <!-- Loading Screen -->
        <div class="text-center">
          <div
            class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <span class="text-white font-bold text-2xl">S</span>
          </div>
          <div
            class="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"
          ></div>
          <p class="text-white/70 text-sm">Checking authentication...</p>
        </div>
      </div>

      <div v-else class="min-h-screen flex items-center justify-center p-4 relative z-10">
        <!-- Login Container -->
        <div class="w-full max-w-md">
          <!-- Glassmorphic card -->
          <div
            class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8"
          >
            <!-- Logo/Brand -->
            <div class="text-center mb-8">
              <div
                class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <span class="text-white font-bold text-2xl">S</span>
              </div>
              <p class="text-white/70 text-sm">Sign in to your School ERP account</p>
            </div>

            <!-- Error Message -->
            <div
              v-if="error"
              class="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl"
            >
              <p class="text-red-200 text-sm text-center">{{ error }}</p>
            </div>

            <!-- Login Form -->
            <form @submit.prevent="handleLogin" class="space-y-6">
              <div>
                <label class="block text-white/80 text-sm font-medium mb-2">Email Address</label>
                <div class="relative">
                  <Mail
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70 z-10"
                  />
                  <input
                    v-model="form.email"
                    type="email"
                    required
                    class="w-full pl-10 pr-4 py-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/20 transition-all duration-300"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label class="block text-white/80 text-sm font-medium mb-2">Password</label>
                <div class="relative">
                  <Lock
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70 z-10"
                  />
                  <input
                    v-model="form.password"
                    type="password"
                    required
                    class="w-full pl-10 pr-4 py-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/20 transition-all duration-300"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between">
                <label
                  class="flex items-center cursor-pointer hover:opacity-80 transition-opacity duration-200"
                >
                  <input
                    v-model="form.rememberMe"
                    type="checkbox"
                    class="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-400 cursor-pointer"
                  />
                  <span class="ml-2 text-sm text-white/70 select-none">Remember me</span>
                </label>
                <button
                  type="button"
                  @click="showForgotPassword = true"
                  class="text-sm text-blue-300 hover:text-blue-200 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                :disabled="loading"
                class="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="!loading">Sign In</span>
                <span v-else class="flex items-center justify-center">
                  <div
                    class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"
                  ></div>
                  Signing in....
                </span>
              </button>

              <!-- Demo Quick Access -->
              <div class="mt-4">
                <button
                  type="button"
                  @click="fillDemoCredentials"
                  class="w-full py-2 px-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white/80 font-medium rounded-xl hover:bg-white/20 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  Quick Demo Login
                </button>
              </div>
            </form>

            <!-- Copyright -->
            <div class="mt-6 pt-6 border-t border-white/20">
              <p class="text-white/60 text-sm text-center">
                © {{ currentYear }} School ERP - Developed by DigitalFuzed
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>

    <!-- Forgot Password Modal -->
    <div
      v-if="showForgotPassword"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 w-full max-w-md"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-white text-lg font-semibold">Reset Password</h3>
          <button
            @click="showForgotPassword = false"
            class="text-white/70 hover:text-white transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-white/70 text-sm mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form @submit.prevent="handleForgotPassword" class="space-y-4">
          <div>
            <label class="block text-white/80 text-sm font-medium mb-2">Email Address</label>
            <input
              v-model="forgotPasswordForm.email"
              type="email"
              required
              class="w-full px-4 py-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/20 transition-all duration-300"
              placeholder="Enter your email"
            />
          </div>

          <div
            v-if="forgotPasswordMessage"
            class="p-3 rounded-lg text-sm"
            :class="
              forgotPasswordMessage.type === 'success'
                ? 'bg-green-500/20 border border-green-500/30 text-green-200'
                : 'bg-red-500/20 border border-red-500/30 text-red-200'
            "
          >
            {{ forgotPasswordMessage.text }}
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              @click="showForgotPassword = false"
              class="flex-1 py-3 px-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="forgotPasswordLoading"
              class="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!forgotPasswordLoading">Send Reset Link</span>
              <span v-else class="flex items-center justify-center">
                <div
                  class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"
                ></div>
                Sending...
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Mail, Lock, Sun, Moon, X } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { Auth } from '~/api';
import { homePathForRole } from '~/utils/home-path';

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const form = reactive({
  email: '',
  password: '',
  rememberMe: false
});

const forgotPasswordForm = reactive({
  email: ''
});

const error = ref('');
const loading = ref(false);
const checkingAuth = ref(false);
const showForgotPassword = ref(false);
const forgotPasswordLoading = ref(false);
const forgotPasswordMessage = ref(null);

const router = useRouter();
const route = useRoute();
const { login } = useAuth();

// Get redirect parameter from URL
const redirectTo = computed(() => {
  const redirect = route.query.redirect;
  return redirect && typeof redirect === 'string' ? decodeURIComponent(redirect) : null;
});

const isDark = ref(false);

// Dynamic year for copyright
const currentYear = computed(() => new Date().getFullYear());

// Apply theme using Nuxt's useHead - called once outside toggle
const applyTheme = () => {
  useHead({
    htmlAttrs: {
      class: isDark.value ? 'dark' : ''
    }
  });
};

const toggleTheme = () => {
  isDark.value = !isDark.value;

  if (import.meta.client) {
    // Use the same approach as theme.client.ts
    if (isDark.value) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // Also update cookie for SSR consistency
    const themeCookie = useCookie('theme');
    themeCookie.value = isDark.value ? 'dark' : 'light';
  }
};

// Note: "Remember Me" is now handled by cookie expiry on the backend
// No need to store credentials locally - the backend manages session persistence

// Handle forgot password
const handleForgotPassword = async () => {
  forgotPasswordLoading.value = true;
  forgotPasswordMessage.value = null;

  try {
    const response = await Auth.forgotPassword(forgotPasswordForm.email);

    if (response.success) {
      forgotPasswordMessage.value = {
        type: 'success',
        text: 'Password reset link has been sent to your email address.'
      };
      forgotPasswordForm.email = '';
      setTimeout(() => {
        showForgotPassword.value = false;
        forgotPasswordMessage.value = null;
      }, 3000);
    } else {
      forgotPasswordMessage.value = {
        type: 'error',
        text: response.message || 'Failed to send reset link. Please try again.'
      };
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    forgotPasswordMessage.value = {
      type: 'error',
      text: 'Network error. Please check your connection and try again.'
    };
  } finally {
    forgotPasswordLoading.value = false;
  }
};

// Check authentication on component mount
const checkExistingAuth = async () => {
  const authStore = useAuthStore();

  // First, check if we have any cached data or if user is already logged in
  const savedUser = sessionStorage.getItem('auth-user');
  const hasAuthData = authStore.isLoggedIn || authStore.currentUser || savedUser;

  // Only show "Checking authentication..." if we have data to check
  if (!hasAuthData) {
    // No auth data, show login form immediately (good for incognito/new users)
    return;
  }

  // We have cached data, show checking screen and verify
  checkingAuth.value = true;

  // Wait for auth store to finish initializing
  const waitForAuthInit = async () => {
    if (authStore.isInitializing) {
      await new Promise(resolve => {
        const checkInit = () => {
          if (!authStore.isInitializing) {
            resolve(true);
          } else {
            setTimeout(checkInit, 50);
          }
        };
        checkInit();
      });
    }
  };

  try {
    await waitForAuthInit();

    // If user is already logged in, redirect to intended destination or dashboard
    if (authStore.isLoggedIn && authStore.currentUser) {
      // Priority: query redirect > post-logout redirect > dashboard
      let destination = redirectTo.value;
      if (!destination && import.meta.client) {
        const savedRedirect = sessionStorage.getItem('post-logout-redirect');
        if (savedRedirect) {
          destination = savedRedirect;
          sessionStorage.removeItem('post-logout-redirect');
        }
      }
      destination = destination || homePathForRole(authStore.currentUser?.role);
      await navigateTo(destination, { replace: true });
      return;
    }

    // We have cached user data, verify with server
    if (savedUser) {
      try {
        const isValid = await authStore.checkAuth();
        if (isValid) {
          // Priority: query redirect > post-logout redirect > role home
          let destination = redirectTo.value;
          if (!destination && import.meta.client) {
            const savedRedirect = sessionStorage.getItem('post-logout-redirect');
            if (savedRedirect) {
              destination = savedRedirect;
              sessionStorage.removeItem('post-logout-redirect');
            }
          }
          destination = destination || homePathForRole(authStore.currentUser?.role);
          await navigateTo(destination, { replace: true });
          return;
        }
      } catch (error) {
        // Server check failed, show login form
      }
    }
  } finally {
    // Show login form after checks are complete
    checkingAuth.value = false;
  }
};

// Use Nuxt 3's onMounted lifecycle hook for theme setup and auth check
onMounted(() => {
  // Don't override theme - let theme.client.ts handle it
  // Just sync with existing DOM state
  if (import.meta.client) {
    isDark.value = document.documentElement.classList.contains('dark');
  }

  // Run auth check after component is mounted
  checkExistingAuth();
});

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  try {
    const result = await login(
      {
        email: form.email,
        password: form.password,
        rememberMe: form.rememberMe
      },
      redirectTo.value || undefined
    );
    if (result.success) {
      // Login successful - let the useAuth composable handle navigation
      // No need to navigate here as useAuth will do it
    } else {
      error.value = result.error || 'Login failed';
    }
  } catch (err) {
    console.error('Login error:', err);
    error.value = 'Network error. Please check if the backend is running.';
  } finally {
    loading.value = false;
  }
};

// Fill demo credentials for quick access
const fillDemoCredentials = () => {
  form.email = 'demo@gmail.com';
  form.password = 'demo@123';
  form.rememberMe = false;
  error.value = ''; // Clear any existing errors
};
</script>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

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
input[type='email']:-webkit-autofill,
input[type='password']:-webkit-autofill {
  -webkit-text-fill-color: white !important;
  color: white !important;
}
</style>
