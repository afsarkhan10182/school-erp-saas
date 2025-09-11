/**
 * Image URL utilities for the School ERP SaaS
 * Centralized, reusable, and future-proof image URL generation
 */

// Get API base from runtime config
function getApiBase(): string {
  if (process.client) {
    // Client-side: use runtime config
    const config = useRuntimeConfig();
    return config.public?.apiBase || '';
  }
  return '';
}

/**
 * Generate image URL for any uploaded file
 * @param filename - The filename of the uploaded image
 * @param type - The upload type (logos, profile-images, documents, id-cards)
 * @param schoolCode - The school code for the image path
 * @param apiBase - Optional API base URL
 * @param year - Optional year, defaults to current year
 * @returns Complete URL to the image
 */
export function getImageUrl(
  filename: string | null | undefined,
  type: 'logos' | 'profile-images' | 'documents' | 'id-cards',
  schoolCode?: string,
  apiBase?: string,
  year?: number
): string {
  if (!filename) return '';

  // Handle data URLs (preview images)
  if (filename.startsWith('data:')) return filename;

  // If no school code provided, return empty string to prevent broken URLs
  if (!schoolCode) {
    console.warn('⚠️ No school code provided for image URL generation');
    return '';
  }

  // Use provided apiBase or get from runtime config
  const baseUrl = apiBase || getApiBase();
  if (!baseUrl) {
    console.warn('⚠️ No API base available for image URL generation');
    return '';
  }

  const backendBase = baseUrl.replace('/api', '');
  const currentYear = year || new Date().getFullYear();

  const imageUrl = `${backendBase}/uploads/schools/${schoolCode}/${currentYear}/${type}/${filename}`;
  console.log(imageUrl);
  return imageUrl;
}

/**
 * Generate logo URL (commonly used for school/branch logos)
 * @param filename - The filename of the logo
 * @param year - Optional year, defaults to current year
 * @returns Complete URL to the logo
 */
export function getLogoUrl(
  filename: string | null | undefined,
  schoolCode?: string,
  apiBase?: string,
  year?: number
): string {
  return getImageUrl(filename, 'logos', schoolCode, apiBase, year);
}

/**
 * Generate profile image URL (commonly used for user profile pictures)
 * @param filename - The filename of the profile image
 * @param schoolCode - The school code for the image path
 * @param apiBase - Optional API base URL
 * @param year - Optional year, defaults to current year
 * @returns Complete URL to the profile image
 */
export function getProfileImageUrl(
  filename: string | null | undefined,
  schoolCode?: string,
  apiBase?: string,
  year?: number
): string {
  return getImageUrl(filename, 'profile-images', schoolCode, apiBase, year);
}

/**
 * Generate document URL (commonly used for student documents)
 * @param filename - The filename of the document
 * @param year - Optional year, defaults to current year
 * @returns Complete URL to the document
 */
export function getDocumentUrl(
  filename: string | null | undefined,
  schoolCode?: string,
  apiBase?: string,
  year?: number
): string {
  return getImageUrl(filename, 'documents', schoolCode, apiBase, year);
}

/**
 * Generate ID card URL (commonly used for student ID cards)
 * @param filename - The filename of the ID card
 * @param year - Optional year, defaults to current year
 * @returns Complete URL to the ID card
 */
export function getIdCardUrl(
  filename: string | null | undefined,
  schoolCode?: string,
  apiBase?: string,
  year?: number
): string {
  return getImageUrl(filename, 'id-cards', schoolCode, apiBase, year);
}

/**
 * Check if a filename represents a valid image
 * @param filename - The filename to check
 * @returns True if it's a valid image filename
 */
export function isValidImageFilename(filename: string | null | undefined): boolean {
  if (!filename) return false;

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));

  return imageExtensions.includes(extension);
}

/**
 * Get image placeholder URL for missing images
 * @param type - The type of placeholder needed
 * @returns Placeholder URL
 */
export function getImagePlaceholder(type: 'logo' | 'profile' | 'document' = 'logo'): string {
  const placeholders = {
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEg0MFY0MEgyNFYyNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+',
    profile:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTIiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE2IDUyQzE2IDQ0LjI2ODcgMjIuMjY4NyAzOCAzMCAzOEgzNEM0MS43MzEzIDM4IDQ4IDQ0LjI2ODcgNDggNTJWNjRIMTZWNTRaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPg==',
    document:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAxNkg0MFY0OEgyNFYxNloiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI4IDI0SDM2VjI4SDI4VjI0WiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMjggMzJIMzZWMzZIMjhWMzJaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0yOCA0MEgzNlY0NEgyOFY0MFoiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+'
  };

  return placeholders[type];
}
