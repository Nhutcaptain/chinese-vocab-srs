import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type DiffPart = {
  value: string;
  type: 'added' | 'removed' | 'equal';
};

/**
 * A simple character-by-character diff algorithm for comparison.
 */
export function getDiff(input: string, expected: string): DiffPart[] {
  const result: DiffPart[] = [];
  const inputChars = Array.from(input);
  const expectedChars = Array.from(expected);
  
  let i = 0;
  let j = 0;
  
  while (i < inputChars.length || j < expectedChars.length) {
    if (i < inputChars.length && j < expectedChars.length && inputChars[i] === expectedChars[j]) {
      result.push({ value: inputChars[i], type: 'equal' });
      i++;
      j++;
    } else {
      // Very simple greedy diff:
      // If characters mismatch, we look if the expected char exists later in input or vice versa.
      // For simplicity in a language learning context, we'll mark the input char as wrong (removed) 
      // and show the expected char as missing (added).
      if (i < inputChars.length && j < expectedChars.length) {
        result.push({ value: inputChars[i], type: 'removed' }); // Red
        result.push({ value: expectedChars[j], type: 'added' });  // Green
        i++;
        j++;
      } else if (i < inputChars.length) {
        result.push({ value: inputChars[i], type: 'removed' });
        i++;
      } else if (j < expectedChars.length) {
        result.push({ value: expectedChars[j], type: 'added' });
        j++;
      }
    }
  }
  
  return result;
}
