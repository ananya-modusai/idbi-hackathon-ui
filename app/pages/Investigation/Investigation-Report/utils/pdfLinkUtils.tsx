import React, { isValidElement } from 'react';

/**
 * Helper to render a value as a clickable link if it looks like a URL
 */
export const renderClickableValue = (val: any, className?: string) => {
  if (val === null || val === undefined || val === '') return 'N/A';
  
  const str = String(val).trim();
  
  // Basic URL detection
  const isUrl = str.startsWith('http://') || 
                str.startsWith('https://') || 
                (str.toLowerCase().startsWith('www.') && str.includes('.'));

  if (isUrl) {
    const href = str.toLowerCase().startsWith('www.') ? `https://${str}` : str;
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={className || "text-blue-600 hover:underline inline-block truncate max-w-full"}
        style={{ color: '#2563eb', textDecoration: 'underline' }}
        title={str}
      >
        {str}
      </a>
    );
  }
  
  return str;
};

/**
 * Helper to linkify URLs within a text string
 */
export const linkifyText = (text: any) => {
  if (text === null || text === undefined || text === '') return '';
  
  const str = String(text);
  // Improved regex to catch http/https and www.
  const urlRegex = /((?:https?:\/\/|www\.)[^\s,]+)/gi;
  const parts = str.split(urlRegex);
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      const href = part.toLowerCase().startsWith('www.') ? `https://${part}` : part;
      return (
        <a 
          key={i}
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:underline"
          style={{ color: '#2563eb', textDecoration: 'underline', marginRight: '4px' }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

/**
 * Helper to format a value for display, handling objects, arrays, and URLs
 */
export const formatDisplayValue = (val: any): React.ReactNode => {
  if (val === null || val === undefined || val === '') return 'N/A';
  
  // If it's already a React element, don't re-process it
  if (isValidElement(val)) return val;
  
  if (Array.isArray(val)) {
    if (val.length === 0) return 'None';
    const first = val[0];
    const more = val.length - 1;
    
    if (more > 0) {
      // Create a tooltip string from all values
      const fullText = val.map(v => {
        if (typeof v === 'object' && v !== null) {
          return v.url || v.name || v.value || JSON.stringify(v);
        }
        return String(v);
      }).join(', ');

      return (
        <span title={fullText}>
          {formatDisplayValue(first)} 
          <span className="text-gray-400 text-[10px] font-normal ml-1">
            (+{more} more)
          </span>
        </span>
      );
    }
    return formatDisplayValue(first);
  }
  
  if (typeof val === 'object' && val !== null) {
    // Check again for React elements inside objects if needed, 
    // but usually the top-level check is enough.
    
    // Handle common object patterns
    if (val.url) return renderClickableValue(val.url);
    if (val.name) return String(val.name);
    if (val.value) return formatDisplayValue(val.value);
    
    // If it's a generic object, try to show its values as a comma-separated string
    // Avoid serializing large objects or internal React structures
    try {
      const values = Object.values(val)
        .filter(v => typeof v !== 'object' && typeof v !== 'function' && typeof v !== 'symbol' && v !== null && v !== undefined)
        .map(String);
      
      if (values.length > 0) return values.join(', ');
    } catch (e) {
      return '[Data]';
    }
    
    return JSON.stringify(val);
  }
  
  // Use linkifyText for strings to handle multiple URLs correctly
  return linkifyText(val);
};
