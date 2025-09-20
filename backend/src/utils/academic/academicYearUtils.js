/**
 * Academic Year Utilities
 * Handles calculations for academic year months, payment sequences, and validation
 */

const { logger } = require('~/utils/shared/logger');

/**
 * Get the current academic year (no fallbacks - must be set by super admin)
 * @returns {Promise<Object>} Current academic year object
 * @throws {Error} If no current academic year is found
 */
const getCurrentAcademicYearForSchool = async () => {
  try {
    const { AcademicYear } = require('~/models');

    // Get the academic year where is_current = true
    const currentYear = await AcademicYear.findOne({
      where: { is_current: true }
    });

    if (!currentYear) {
      throw new Error(
        'No current academic year is set. Please contact the administrator to set the current academic year.'
      );
    }

    logger.info(`Using current academic year: ${currentYear.name}`);
    return currentYear;
  } catch (error) {
    logger.error('Error getting current academic year:', error);
    throw error; // Re-throw to let controllers handle it
  }
};

/**
 * Get the academic year months based on starting month
 * @param {number} startingMonth - Month when academic year starts (1-12)
 * @param {string} academicYear - Academic year (e.g., "2025-2026")
 * @returns {Array} Array of month objects with month, year, and display info
 */
const getAcademicYearMonths = (startingMonth, academicYear) => {
  const months = [];
  const [startYear] = academicYear.split('-').map(Number);

  for (let i = 0; i < 12; i++) {
    const monthNumber = startingMonth + i;
    let year = startYear;

    // If month goes beyond December, adjust year
    if (monthNumber > 12) {
      year = startYear + 1;
    }

    const actualMonth = monthNumber > 12 ? monthNumber - 12 : monthNumber;

    months.push({
      month: actualMonth,
      year: year,
      display: `${getMonthName(actualMonth)} ${year}`,
      academicMonth: i + 1, // 1-12 for academic year sequence
      isCurrentMonth: isCurrentAcademicMonth(actualMonth, year, startingMonth)
    });
  }

  return months;
};

/**
 * Get month name from month number
 * @param {number} month - Month number (1-12)
 * @returns {string} Month name
 */
const getMonthName = month => {
  // Validate input
  if (!month || typeof month !== 'number' || month < 1 || month > 12) {
    console.warn(`Invalid month number: ${month}. Returning 'Unknown'.`);
    return 'Unknown';
  }

  const monthNames = [
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
  return monthNames[month - 1] || 'Unknown';
};

/**
 * Check if a month is the current academic month
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year
 * @param {number} startingMonth - Academic year starting month
 * @returns {boolean} True if it's the current academic month
 */
const isCurrentAcademicMonth = (month, year, startingMonth) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // Calculate academic year for current date
  let academicYear = currentYear;
  if (currentMonth < startingMonth) {
    academicYear = currentYear - 1;
  }

  return month === currentMonth && year === currentYear;
};

/**
 * Get the earliest pending month for a student
 * @param {Array} invoices - Array of student invoices
 * @param {number} startingMonth - Academic year starting month
 * @returns {Object|null} Earliest pending month or null if all paid
 */
const getEarliestPendingMonth = (invoices, startingMonth) => {
  // Validate inputs
  if (!Array.isArray(invoices)) {
    throw new Error('Invoices must be an array');
  }

  if (
    !startingMonth ||
    typeof startingMonth !== 'number' ||
    startingMonth < 1 ||
    startingMonth > 12
  ) {
    throw new Error('Starting month must be a valid number between 1 and 12');
  }

  // Filter monthly invoices and sort by academic month sequence
  const monthlyInvoices = invoices
    .filter(inv => {
      // Ensure invoice has required properties
      if (!inv || typeof inv !== 'object') return false;

      // Check if it's a monthly payment
      const isMonthly =
        inv.payment_model === 'monthly' ||
        (inv.feeStructure && inv.feeStructure.payment_model === 'monthly');

      // Ensure month and year are valid numbers
      const hasValidMonth =
        inv.month && typeof inv.month === 'number' && inv.month >= 1 && inv.month <= 12;
      const hasValidYear =
        inv.year && typeof inv.year === 'number' && inv.year >= 2000 && inv.year <= 2100;

      return isMonthly && hasValidMonth && hasValidYear;
    })
    .sort((a, b) => {
      try {
        // Sort by academic month sequence
        const aAcademicMonth = getAcademicMonthNumber(a.month, a.year, startingMonth);
        const bAcademicMonth = getAcademicMonthNumber(b.month, b.year, startingMonth);
        return aAcademicMonth - bAcademicMonth;
      } catch (error) {
        console.error('Error sorting invoices:', error);
        return 0;
      }
    });

  // Find the first unpaid invoice
  const firstUnpaid = monthlyInvoices.find(
    inv =>
      inv.status === 'sent' ||
      inv.status === 'overdue' ||
      (inv.status === 'partial_paid' && inv.balance_amount > 0)
  );

  return firstUnpaid || null;
};

/**
 * Get academic month number (1-12) for a given month/year
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year
 * @param {number} startingMonth - Academic year starting month
 * @returns {number} Academic month number (1-12)
 */
const getAcademicMonthNumber = (month, year, startingMonth) => {
  // Validate inputs
  if (!month || typeof month !== 'number' || month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Month must be a number between 1 and 12.`);
  }

  if (!year || typeof year !== 'number' || year < 2000 || year > 2100) {
    throw new Error(`Invalid year: ${year}. Year must be a number between 2000 and 2100.`);
  }

  if (
    !startingMonth ||
    typeof startingMonth !== 'number' ||
    startingMonth < 1 ||
    startingMonth > 12
  ) {
    throw new Error(
      `Invalid starting month: ${startingMonth}. Starting month must be a number between 1 and 12.`
    );
  }

  // This is a simplified calculation - in practice you'd need the academic year context
  // For now, assuming the month is within the current academic year
  if (month >= startingMonth) {
    return month - startingMonth + 1;
  } else {
    return month + (12 - startingMonth) + 1;
  }
};

/**
 * Validate payment sequence for monthly fees
 * @param {Array} selectedInvoices - Invoices user wants to pay
 * @param {Array} allInvoices - All student invoices
 * @param {number} startingMonth - Academic year starting month
 * @returns {Object} Validation result with isValid and error message
 */
const validatePaymentSequence = (selectedInvoices, allInvoices, startingMonth) => {
  // Get all monthly invoices sorted by academic month
  const monthlyInvoices = allInvoices
    .filter(
      inv =>
        inv.payment_model === 'monthly' ||
        (inv.feeStructure && inv.feeStructure.payment_model === 'monthly')
    )
    .sort((a, b) => {
      const aAcademicMonth = getAcademicMonthNumber(a.month, a.year, startingMonth);
      const bAcademicMonth = getAcademicMonthNumber(b.month, b.year, startingMonth);
      return aAcademicMonth - bAcademicMonth;
    });

  // Find the earliest pending month
  const earliestPending = monthlyInvoices.find(
    inv =>
      inv.status === 'sent' ||
      inv.status === 'overdue' ||
      (inv.status === 'partial_paid' && inv.balance_amount > 0)
  );

  if (!earliestPending) {
    return { isValid: true, message: 'All invoices are paid' };
  }

  // Check if selected invoices include the earliest pending month
  const selectedInvoiceIds = selectedInvoices.map(inv => inv.id);
  const hasEarliestPending = selectedInvoiceIds.includes(earliestPending.id);

  if (!hasEarliestPending) {
    const monthName = getMonthName(earliestPending.month);
    return {
      isValid: false,
      message: `You must pay ${monthName} ${earliestPending.year} before paying other months. Payment sequence must be maintained.`
    };
  }

  // Check if all selected invoices are in sequence
  const selectedSorted = selectedInvoices.sort((a, b) => {
    const aAcademicMonth = getAcademicMonthNumber(a.month, a.year, startingMonth);
    const bAcademicMonth = getAcademicMonthNumber(b.month, b.year, startingMonth);
    return aAcademicMonth - bAcademicMonth;
  });

  // Verify they are consecutive starting from earliest pending
  const earliestSelected = selectedSorted[0];
  const earliestSelectedAcademicMonth = getAcademicMonthNumber(
    earliestSelected.month,
    earliestSelected.year,
    startingMonth
  );

  const earliestPendingAcademicMonth = getAcademicMonthNumber(
    earliestPending.month,
    earliestPending.year,
    startingMonth
  );

  if (earliestSelectedAcademicMonth !== earliestPendingAcademicMonth) {
    const monthName = getMonthName(earliestPending.month);
    return {
      isValid: false,
      message: `You must pay ${monthName} ${earliestPending.year} first. Cannot skip months.`
    };
  }

  // Check if selected months are consecutive
  for (let i = 1; i < selectedSorted.length; i++) {
    const prev = selectedSorted[i - 1];
    const curr = selectedSorted[i];

    const prevAcademicMonth = getAcademicMonthNumber(prev.month, prev.year, startingMonth);
    const currAcademicMonth = getAcademicMonthNumber(curr.month, curr.year, startingMonth);

    if (currAcademicMonth !== prevAcademicMonth + 1) {
      const prevMonthName = getMonthName(prev.month);
      const currMonthName = getMonthName(curr.month);
      return {
        isValid: false,
        message: `Cannot skip months. You selected ${prevMonthName} ${prev.year} and ${currMonthName} ${curr.year}, but there are unpaid months in between.`
      };
    }
  }

  return { isValid: true, message: 'Payment sequence is valid' };
};

/**
 * Get available months for payment (earliest pending and consecutive months)
 * @param {Array} invoices - All student invoices
 * @param {number} startingMonth - Academic year starting month
 * @param {number} maxMonths - Maximum months to return (default: 12)
 * @returns {Array} Array of available months for payment
 */
const getAvailablePaymentMonths = (invoices, startingMonth, maxMonths = 12) => {
  // Validate inputs
  if (!Array.isArray(invoices)) {
    throw new Error('Invoices must be an array');
  }

  if (
    !startingMonth ||
    typeof startingMonth !== 'number' ||
    startingMonth < 1 ||
    startingMonth > 12
  ) {
    throw new Error('Starting month must be a valid number between 1 and 12');
  }

  const monthlyInvoices = invoices
    .filter(inv => {
      // Ensure invoice has required properties
      if (!inv || typeof inv !== 'object') return false;

      // Check if it's a monthly payment
      const isMonthly =
        inv.payment_model === 'monthly' ||
        (inv.feeStructure && inv.feeStructure.payment_model === 'monthly');

      // Ensure month and year are valid numbers
      const hasValidMonth =
        inv.month && typeof inv.month === 'number' && inv.month >= 1 && inv.month <= 12;
      const hasValidYear =
        inv.year && typeof inv.year === 'number' && inv.year >= 2000 && inv.year <= 2100;

      return isMonthly && hasValidMonth && hasValidYear;
    })
    .sort((a, b) => {
      try {
        const aAcademicMonth = getAcademicMonthNumber(a.month, a.year, startingMonth);
        const bAcademicMonth = getAcademicMonthNumber(b.month, b.year, startingMonth);
        return aAcademicMonth - bAcademicMonth;
      } catch (error) {
        console.error('Error sorting invoices:', error);
        return 0;
      }
    });

  const availableMonths = [];
  let consecutiveCount = 0;

  for (const invoice of monthlyInvoices) {
    if (consecutiveCount >= maxMonths) break;

    const isPending =
      invoice.status === 'sent' ||
      invoice.status === 'overdue' ||
      (invoice.status === 'partial_paid' && invoice.balance_amount > 0);

    if (isPending) {
      availableMonths.push(invoice);
      consecutiveCount++;
    } else {
      // If we encounter a paid invoice, we can't continue
      break;
    }
  }

  return availableMonths;
};

/**
 * Sync all schools to the current global academic year
 * @returns {Promise<Object>} Result with updated count
 */
const syncSchoolsToCurrentAcademicYear = async () => {
  try {
    const { School, AcademicYear } = require('~/models');

    // Get the current global academic year
    const currentYear = await AcademicYear.findOne({
      where: { is_current: true }
    });

    if (!currentYear) {
      throw new Error('No current global academic year found');
    }

    // Update all schools to link to the current academic year
    const [updatedCount] = await School.update(
      { current_academic_year_id: currentYear.id },
      {
        where: {
          current_academic_year_id: { [require('sequelize').Op.ne]: currentYear.id }
        }
      }
    );

    logger.info(`Synced ${updatedCount} schools to current academic year: ${currentYear.name}`);

    return {
      success: true,
      updated_count: updatedCount,
      academic_year: currentYear.name
    };
  } catch (error) {
    logger.error('Error syncing schools to current academic year:', error);
    throw error;
  }
};

module.exports = {
  getAcademicYearMonths,
  getMonthName,
  isCurrentAcademicMonth,
  getAcademicMonthNumber,
  validatePaymentSequence,
  getAvailablePaymentMonths,
  getCurrentAcademicYearForSchool,
  syncSchoolsToCurrentAcademicYear
};
