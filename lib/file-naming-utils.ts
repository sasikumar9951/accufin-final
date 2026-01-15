/**
 * Utility functions for handling file and folder naming conflicts
 */

/**
 * Generates a unique name for a file or folder by appending a number in parentheses
 * @param originalName - The original name of the file/folder
 * @param existingNames - Set of existing names (case-insensitive) in the target folder
 * @returns A unique name that doesn't conflict with existing names
 */
export function generateUniqueName(
  originalName: string,
  existingNames: Set<string>
): string {
  const lowerExistingNames = new Set(
    Array.from(existingNames).map(name => name.toLowerCase())
  );
  
  // If the original name doesn't conflict, return it
  if (!lowerExistingNames.has(originalName.toLowerCase())) {
    return originalName;
  }
  
  // Extract base name and extension for files
  const dotIndex = originalName.lastIndexOf('.');
  const isFile = dotIndex > 0;
  const nameWithoutExt = isFile ? originalName.slice(0, dotIndex) : originalName;
  const extension = isFile ? originalName.slice(dotIndex) : '';
  
  // Check if the name already has a number suffix like "name (1)" or "name(1)"
  const numberSuffixRegex = /^([^(]+)\s*\((\d{1,6})\)$/;
  const match = nameWithoutExt.match(numberSuffixRegex);
  
  let baseName: string;
  let startCounter: number;
  
  if (match) {
    // If it already has a number suffix, extract the base name and start from the next number
    baseName = match[1];
    startCounter = Number.parseInt(match[2]) + 1;
  } else {
    // If no number suffix, use the original name and start from 1
    baseName = nameWithoutExt;
    startCounter = 1;
  }
  
  // Find the next available number
  let counter = startCounter;
  let candidateName: string;
  
  do {
    candidateName = `${baseName} (${counter})${extension}`;
    counter++;
  } while (lowerExistingNames.has(candidateName.toLowerCase()));
  
  return candidateName;
}

/**
 * Generates unique names for multiple items, ensuring no conflicts between them
 * @param items - Array of items with names to make unique
 * @param existingNames - Set of existing names in the target folder
 * @returns Array of unique names for the items
 */
export function generateUniqueNamesForItems(
  items: Array<{ name: string }>,
  existingNames: Set<string>
): string[] {
  const lowerExistingNames = new Set(
    Array.from(existingNames).map(name => name.toLowerCase())
  );
  const usedNames = new Set<string>();
  const uniqueNames: string[] = [];
  
  for (const item of items) {
    const originalName = item.name || 'Unnamed';
    
    // Check against both existing names and previously processed names
    const allConflictingNames = new Set([
      ...lowerExistingNames,
      ...Array.from(usedNames).map(name => name.toLowerCase())
    ]);
    
    const uniqueName = generateUniqueName(originalName, allConflictingNames);
    uniqueNames.push(uniqueName);
    usedNames.add(uniqueName);
  }
  
  return uniqueNames;
}
