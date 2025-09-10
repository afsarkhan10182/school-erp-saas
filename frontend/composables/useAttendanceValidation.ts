import { ref, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { Academic } from '~/api/academic/academic';

export const useAttendanceValidation = () => {
  const authStore = useAuthStore();
  const attendanceSettings = ref<any>(null);
  const loading = ref(false);

  const loadAttendanceSettings = async () => {
    if (!authStore.isLoggedIn) return null;

    loading.value = true;
    try {
      const response = await Academic.getSettings();

      if (response.success) {
        attendanceSettings.value = response.data.attendanceSettings;
        return attendanceSettings.value;
      }
    } catch (error) {
      return null;
    } finally {
      loading.value = false;
    }
  };

  const validateWorkingDay = (date: string) => {
    if (!attendanceSettings.value) return { isValid: true, message: '' };

    // First, validate the date itself
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    // Check if date is in the future
    if (selectedDate > today) {
      // Allow future dates within 7 days for planning purposes
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);

      if (selectedDate > sevenDaysFromNow) {
        return {
          isValid: false,
          message: 'Cannot mark attendance for dates more than 7 days in the future'
        };
      }
    }

    // Check if date is too far in the past (more than 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    if (selectedDate < thirtyDaysAgo) {
      return {
        isValid: false,
        message: 'Cannot mark attendance for dates more than 30 days in the past'
      };
    }

    const dayOfWeek = selectedDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // Only enforce if explicitly configured
    const enforceWorkingDays =
      attendanceSettings.value.validationRules?.enforceWorkingDays === true;
    if (enforceWorkingDays) {
      const workingDays = attendanceSettings.value.workingDays || {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      };

      if (!workingDays[dayName]) {
        return { isValid: false, message: `Attendance cannot be marked on ${dayName}` };
      }
    }

    return { isValid: true, message: '' };
  };

  const validateAttendanceTime = () => {
    if (!attendanceSettings.value) return { isValid: true, message: '' };

    // Only enforce if explicitly configured
    const enforceCutoff = attendanceSettings.value.validationRules?.enforceCutoffTime === true;
    if (!enforceCutoff) return { isValid: true, message: '' };

    const cutoffTime = attendanceSettings.value.validationRules?.cutoffTime || '23:59';
    const [cutoffHour, cutoffMinute] = cutoffTime.split(':').map(Number);

    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    if (currentHour > cutoffHour || (currentHour === cutoffHour && currentMinute > cutoffMinute)) {
      return {
        isValid: false,
        message: '⚠️ This action is outside school policy. Your admin may review this change.'
      };
    }

    return { isValid: true, message: '' };
  };

  const validateAttendanceStatus = (status: string, remarks: string) => {
    if (!attendanceSettings.value) return { isValid: true, message: '' };

    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      return { isValid: false, message: `Invalid attendance status: ${status}` };
    }

    return { isValid: true, message: '' };
  };

  const validateAttendanceSubmission = (date: string, records: any[], publish: boolean = false) => {
    const workingDayValidation = validateWorkingDay(date);
    if (!workingDayValidation.isValid) {
      return workingDayValidation;
    }

    if (publish) {
      const timeValidation = validateAttendanceTime();
      if (!timeValidation.isValid) {
        return timeValidation;
      }
    }

    for (const record of records) {
      const statusValidation = validateAttendanceStatus(record.status, record.remarks || '');
      if (!statusValidation.isValid) {
        return statusValidation;
      }
    }

    return { isValid: true, message: '' };
  };

  const getTimeSettings = computed(() => {
    return (
      attendanceSettings.value?.timeSettings || {
        cutoffTime: '16:00'
      }
    );
  });

  const getValidationRules = computed(() => {
    return (
      attendanceSettings.value?.validationRules || {
        // Minimal & essential defaults
        enforceWorkingDays: false,
        enforceCutoffTime: false
      }
    );
  });

  return {
    attendanceSettings,
    loading,
    loadAttendanceSettings,
    validateWorkingDay,
    validateAttendanceTime,
    validateAttendanceStatus,
    validateAttendanceSubmission,
    getTimeSettings,
    getValidationRules
  };
};
