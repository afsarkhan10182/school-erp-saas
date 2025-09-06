<template>
  <span 
    :class="statusClasses" 
    class="inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full"
  >
    {{ displayValue }}
  </span>
</template>

<script setup lang="ts">
interface Props {
  status: string
  type?: 'attendance' | 'invoice' | 'payment' | 'general'
  customValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'general'
})

const statusClasses = computed(() => {
  const baseClasses = 'inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full'
  
  // Attendance status colors
  if (props.type === 'attendance') {
    const attendanceClasses = {
      'present': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'absent': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'late': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'excused': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'published': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'draft': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
    return attendanceClasses[props.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
  
  // Invoice/Payment status colors
  if (props.type === 'invoice' || props.type === 'payment') {
    const financialClasses = {
      'paid': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'sent': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'partial_paid': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'overdue': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'draft': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
    return financialClasses[props.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
  
  // General status colors (default)
  const generalClasses = {
    'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'approved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'completed': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  }
  
  return generalClasses[props.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
})

const displayValue = computed(() => {
  const value = props.customValue || props.status || '-'
  // Capitalize first letter for better display
  if (typeof value === 'string' && value.length > 0) {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
  return value
})
</script>