import clsx, {type ClassArray} from "clsx";
import {twMerge} from "tailwind-merge";

/**
 * Utility function to combine class names conditionally and merge Tailwind CSS classes.
 * @param inputs - Class names or objects with conditional class names.
 * @returns A single string of merged class names.
 */
export function cn(...inputs: ClassArray) {
  return twMerge(clsx(inputs));
}
