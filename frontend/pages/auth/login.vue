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
          class="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-2000"
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
            class="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
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
        <div class="w-full max-w-xl">
          <!-- Glassmorphic card -->
          <div
            class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8"
          >
            <!-- Logo/Brand -->
            <div class="text-center mb-8">
              <div
                class="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <span class="text-white font-bold text-2xl">S</span>
              </div>
              <h1 class="text-white text-2xl font-semibold">{{ loginTitle }}</h1>
              <p class="text-white/70 text-sm mt-2">{{ loginSubtitle }}</p>
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
                  class="text-sm text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                :disabled="loading"
                class="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="!loading">Sign In</span>
                <span v-else class="flex items-center justify-center">
                  <div
                    class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"
                  ></div>
                  Signing in....
                </span>
              </button>

            </form>

            <!-- Structured Demo Roles -->
            <div class="mt-8 border-t border-white/20 pt-6" aria-label="Demo Role Selection">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xs font-semibold tracking-wider uppercase text-pink-300">
                  Explore Interactive Demo
                </h2>
                <span class="text-[11px] text-white/60">1-click instant login</span>
              </div>

              <!-- Tier 2: School Leadership -->
              <div class="mb-4">
                <p class="text-[11px] font-medium text-white/60 uppercase tracking-wider mb-2">School Administration</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    v-for="role in schoolLeadershipRoles"
                    :key="role.key"
                    type="button"
                    class="text-left p-2.5 rounded-xl border transition-all flex items-start space-x-2.5 group"
                    :class="isRoleSelected(role.key)
                      ? 'border-indigo-400 bg-indigo-500/25 text-white shadow-md ring-1 ring-indigo-400/50'
                      : 'border-white/15 bg-white/5 text-white/80 hover:border-white/35 hover:bg-white/10'"
                    @click="handleDemoLogin(role.key)"
                    :disabled="loading"
                  >
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-400/20 text-indigo-300 mt-0.5">
                      <div v-if="loggingInRole === role.key" class="w-3.5 h-3.5 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin"></div>
                      <component :is="role.icon" v-else class="h-4 w-4" />
                    </span>
                    <div class="min-w-0">
                      <span class="block text-xs font-semibold text-white flex items-center gap-1.5">
                        {{ role.label }}
                        <span v-if="loggingInRole === role.key" class="text-[10px] text-indigo-300">Signing in...</span>
                      </span>
                      <span class="block text-[11px] text-white/65 leading-tight mt-0.5">{{ role.description }}</span>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Tier 3: Campus Staff & Operations -->
              <div class="mb-4">
                <p class="text-[11px] font-medium text-white/60 uppercase tracking-wider mb-2">Campus Operations Staff</p>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    v-for="role in operationalRoles"
                    :key="role.key"
                    type="button"
                    class="text-center p-2 rounded-xl border transition-all flex flex-col items-center justify-center group"
                    :class="isRoleSelected(role.key)
                      ? 'border-pink-400 bg-pink-500/25 text-white shadow-md ring-1 ring-pink-400/50'
                      : 'border-white/15 bg-white/5 text-white/80 hover:border-white/35 hover:bg-white/10'"
                    @click="handleDemoLogin(role.key)"
                    :disabled="loading"
                  >
                    <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-400/20 text-pink-300 mb-1">
                      <div v-if="loggingInRole === role.key" class="w-3 h-3 border-2 border-pink-300/30 border-t-pink-300 rounded-full animate-spin"></div>
                      <component :is="role.icon" v-else class="h-3.5 w-3.5" />
                    </span>
                    <span class="block text-xs font-semibold text-white">{{ role.label }}</span>
                    <span class="block text-[10px] text-white/60 leading-tight mt-0.5 line-clamp-1">{{ role.description }}</span>
                  </button>
                </div>
              </div>

              <!-- Tier 4: Family & Student Portal -->
              <div>
                <p class="text-[11px] font-medium text-white/60 uppercase tracking-wider mb-2">Family & Student Portal</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    v-for="role in familyRoles"
                    :key="role.key"
                    type="button"
                    class="text-left p-2.5 rounded-xl border transition-all flex items-start space-x-2.5 group"
                    :class="isRoleSelected(role.key)
                      ? 'border-emerald-400 bg-emerald-500/25 text-white shadow-md ring-1 ring-emerald-400/50'
                      : 'border-white/15 bg-white/5 text-white/80 hover:border-white/35 hover:bg-white/10'"
                    @click="handleDemoLogin(role.key)"
                    :disabled="loading"
                  >
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300 mt-0.5">
                      <div v-if="loggingInRole === role.key" class="w-3.5 h-3.5 border-2 border-emerald-300/30 border-t-emerald-300 rounded-full animate-spin"></div>
                      <component :is="role.icon" v-else class="h-4 w-4" />
                    </span>
                    <div class="min-w-0">
                      <span class="block text-xs font-semibold text-white flex items-center gap-1.5">
                        {{ role.label }}
                        <span v-if="loggingInRole === role.key" class="text-[10px] text-emerald-300">Signing in...</span>
                      </span>
                      <span class="block text-[11px] text-white/65 leading-tight mt-0.5">{{ role.description }}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

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
              class="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
import { Mail, Lock, Sun, Moon, X, Crown, ShieldCheck, GitBranch, GraduationCap, Users, UserRound, Calculator, BookOpen } from 'lucide-vue-next';
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

const { isDark, toggleTheme, initializeTheme } = useTheme();

// Dynamic year for copyright
const currentYear = computed(() => new Date().getFullYear());

const loginAudience = computed(() => {
  const audience = route.query.audience;
  return audience === 'parent' || audience === 'student' ? audience : null;
});
const loginTitle = computed(() =>
  loginAudience.value === 'parent'
    ? 'Parent login'
    : loginAudience.value === 'student'
      ? 'Student login'
      : 'School ERP login'
);
const loginSubtitle = computed(() =>
  loginAudience.value
    ? `Use the ${loginAudience.value} account provided by your school.`
    : 'Sign in with your school, parent, or student account.'
);

const loginRoles = [
  { key: 'super_admin', label: 'Platform owner', description: 'Manage schools, subscription plans, billing & platform-wide analytics', icon: Crown },
  { key: 'admin', label: 'School admin', description: 'Full school management: students, staff, fees, exams & reports', icon: ShieldCheck },
  { key: 'branch_admin', label: 'Branch admin', description: 'Single-branch operations: admissions, classes & campus staff', icon: GitBranch },
  { key: 'teacher', label: 'Teacher', description: 'Class schedule, homework, attendance & exam results', icon: UserRound },
  { key: 'accountant', label: 'Accountant', description: 'Fee collection, invoices & financial reports', icon: Calculator },
  { key: 'receptionist', label: 'Receptionist', description: 'Admission enquiries, visitor log & call tracking', icon: UserRound },
  { key: 'librarian', label: 'Librarian', description: 'Book catalog, issue/return & library reports', icon: BookOpen },
  { key: 'parent', label: 'Parent', description: 'Child progress: attendance, fees, homework & report cards', icon: Users },
  { key: 'student', label: 'Student', description: 'My classes, homework, exam results & online exams', icon: GraduationCap }
];

const schoolLeadershipRoles = [
  { key: 'admin', label: 'School Admin', description: 'Full school management: students, staff, fees, exams & reports across all branches', icon: ShieldCheck },
  { key: 'branch_admin', label: 'Branch Admin', description: 'Single-branch operations: admissions, classes, sections & campus staff', icon: GitBranch }
];

const operationalRoles = [
  { key: 'teacher', label: 'Teacher', description: 'Schedule & homework', icon: UserRound },
  { key: 'teacher_second', label: 'Teacher · Second Branch', description: 'Class 2 schedule & homework', icon: UserRound },
  { key: 'accountant', label: 'Accountant', description: 'Fees & invoices', icon: Calculator },
  { key: 'receptionist', label: 'Receptionist', description: 'Enquiries & visitors', icon: UserRound },
  { key: 'librarian', label: 'Librarian', description: 'Catalog & issuing', icon: BookOpen }
];

const familyRoles = [
  { key: 'parent', label: 'Parent Portal', description: 'Child progress: attendance, fees, homework, timetable & report cards', icon: Users },
  { key: 'student', label: 'Student Portal', description: 'My classes, homework, exam results, timetable & online exams', icon: GraduationCap }
];

const selectedDemoRole = ref(
  route.query.audience === 'parent' || route.query.audience === 'student'
    ? route.query.audience
    : 'admin'
);
const loggingInRole = ref(null);

const isRoleSelected = key => {
  return selectedDemoRole.value === key;
};

const selectLoginRole = role => {
  selectedDemoRole.value = role;
  if (import.meta.client) {
    sessionStorage.removeItem('post-logout-redirect');
    sessionStorage.removeItem('user-modules');
  }
  const authStore = useAuthStore();
  authStore.setCurrentSchool(null);
  authStore.setCurrentBranch(null);

  const accountRole =
    role === 'branch_admin'
      ? 'branch'
      : role === 'super_admin'
        ? 'superadmin'
        : role === 'teacher_second'
          ? 'teacher.second'
        : role === 'receptionist'
          ? 'reception'
          : role;
  form.email = `demo.${accountRole}@schoolerp.local`;
  form.password = 'Demo@12345';
  form.rememberMe = false;
  const query = { ...route.query };
  if (role === 'student' || role === 'parent') query.audience = role;
  else delete query.audience;
  router.replace({ query });
  error.value = '';
};

const handleDemoLogin = async role => {
  loggingInRole.value = role;
  selectLoginRole(role);
  try {
    await handleLogin();
  } finally {
    loggingInRole.value = null;
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
      const role = authStore.currentUser?.role;
      const isFamily = role === 'student' || role === 'parent';
      const isSuper = role === 'super_admin';
      let destination = redirectTo.value;
      if (!destination && import.meta.client) {
        const savedRedirect = sessionStorage.getItem('post-logout-redirect');
        if (savedRedirect) {
          sessionStorage.removeItem('post-logout-redirect');
          if ((isFamily && !savedRedirect.startsWith('/portal')) || (!isSuper && savedRedirect.startsWith('/saas')) || (isSuper && !savedRedirect.startsWith('/saas'))) {
            // Incompatible with role, ignore
          } else {
            destination = savedRedirect;
          }
        }
      }
      destination = destination || homePathForRole(role);
      await navigateTo(destination, { replace: true });
      return;
    }

    // We have cached user data, verify with server
    if (savedUser) {
      try {
        const isValid = await authStore.checkAuth();
        if (isValid) {
          const role = authStore.currentUser?.role;
          const isFamily = role === 'student' || role === 'parent';
          const isSuper = role === 'super_admin';
          let destination = redirectTo.value;
          if (!destination && import.meta.client) {
            const savedRedirect = sessionStorage.getItem('post-logout-redirect');
            if (savedRedirect) {
              sessionStorage.removeItem('post-logout-redirect');
              if ((isFamily && !savedRedirect.startsWith('/portal')) || (!isSuper && savedRedirect.startsWith('/saas')) || (isSuper && !savedRedirect.startsWith('/saas'))) {
                // Incompatible with role, ignore
              } else {
                destination = savedRedirect;
              }
            }
          }
          destination = destination || homePathForRole(role);
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
  initializeTheme();
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
    error.value = 'Network error. Please check if the backend is running.';
  } finally {
    loading.value = false;
  }
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
