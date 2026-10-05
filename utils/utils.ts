import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Indian digit grouping: a comma after the first 3 digits from the right, then
 * after every 2 (1,23,45,678). Returns '-' for null/undefined so callers can
 * drop it straight into a cell.
 */
export function formatIndianNumber(num: number | null | undefined, decimals?: number): string {
  if (num === null || num === undefined) return '-';

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const numStr = decimals !== undefined ? absNum.toFixed(decimals) : absNum.toString();
  const [integerPart, decimalPart] = numStr.split('.');

  // Build right-to-left, so the 3-then-2 grouping is a simple index test.
  const reversed = integerPart.split('').reverse().join('');
  let formatted = '';
  for (let i = 0; i < reversed.length; i++) {
    if (i === 3 || (i > 3 && (i - 3) % 2 === 0)) {
      formatted += ',';
    }
    formatted += reversed[i];
  }
  formatted = formatted.split('').reverse().join('');

  if (decimalPart) {
    formatted += '.' + decimalPart;
  }

  return isNegative ? '-' + formatted : formatted;
}
