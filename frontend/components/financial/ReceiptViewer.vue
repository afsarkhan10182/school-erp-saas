<template>
  <div class="receipt-viewer">
    <!-- Modal Header with Actions -->
    <div class="modal-header">
      <div class="modal-title">Receipt Viewer</div>
      <div class="modal-actions">
        <button @click="printReceipt" class="action-button print-button" title="Print Receipt">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
        </button>

        <button @click="$emit('close')" class="action-button close-button" title="Close">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Receipt Container -->
    <div class="receipt-container" ref="receiptContainer">
      <div class="receipt" :class="{ 'receipt-print': isPrinting }">
        <!-- Header -->
        <div class="header">
          <img
            v-if="receiptData.receipt_logo && receiptData.receipt_logo.trim() !== ''"
            :src="
              getLogoUrl(receiptData.receipt_logo, schoolData?.code || schoolData?.school?.code)
            "
            alt="Receipt Logo"
            class="receipt-logo"
            @error="handleLogoError"
          />
          <div class="header-content">
            <div class="trust-section">
              <div class="trust-name">
                {{
                  schoolData.trust_name ||
                  schoolData.settings?.trust_name ||
                  receiptData.trust_name ||
                  ''
                }}
              </div>
            </div>
            <div class="school-section">
              <div class="school-name">
                {{ schoolData.receiptSchoolName || schoolData.name || receiptData.school_name }}
                {{ schoolType }}{{ branchDisplay }}
              </div>
              <div class="school-address">
                {{ schoolData.address || receiptData.school_address }}
              </div>
            </div>
          </div>
        </div>

        <!-- Receipt Title -->
        <div class="receipt-title">
          {{ getReceiptTitle() }}
        </div>

        <!-- Receipt Information -->
        <div class="receipt-info">
          <div class="info-row">
            <span class="info-label">Receipt No:</span>
            <span class="info-value receipt-number">{{ getReceiptNumberDisplay() }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Invoice Reference:</span>
            <span class="info-value invoice-number">{{ getInvoiceNumberDisplay() }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">{{ formatDate(receiptData.payment_date) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label"
              >{{ isJuniorCollege ? 'Receive from' : 'Name of the Pupil' }}:</span
            >
            <span class="info-value">{{ receiptData.student_name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">{{ isJuniorCollege ? 'Class' : 'Std. & Div.' }}:</span>
            <span class="info-value"
              >{{ receiptData.class_name
              }}{{ receiptData.section ? ' - ' + receiptData.section : '' }}</span
            >
          </div>
          <!-- <div v-if="receiptData.branch_name || receiptData.branch?.name" class="info-row">
            <span class="info-label">Branch:</span>
            <span class="info-value">{{ receiptData.branch_name || receiptData.branch?.name || 'N/A' }}</span>
          </div> -->
          <div class="info-row">
            <span class="info-label">Roll No:</span>
            <span class="info-value">{{ receiptData.roll_number || 'N/A' }}</span>
          </div>
          <div v-if="!isJuniorCollege" class="info-row">
            <span class="info-label">G.R. No:</span>
            <span class="info-value">{{ receiptData.admission_number }}</span>
          </div>

          <div v-if="isMonthlyPayment && receiptData.month_paid" class="info-row">
            <span class="info-label">Month Paid:</span>
            <span class="info-value">{{ receiptData.month_paid }}</span>
          </div>

          <div
            v-if="
              isCombinedPayment &&
              (receiptData.months_covered ||
                (receiptData.invoices && receiptData.invoices.length > 0))
            "
            class="info-row"
          >
            <span class="info-label">Months Covered:</span>
            <span class="info-value">
              <span v-if="receiptData.months_covered">{{ receiptData.months_covered }}</span>
              <span v-else-if="receiptData.invoices && receiptData.invoices.length > 0">
                {{
                  receiptData.invoices
                    .map(inv =>
                      inv.month && inv.year ? `${getMonthName(inv.month)} ${inv.year}` : null
                    )
                    .filter(Boolean)
                    .join(', ')
                }}
              </span>
            </span>
          </div>

          <!-- Fee Table -->
          <table v-if="isCombinedPayment" class="fee-table">
            <thead>
              <tr>
                <th class="table-header">Month</th>
                <th class="table-header">Fee Type</th>
                <th class="table-header">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-if="receiptData.monthly_payments && receiptData.monthly_payments.length > 0"
                v-for="payment in receiptData.monthly_payments"
                :key="`${payment.month}-${payment.year}`"
              >
                <td>{{ getMonthName(payment.month) }} {{ payment.year }}</td>
                <td>{{ payment.fee_type }}</td>
                <td>{{ formatCurrency(payment.amount) }}</td>
              </tr>
              <tr
                v-else-if="receiptData.invoices && receiptData.invoices.length > 0"
                v-for="invoice in receiptData.invoices"
                :key="`${invoice.month}-${invoice.year}`"
              >
                <td>{{ getMonthName(invoice.month) }} {{ invoice.year }}</td>
                <td>{{ invoice.feeStructure?.feeType?.name || 'TUITION FEES' }}</td>
                <td>{{ formatCurrency(invoice.total_amount) }}</td>
              </tr>
            </tbody>
          </table>

          <table
            v-else-if="
              isInstallmentPayment && receiptData.invoices && receiptData.invoices.length > 1
            "
            class="fee-table"
          >
            <thead>
              <tr>
                <th class="table-header">Installment No</th>
                <th class="table-header">Due Date</th>
                <th class="table-header">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(invoice, index) in receiptData.invoices" :key="invoice.id">
                <td>{{ index + 1 }}</td>
                <td>{{ formatDate(invoice.due_date) }}</td>
                <td>{{ formatCurrency(invoice.total_amount) }}</td>
              </tr>
            </tbody>
          </table>

          <table v-else class="fee-table">
            <thead>
              <tr>
                <th class="table-header">Particulars</th>
                <th class="table-header">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ getParticularsDisplay() }}</td>
                <td>{{ formatCurrency(getAmountDisplay()) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Summary Section -->
          <div class="summary-section">
            <div class="info-row">
              <span class="info-label">Total Amount:</span>
              <span class="info-value">₹{{ formatCurrency(getAmountDisplay()) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Method:</span>
              <span class="info-value">{{
                (receiptData.payment_method || 'cash').toUpperCase()
              }}</span>
            </div>
            <div v-if="receiptData.transaction_id" class="info-row">
              <span class="info-label">Transaction ID:</span>
              <span class="info-value">{{ receiptData.transaction_id }}</span>
            </div>
          </div>

          <!-- Remaining Balance Info -->
          <div v-if="isCombinedPayment" class="remaining-info">
            <div class="remaining-title">Monthly Payment Summary</div>
            <div class="info-row">
              <span class="info-label">Remaining Months:</span>
              <span class="info-value">{{ receiptData.remaining_months || 0 }} months</span>
            </div>
            <div class="info-row">
              <span class="info-label">Remaining Balance:</span>
              <span class="info-value"
                >₹{{ formatCurrency(receiptData.remaining_balance || 0) }}</span
              >
            </div>
          </div>

          <div v-else-if="isMonthlyPayment" class="remaining-info">
            <div class="remaining-title">Monthly Payment Summary</div>
            <div class="info-row">
              <span class="info-label">Remaining Months:</span>
              <span class="info-value">{{ receiptData.remaining_months || 0 }} months</span>
            </div>
            <div class="info-row">
              <span class="info-label">Remaining Balance:</span>
              <span class="info-value"
                >₹{{ formatCurrency(receiptData.remaining_balance || 0) }}</span
              >
            </div>
          </div>

          <div v-else-if="isInstallmentPayment" class="remaining-info">
            <div class="remaining-title">Installment Payment Summary</div>
            <div class="info-row">
              <span class="info-label">Remaining Amount:</span>
              <span class="info-value"
                >₹{{ formatCurrency(getInstallmentRemainingBalance()) }}</span
              >
            </div>
            <div v-if="receiptData.invoices && receiptData.invoices.length > 0" class="info-row">
              <span class="info-label">Installments Paid:</span>
              <span class="info-value"
                >{{ getPaidInstallmentsCount() }}/{{
                  receiptData.invoices[0].total_installments
                }}</span
              >
            </div>
            <div v-if="receiptData.remaining_installments" class="info-row">
              <span class="info-label">Remaining Installments:</span>
              <span class="info-value">{{ receiptData.remaining_installments }}</span>
            </div>
          </div>

          <div v-else class="remaining-info">
            <div class="remaining-title">Outstanding Balance</div>
            <div class="info-row">
              <span class="info-label">Remaining Amount:</span>
              <span class="info-value"
                >₹{{ formatCurrency(receiptData.remaining_balance || 0) }}</span
              >
            </div>
            <div v-if="receiptData.remaining_months" class="info-row">
              <span class="info-label">Remaining Months:</span>
              <span class="info-value">{{ receiptData.remaining_months || 0 }} months</span>
            </div>
          </div>
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
          <div class="signature">
            <div class="signature-line"></div>
            {{ isJuniorCollege ? 'Cashier Signature' : "Receiver's Signature" }}
          </div>
          <div class="signature">
            <div class="signature-line"></div>
            Date
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from '~/composables/useToast';

const props = defineProps({
  receiptData: {
    type: Object,
    required: true
  },
  schoolData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close']);

const { showToast } = useToast();
const receiptContainer = ref(null);
const isPrinting = ref(false);

// Computed properties
const isJuniorCollege = computed(() => {
  return (
    props.receiptData.class_name && props.receiptData.class_name.toLowerCase().includes('junior')
  );
});

const schoolType = computed(() => {
  // First check class name
  if (isJuniorCollege.value) {
    return 'JUNIOR COLLEGE';
  }

  // Then check branch name for college indicators
  const branchName = props.receiptData.branch_name || props.receiptData.branch?.name || '';
  if (branchName) {
    const branchNameLower = branchName.toLowerCase();
    if (
      branchNameLower.includes('jr') ||
      branchNameLower.includes('junior') ||
      branchNameLower.includes('college') ||
      branchNameLower.includes('jc')
    ) {
      return 'JUNIOR COLLEGE';
    }
  }

  return 'ENGLISH MEDIUM SCHOOL';
});

const branchDisplay = computed(() => {
  return '';
});

const isMonthlyPayment = computed(() => {
  return props.receiptData.payment_model === 'monthly';
});

const isCombinedPayment = computed(() => {
  // Check for combined payment indicators
  return (
    props.receiptData.payment_model === 'combined' ||
    props.receiptData.receipt_group_id ||
    (props.receiptData.monthly_payments && props.receiptData.monthly_payments.length > 1) ||
    (props.receiptData.invoices && props.receiptData.invoices.length > 1)
  );
});

const isInstallmentPayment = computed(() => {
  return props.receiptData.payment_model === 'installment';
});

// Methods
const formatDate = dateString => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN');
};

const formatCurrency = amount => {
  if (!amount) return '0';
  return parseFloat(amount).toLocaleString('en-IN');
};

const handleLogoError = event => {
  event.target.style.display = 'none';
};

// Import centralized image utilities
import { getLogoUrl } from '~/utils/image';

const getMonthName = month => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  return months[month - 1] || 'Unknown';
};

const getFeeTypeDisplay = () => {
  if (props.receiptData.fee_type_name && props.receiptData.fee_type_name !== 'Multiple Fee Types') {
    return props.receiptData.fee_type_name;
  }
  if (props.receiptData.fee_type) {
    return props.receiptData.fee_type;
  }
  if (props.receiptData.monthly_payments && props.receiptData.monthly_payments.length > 0) {
    return props.receiptData.monthly_payments[0].fee_type || 'Tuition Fees';
  }
  return 'Tuition Fees';
};

const getReceiptNumberDisplay = () => {
  // Check if receipt_number is directly in receiptData
  if (props.receiptData.receipt_number) {
    return props.receiptData.receipt_number;
  }

  // Check if receiptData is nested inside a parent object (like combined_receipt)
  if (props.receiptData.receipt_data && props.receiptData.receipt_data.receipt_number) {
    return props.receiptData.receipt_data.receipt_number;
  }

  return 'N/A';
};

const getInvoiceNumberDisplay = () => {
  // Always show the original invoice number as reference
  if (props.receiptData.invoice_number) {
    return props.receiptData.invoice_number;
  }

  return 'N/A';
};

const getAmountDisplay = () => {
  // For combined payments, use total_payment_amount or total_paid
  if (isCombinedPayment.value) {
    return props.receiptData.total_payment_amount || props.receiptData.total_paid || 0;
  }
  // For individual payments, use payment_amount
  return props.receiptData.payment_amount || 0;
};

const getParticularsDisplay = () => {
  if (isCombinedPayment.value) {
    // For group invoices, show the months covered
    if (props.receiptData.months_covered) {
      return `Multiple Months (${props.receiptData.months_covered})`;
    }
    if (props.receiptData.monthly_payments && props.receiptData.monthly_payments.length > 0) {
      const months = props.receiptData.monthly_payments
        .map(p => `${getMonthName(p.month)} ${p.year}`)
        .join(', ');
      return `Multiple Months (${months})`;
    }
    if (props.receiptData.paid_months && props.receiptData.paid_months.length > 0) {
      const months = props.receiptData.paid_months
        .map(pm => `${getMonthName(pm.month)} ${pm.year}`)
        .join(', ');
      return `Multiple Months (${months})`;
    }
    // For grouped receipts, try to extract months from invoice numbers or other fields
    if (props.receiptData.invoices && props.receiptData.invoices.length > 0) {
      const months = props.receiptData.invoices
        .map(inv => {
          if (inv.month && inv.year) {
            return `${getMonthName(inv.month)} ${inv.year}`;
          }
          return null;
        })
        .filter(Boolean)
        .join(', ');
      if (months) {
        return `Multiple Months (${months})`;
      }
    }
    return 'Multiple Months Payment';
  }
  if (isInstallmentPayment.value) {
    return getFeeTypeDisplay();
  }
  if (isMonthlyPayment.value && props.receiptData.month_paid) {
    return `${getFeeTypeDisplay()} (${props.receiptData.month_paid})`;
  }
  return getFeeTypeDisplay();
};

const getPaidInstallmentsCount = () => {
  if (!props.receiptData.invoices || props.receiptData.invoices.length === 0) {
    return 0;
  }

  // Count installments that are paid or partially paid
  return props.receiptData.invoices.filter(
    invoice => invoice.status === 'paid' || invoice.status === 'partial_paid'
  ).length;
};

const getInstallmentRemainingBalance = () => {
  if (!props.receiptData.invoices || props.receiptData.invoices.length === 0) {
    return props.receiptData.remaining_balance || 0;
  }

  // Calculate total fee amount from all installments
  const totalFeeAmount = props.receiptData.invoices.reduce((sum, invoice) => {
    return sum + parseFloat(invoice.total_amount || 0);
  }, 0);

  // Calculate total amount paid so far
  const totalPaidAmount = props.receiptData.invoices.reduce((sum, invoice) => {
    return sum + parseFloat(invoice.paid_amount || 0);
  }, 0);

  // Remaining balance = total fee - total paid
  const remainingBalance = totalFeeAmount - totalPaidAmount;

  return Math.max(0, remainingBalance);
};

const getReceiptTitle = () => {
  if (isCombinedPayment.value) {
    return 'MULTIPLE MONTHS PAYMENT RECEIPT';
  }
  if (isInstallmentPayment.value) {
    if (props.receiptData.invoices && props.receiptData.invoices.length > 1) {
      return 'INSTALLMENT PAYMENT RECEIPT';
    }
    return 'INSTALLMENT RECEIPT';
  }
  return 'FEE RECEIPT';
};

const printReceipt = () => {
  isPrinting.value = true;

  // Create a new window for printing
  const printContent = receiptContainer.value.innerHTML;
  const printWindow = window.open('', '_blank');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt Print</title>
      <style>
        @page {
          margin: 0.3in;
          size: A4;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.2;
        }
        .receipt {
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
          background: white;
          border: 1px solid #ddd;
          padding: 15px;
          box-sizing: border-box;
        }
        .header {
          padding: 15px;
          border-bottom: 2px solid #333;
          background: #f8f9fa;
          display: flex;
          align-items: flex-start;
          gap: 15px;
        }
        .receipt-logo {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid #333;
          object-fit: contain;
          background: white;
          flex-shrink: 0;
        }
        .header-content {
          flex: 1;
          text-align: center;
        }
        .trust-name {
          font-size: 10px;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        .school-name {
          font-size: 14px;
          font-weight: bold;
          color: #000;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        .school-address {
          font-size: 10px;
          color: #666;
        }
        .receipt-title {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          color: #000;
          margin: 15px 0;
          text-transform: uppercase;
        }
        .receipt-info {
          padding: 10px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 11px;
        }
        .info-label {
          font-weight: bold;
          color: #333;
        }
        .info-value {
          color: #000;
          font-weight: 500;
        }
        .fee-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          border: 1px solid #ddd;
        }
        .fee-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          text-align: center;
          border: 1px solid #ddd;
          padding: 6px;
          font-size: 10px;
        }
        .fee-table td {
          text-align: left;
          border: 1px solid #ddd;
          padding: 6px;
          font-size: 10px;
        }
        .fee-table td:last-child {
          text-align: right;
        }
        .summary-section {
          margin: 10px 0;
          padding: 8px;
          background-color: #f8f9fa;
          border: 1px solid #ddd;
        }
        .remaining-info {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 8px;
          margin: 10px 0;
          border-radius: 3px;
        }
        .remaining-title {
          font-weight: bold;
          color: #856404;
          margin-bottom: 3px;
          font-size: 10px;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
        }
        .signature {
          text-align: center;
          font-size: 10px;
          color: #333;
          font-weight: 500;
        }
        .signature-line {
          width: 80px;
          border-top: 1px solid #000;
          margin: 3px auto;
        }
      </style>
    </head>
    <body>
      ${printContent}
    </body>
    </html>
  `);

  printWindow.document.close();

  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
    isPrinting.value = false;
  }, 500);
};

onMounted(() => {
  // Component mounted - no additional setup needed
});
</script>

<style scoped>
.receipt-viewer {
  max-width: 800px;
  margin: 0 auto;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

@media (max-width: 640px) {
  .receipt-viewer {
    padding: 5px;
    margin: 0;
    max-width: 100%;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 8px 8px 0 0;
  margin-bottom: 0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.modal-actions {
  display: flex;
  gap: 8px;
}

.receipt-container {
  display: flex;
  justify-content: center;
  padding: 10px;
  background: white;
  border-radius: 0 0 8px 8px;
}

.receipt {
  width: 400px;
  background: white;
  border: 1px solid #ddd;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  font-family: Arial, sans-serif;
  color: #000;
}

@media (max-width: 640px) {
  .receipt-container {
    padding: 5px;
  }

  .receipt {
    width: 100%;
    max-width: 350px;
    font-size: 12px;
  }
}

.receipt-print {
  box-shadow: none;
  border: none;
}

.header {
  padding: 20px 15px;
  border-bottom: 2px solid #333;
  background: #f8f9fa;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.receipt-logo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid #333;
  object-fit: contain;
  background: white;
  flex-shrink: 0;
}

.school-logo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid #333;
  object-fit: cover;
  flex-shrink: 0;
}

.header-content {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.trust-section {
  margin-bottom: 10px;
}

.trust-name {
  font-size: 12px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.school-section {
  margin-top: 5px;
}

.school-name {
  font-size: 16px;
  font-weight: bold;
  color: #000;
  margin-bottom: 5px;
  text-transform: uppercase;
  word-wrap: break-word;
  line-height: 1.2;
  max-width: 100%;
}

.school-type {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.school-address {
  font-size: 11px;
  color: #666;
  margin-bottom: 10px;
}

.receipt-title {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #000;
  margin: 15px 0;
  text-transform: uppercase;
}

.receipt-info {
  padding: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.info-label {
  font-weight: bold;
  color: #333;
}

.info-value {
  color: #000;
  font-weight: 500;
}

.receipt-number {
  font-weight: bold;
  color: #3b82f6;
  background-color: #e0f2fe;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #bbdefb;
}

.invoice-number {
  font-weight: bold;
  color: #dc2626;
  background-color: #fef2f2;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #fecaca;
}

.fee-table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
  border: 1px solid #ddd;
}

.table-header {
  background-color: #f8f9fa !important;
  font-weight: bold !important;
  color: #333 !important;
  text-align: center !important;
  border: 1px solid #ddd !important;
  padding: 8px !important;
  font-size: 12px !important;
}

.fee-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  text-align: center;
  border: 1px solid #ddd;
  padding: 8px;
  font-size: 12px;
  color: #333;
}

.fee-table td {
  text-align: left;
  border: 1px solid #ddd;
  padding: 8px;
  font-size: 11px;
  color: #000;
}

.fee-table td:last-child {
  text-align: right;
}

.summary-section {
  margin: 15px 0;
  padding: 10px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
}

.remaining-info {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  padding: 10px;
  margin: 15px 0;
  border-radius: 5px;
}

.remaining-title {
  font-weight: bold;
  color: #856404;
  margin-bottom: 5px;
}

.signature-section {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
}

.signature {
  text-align: center;
  font-size: 11px;
  color: #333;
  font-weight: 500;
}

.signature-line {
  width: 100px;
  border-top: 1px solid #000;
  margin: 5px auto;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 36px;
  height: 36px;
}

.print-button {
  background-color: #3b82f6;
  color: white;
}

.print-button:hover {
  background-color: #2563eb;
}

.download-button {
  background-color: #10b981;
  color: white;
}

.download-button:hover {
  background-color: #059669;
}

.close-button {
  background-color: #6b7280;
  color: white;
}

.close-button:hover {
  background-color: #4b5563;
}

@media (max-width: 640px) {
  .receipt {
    width: 100%;
    max-width: 350px;
    font-size: 11px;
  }

  .modal-header {
    padding: 8px 12px;
  }

  .modal-title {
    font-size: 14px;
  }

  .action-button {
    width: 28px;
    height: 28px;
    padding: 4px;
  }

  .header {
    padding: 10px;
    flex-direction: column;
    text-align: center;
  }

  .receipt-logo {
    width: 50px;
    height: 50px;
    margin: 0 auto 10px;
  }

  .school-name {
    font-size: 12px;
  }

  .receipt-title {
    font-size: 14px;
    margin: 10px 0;
  }

  .info-row {
    font-size: 10px;
    margin-bottom: 4px;
  }

  .fee-table th,
  .fee-table td {
    padding: 4px;
    font-size: 9px;
  }

  .signature-section {
    margin-top: 10px;
    padding-top: 8px;
  }

  .signature {
    font-size: 9px;
  }

  .signature-line {
    width: 60px;
  }
}
</style>
