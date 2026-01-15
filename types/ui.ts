/**
 * Common UI-related types used across the application
 */

/**
 * Image fit mode for avatar and profile images
 * - 'fit': object-contain - maintains aspect ratio, may show padding
 * - 'fill': object-cover - covers entire container, may crop image
 * - 'stretch': object-fill - stretches to fit container, may distort
 */
export type ImageFitMode = 'fit' | 'fill' | 'stretch';

/**
 * Helper function to get CSS class for image fit mode
 */
export const getImageFitClass = (mode?: ImageFitMode): string => {
  if (mode === 'fit') return 'object-contain';
  if (mode === 'stretch') return 'object-fill';
  return 'object-cover';
};

/**
 * Validates if a string is a valid ImageFitMode
 */
export const isValidImageFitMode = (value: string): value is ImageFitMode => {
  return value === 'fit' || value === 'fill' || value === 'stretch';
};