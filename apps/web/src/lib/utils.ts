import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Valid skill categories for badge variants
const VALID_CATEGORIES = ['sourcing', 'ats', 'communication', 'scheduling', 'productivity', 'system'] as const;
type CategoryVariant = typeof VALID_CATEGORIES[number];

/**
 * Safely converts a category string to a badge variant.
 * Returns 'secondary' for invalid/unknown categories.
 */
export function getCategoryBadgeVariant(category: string): CategoryVariant | 'secondary' {
  if (VALID_CATEGORIES.includes(category as CategoryVariant)) {
    return category as CategoryVariant;
  }
  return 'secondary';
}
