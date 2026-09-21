import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toPascalCase(str: string) {
  if (!str) return '';
  return (str.match(/[a-zA-Z0-9]+/g) || [])
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

export function formatTitleCase(str: string): string {
  if (!str) return "";
  const minorWords = new Set([
    "and", "or", "but", "nor", "yet", "so", "for",
    "a", "an", "the",
    "of", "to", "in", "for", "on", "by", "at", "with", "from", "as", "into", "like"
  ]);
  return str
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return "";
      const lowerWord = word.toLowerCase();
      // Handle punctuation prefix if any, e.g. (of -> of
      const cleanWord = lowerWord.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
      
      if (index === 0 || !minorWords.has(cleanWord)) {
        // Capitalize the first letter of the word (or first letter after leading punctuation)
        const match = word.match(/[a-zA-Z0-9]/);
        if (match && match.index !== undefined) {
          const idx = match.index;
          return word.slice(0, idx) + word.charAt(idx).toUpperCase() + word.slice(idx + 1).toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return lowerWord;
    })
    .join(" ");
}

