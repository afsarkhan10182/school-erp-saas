/**
 * Academic Year Utilities
 * Handles calculations for academic year months, payment sequences, and validation
 */

export interface AcademicMonth {
  value: number; // Calendar month number (1-12)
  label: string; // Display label (e.g., "June 2025")
  year: number; // Calendar year (e.g., 2025)
  academicMonth: number; // Academic month number (1-12)
  isCurrentMonth: boolean;
}

export interface AcademicYearInfo {
  academicYear: string; // e.g., "2025-2026"
  startingMonth: number; // e.g., 6 (June)
  months: AcademicMonth[];
}

/**
 * Get the correct calendar year for a given month in academic year context
 * @param monthValue - Calendar month number (1-12)
 * @param startingMonth - Academic year starting month (1-12)
 * @param academicYear - Academic year string (e.g., "2025-2026")
 * @returns Calendar year number
 */
export const getYearForMonth = (
  monthValue: number, 
  startingMonth: number = 6, 
  academicYear: string = '2025-2026'
): number => {
  // Extract the first year from academic year string (e.g., "2025-2026" -> 2025)
  const firstYear = parseInt(academicYear.split('-')[0]);
  
  // If month is >= starting month, it's in the first year
  // If month is < starting month, it's in the second year
  if (monthValue >= startingMonth) {
    return firstYear;
  } else {
    return firstYear + 1;
  }
};

/**
 * Get years for multiple months
 * @param monthValues - Array of calendar month numbers
 * @param startingMonth - Academic year starting month
 * @param academicYear - Academic year string
 * @returns Array of unique years
 */
export const getYearsForMonths = (
  monthValues: number[], 
  startingMonth: number = 6, 
  academicYear: string = '2025-2026'
): number[] => {
  const years = new Set<number>();
  monthValues.forEach(monthValue => {
    years.add(getYearForMonth(monthValue, startingMonth, academicYear));
  });
  return Array.from(years);
};

/**
 * Generate academic year months based on starting month and academic year
 * @param startingMonth - Academic year starting month (1-12)
 * @param academicYear - Academic year string (e.g., "2025-2026")
 * @returns Array of academic month objects
 */
export const generateAcademicYearMonths = (
  startingMonth: number = 6, 
  academicYear: string = '2025-2026'
): AcademicMonth[] => {
  const firstYear = parseInt(academicYear.split('-')[0]);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
  const currentYear = currentDate.getFullYear();
  
  const months: AcademicMonth[] = [];
  
  // Generate months from starting month to December (first year)
  for (let month = startingMonth; month <= 12; month++) {
    const year = firstYear;
    const isCurrentMonth = month === currentMonth && year === currentYear;
    
    months.push({
      value: month,
      label: `${getMonthName(month)} ${year}`,
      year: year,
      academicMonth: month - startingMonth + 1,
      isCurrentMonth: isCurrentMonth
    });
  }
  
  // Generate months from January to starting month - 1 (second year)
  for (let month = 1; month < startingMonth; month++) {
    const year = firstYear + 1;
    const isCurrentMonth = month === currentMonth && year === currentYear;
    
    months.push({
      value: month,
      label: `${getMonthName(month)} ${year}`,
      year: year,
      academicMonth: 12 - startingMonth + month + 1,
      isCurrentMonth: isCurrentMonth
    });
  }
  
  return months;
};

/**
 * Get month name from month number
 * @param monthNumber - Month number (1-12)
 * @returns Month name
 */
export const getMonthName = (monthNumber: number): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[monthNumber - 1] || 'Unknown';
};

/**
 * Get academic month name from academic month number
 * @param academicMonthNumber - Academic month number (1-12)
 * @returns Academic month name
 */
export const getAcademicMonthName = (academicMonthNumber: number): string => {
  const academicMonthNames = [
    '1st Month', '2nd Month', '3rd Month', '4th Month', '5th Month', '6th Month',
    '7th Month', '8th Month', '9th Month', '10th Month', '11th Month', '12th Month'
  ];
  return academicMonthNames[academicMonthNumber - 1] || 'Unknown';
};

/**
 * Check if a date falls within the academic year
 * @param date - Date to check
 * @param startingMonth - Academic year starting month
 * @param academicYear - Academic year string
 * @returns True if date is within academic year
 */
export const isDateInAcademicYear = (
  date: Date, 
  startingMonth: number = 6, 
  academicYear: string = '2025-2026'
): boolean => {
  const firstYear = parseInt(academicYear.split('-')[0]);
  const secondYear = firstYear + 1;
  
  const dateYear = date.getFullYear();
  const dateMonth = date.getMonth() + 1; // getMonth() returns 0-11
  
  // Check if date is in first year (starting month to December)
  if (dateYear === firstYear && dateMonth >= startingMonth) {
    return true;
  }
  
  // Check if date is in second year (January to starting month - 1)
  if (dateYear === secondYear && dateMonth < startingMonth) {
    return true;
  }
  
  return false;
};

/**
 * Get the academic year for a given date
 * @param date - Date to check
 * @param startingMonth - Academic year starting month
 * @returns Academic year string (e.g., "2025-2026")
 */
export const getAcademicYearForDate = (
  date: Date, 
  startingMonth: number = 6
): string => {
  const dateYear = date.getFullYear();
  const dateMonth = date.getMonth() + 1; // getMonth() returns 0-11
  
  // If date is before starting month, it belongs to previous academic year
  if (dateMonth < startingMonth) {
    return `${dateYear - 1}-${dateYear}`;
  } else {
    return `${dateYear}-${dateYear + 1}`;
  }
};

/**
 * Get the current academic year based on today's date
 * @param startingMonth - Academic year starting month
 * @returns Academic year string
 */
export const getCurrentAcademicYear = (startingMonth: number = 6): string => {
  return getAcademicYearForDate(new Date(), startingMonth);
};

/**
 * Format academic year months for API parameters
 * @param selectedMonths - Array of selected month values
 * @param startingMonth - Academic year starting month
 * @param academicYear - Academic year string
 * @returns Object with months and year parameters for API
 */
export const formatMonthsForAPI = (
  selectedMonths: number[], 
  startingMonth: number = 6, 
  academicYear: string = '2025-2026'
): { months: string; year: number; years: number[] } => {
  const years = getYearsForMonths(selectedMonths, startingMonth, academicYear);
  const primaryYear = years[0] || new Date().getFullYear();
  
  return {
    months: selectedMonths.join(','),
    year: primaryYear,
    years: years
  };
};

/**
 * Parse academic year string to get start and end years
 * @param academicYear - Academic year string (e.g., "2025-2026")
 * @returns Object with start and end years
 */
export const parseAcademicYear = (academicYear: string): { startYear: number; endYear: number } => {
  const [startYearStr, endYearStr] = academicYear.split('-');
  return {
    startYear: parseInt(startYearStr),
    endYear: parseInt(endYearStr)
  };
};

/**
 * Validate if academic year string is in correct format
 * @param academicYear - Academic year string to validate
 * @returns True if valid format
 */
export const isValidAcademicYearFormat = (academicYear: string): boolean => {
  const pattern = /^\d{4}-\d{4}$/;
  if (!pattern.test(academicYear)) {
    return false;
  }
  
  const { startYear, endYear } = parseAcademicYear(academicYear);
  return endYear === startYear + 1;
};

