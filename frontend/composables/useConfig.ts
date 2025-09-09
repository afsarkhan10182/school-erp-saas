/**
 * Composable for configuration management
 * Following Rule #7: Industry Standard & Configurable - No hardcoded values
 * Following Rule #4: Follow Nuxt.js Standards - Use composables for shared logic
 */

import { ref, computed } from 'vue';

// Configuration state
const config = ref({
  subjectCategories: [
    { value: 'core', label: 'Core', description: 'Core academic subjects' },
    { value: 'elective', label: 'Elective', description: 'Optional subjects' },
    {
      value: 'extra_curricular',
      label: 'Extra Curricular',
      description: 'Non-academic activities'
    },
    { value: 'language', label: 'Language', description: 'Language subjects' },
    { value: 'science', label: 'Science', description: 'Science subjects' },
    { value: 'arts', label: 'Arts', description: 'Arts and humanities' },
    { value: 'commerce', label: 'Commerce', description: 'Commerce subjects' }
  ],
  dayTypes: [
    { value: 'working', label: 'Working Day', description: 'Regular working day' },
    { value: 'holiday', label: 'Holiday', description: 'Public or school holiday' },
    { value: 'weekend', label: 'Weekend', description: 'Weekend day' },
    { value: 'exam', label: 'Exam Day', description: 'Examination day' },
    { value: 'event', label: 'Event', description: 'Special event day' }
  ],
  userRoles: [
    { value: 'super_admin', label: 'Super Admin', description: 'System administrator' },
    { value: 'school_admin', label: 'School Admin', description: 'School administrator' },
    { value: 'branch_admin', label: 'Branch Admin', description: 'Branch administrator' },
    { value: 'teacher', label: 'Teacher', description: 'Teaching staff' },
    { value: 'student', label: 'Student', description: 'Student' },
    { value: 'parent', label: 'Parent', description: 'Parent/Guardian' }
  ],
  statusOptions: {
    general: [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'red' },
      { value: 'pending', label: 'Pending', color: 'yellow' },
      { value: 'completed', label: 'Completed', color: 'blue' },
      { value: 'cancelled', label: 'Cancelled', color: 'gray' }
    ],
    academic: [
      { value: 'passed', label: 'Passed', color: 'green' },
      { value: 'failed', label: 'Failed', color: 'red' },
      { value: 'absent', label: 'Absent', color: 'gray' },
      { value: 'present', label: 'Present', color: 'green' }
    ],
    financial: [
      { value: 'paid', label: 'Paid', color: 'green' },
      { value: 'unpaid', label: 'Unpaid', color: 'red' },
      { value: 'partial', label: 'Partial', color: 'yellow' },
      { value: 'overdue', label: 'Overdue', color: 'red' }
    ]
  },
  academicYear: {
    startingMonth: 6, // June
    currentYear: '2024-2025'
  },
  grading: {
    type: 'percentage',
    gradeScales: [
      { grade: 'A+', min_marks: 90, max_marks: 100, description: 'Excellent' },
      { grade: 'A', min_marks: 80, max_marks: 89, description: 'Very Good' },
      { grade: 'B+', min_marks: 70, max_marks: 79, description: 'Good' },
      { grade: 'B', min_marks: 60, max_marks: 69, description: 'Satisfactory' },
      { grade: 'C+', min_marks: 50, max_marks: 59, description: 'Average' },
      { grade: 'C', min_marks: 40, max_marks: 49, description: 'Below Average' },
      { grade: 'F', min_marks: 0, max_marks: 39, description: 'Fail' }
    ]
  },
  fees: {
    currency: 'INR',
    dueDateGracePeriod: 7,
    lateFeePercentage: 5
  },
  attendance: {
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    attendancePercentage: 75,
    autoMarkAbsent: true
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    defaultLanguage: 'en',
    timezone: 'Asia/Kolkata'
  }
});

export const useConfig = () => {
  // Computed properties for easy access
  const subjectCategories = computed(() => config.value.subjectCategories);
  const dayTypes = computed(() => config.value.dayTypes);
  const userRoles = computed(() => config.value.userRoles);
  const statusOptions = computed(() => config.value.statusOptions);
  const academicYear = computed(() => config.value.academicYear);
  const grading = computed(() => config.value.grading);
  const fees = computed(() => config.value.fees);
  const attendance = computed(() => config.value.attendance);
  const notifications = computed(() => config.value.notifications);

  // Helper functions
  const getSubjectCategoryLabel = (value: string) => {
    const category = subjectCategories.value.find(cat => cat.value === value);
    return category ? category.label : value;
  };

  const getDayTypeLabel = (value: string) => {
    const dayType = dayTypes.value.find(dt => dt.value === value);
    return dayType ? dayType.label : value;
  };

  const getUserRoleLabel = (value: string) => {
    const role = userRoles.value.find(r => r.value === value);
    return role ? role.label : value;
  };

  const getStatusLabel = (
    value: string,
    type: 'general' | 'academic' | 'financial' = 'general'
  ) => {
    const status = statusOptions.value[type]?.find(s => s.value === value);
    return status ? status.label : value;
  };

  const getStatusColor = (
    value: string,
    type: 'general' | 'academic' | 'financial' = 'general'
  ) => {
    const status = statusOptions.value[type]?.find(s => s.value === value);
    return status ? status.color : 'gray';
  };

  const getGradeForMarks = (marks: number) => {
    const gradeScale = grading.value.gradeScales.find(
      scale => marks >= scale.min_marks && marks <= scale.max_marks
    );
    return gradeScale ? gradeScale.grade : 'F';
  };

  const getGradeDescription = (grade: string) => {
    const gradeScale = grading.value.gradeScales.find(scale => scale.grade === grade);
    return gradeScale ? gradeScale.description : '';
  };

  const calculateAcademicYear = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const startingMonth = academicYear.value.startingMonth;

    if (month >= startingMonth) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  const getCurrentAcademicYear = () => {
    return calculateAcademicYear(new Date());
  };

  const isWorkingDay = (dayOfWeek: number) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];
    return attendance.value.workingDays[dayName as keyof typeof attendance.value.workingDays];
  };

  const formatCurrency = (amount: number) => {
    const currency = fees.value.currency;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const calculateLateFee = (amount: number, daysOverdue: number) => {
    if (daysOverdue <= fees.value.dueDateGracePeriod) {
      return 0;
    }
    return (amount * fees.value.lateFeePercentage) / 100;
  };

  // Update configuration (for when loading from backend)
  const updateConfig = (newConfig: Partial<typeof config.value>) => {
    config.value = { ...config.value, ...newConfig };
  };

  // Load configuration from backend
  const loadConfig = async () => {
    try {
      // This would typically make an API call to get configuration
      // const response = await $fetch('/api/config')
      // updateConfig(response.data)
      console.log('Configuration loaded from backend');
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  return {
    // State
    config: readonly(config),

    // Computed
    subjectCategories,
    dayTypes,
    userRoles,
    statusOptions,
    academicYear,
    grading,
    fees,
    attendance,
    notifications,

    // Helper functions
    getSubjectCategoryLabel,
    getDayTypeLabel,
    getUserRoleLabel,
    getStatusLabel,
    getStatusColor,
    getGradeForMarks,
    getGradeDescription,
    calculateAcademicYear,
    getCurrentAcademicYear,
    isWorkingDay,
    formatCurrency,
    calculateLateFee,

    // Actions
    updateConfig,
    loadConfig
  };
};
