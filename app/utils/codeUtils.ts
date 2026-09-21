export function detectLanguage(code: string): string {
  // Simple language detection based on common patterns
  if (code.includes('import pandas') || code.includes('def ')) {
    return 'python';
  }
  if (code.includes('function') || code.includes('const ')) {
    return 'javascript';
  }
  // Add more language detection patterns as needed
  return 'plaintext';
} 