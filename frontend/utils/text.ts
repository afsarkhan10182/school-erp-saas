/**
 * Text utilities for handling long text in the School ERP SaaS
 * Provides consistent truncation and display logic
 */

/**
 * Truncate text to a specified length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string | null | undefined, maxLength: number = 50): string {
  if (!text) return '';

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}

/**
 * Get CSS classes for truncating text with tooltip
 * @param maxWidth - Maximum width in pixels or Tailwind class
 * @returns Object with CSS classes and title attribute
 */
export function getTruncateClasses(maxWidth: string = '200px') {
  return {
    classes: `truncate max-w-[${maxWidth}]`,
    title: true // Indicates that title attribute should be used
  };
}

/**
 * Format school name for display with proper truncation
 * @param schoolName - The school name to format
 * @param maxLength - Maximum length before truncation
 * @returns Formatted school name
 */
export function formatSchoolName(
  schoolName: string | null | undefined,
  maxLength: number = 30
): string {
  if (!schoolName) return 'School ERP';

  // Remove extra whitespace
  const cleanName = schoolName.trim();

  // If name is short enough, return as is
  if (cleanName.length <= maxLength) {
    return cleanName;
  }

  // For long names, try to break at word boundaries
  const words = cleanName.split(' ');
  let result = '';

  for (const word of words) {
    if ((result + ' ' + word).trim().length <= maxLength) {
      result += (result ? ' ' : '') + word;
    } else {
      break;
    }
  }

  // If we couldn't fit any words, truncate the first word
  if (!result) {
    result = cleanName.substring(0, maxLength - 3) + '...';
  } else if (result.length < cleanName.length) {
    result += '...';
  }

  return result;
}

/**
 * Get responsive max width classes for different screen sizes
 * @param baseWidth - Base width for mobile
 * @param mdWidth - Width for medium screens
 * @param lgWidth - Width for large screens
 * @returns Tailwind CSS classes for responsive max width
 */
export function getResponsiveMaxWidth(
  baseWidth: string = '150px',
  mdWidth: string = '200px',
  lgWidth: string = '250px'
): string {
  return `max-w-[${baseWidth}] md:max-w-[${mdWidth}] lg:max-w-[${lgWidth}]`;
}

/**
 * Check if text is too long and needs truncation
 * @param text - The text to check
 * @param maxLength - Maximum allowed length
 * @returns True if text needs truncation
 */
export function needsTruncation(text: string | null | undefined, maxLength: number = 50): boolean {
  return text ? text.length > maxLength : false;
}

/**
 * Get tooltip text for truncated content
 * @param text - The full text
 * @param truncatedText - The truncated version
 * @returns Tooltip text if truncation occurred, empty string otherwise
 */
export function getTooltipText(text: string | null | undefined, truncatedText: string): string {
  if (!text || text === truncatedText) return '';
  return text;
}
