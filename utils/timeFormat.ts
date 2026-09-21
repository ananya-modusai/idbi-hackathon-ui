import { formatDistanceToNow, format, parseISO, differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays, differenceInYears } from 'date-fns';

export type TimeFormat = 'relative' | 'absolute' | 'verbose';

export const formatTimestamp = (timestamp: string, type: TimeFormat = 'absolute'): string => {
  try {
    // Try to parse different date formats
    let date: Date;
    
    // Check if it's already a valid ISO string
    if (timestamp.includes('T') || timestamp.includes('Z')) {
      date = parseISO(timestamp);
    } else {
      // Handle format like "Mar 15, 14:30" or "2024-03-15 14:30"
      date = new Date(timestamp);
    }

    // Validate if we got a valid date
    if (isNaN(date.getTime())) {
      return timestamp;
    }
    
    if (type === 'relative') {
      const now = new Date();
      const diffSeconds = differenceInSeconds(now, date);
      const diffMinutes = differenceInMinutes(now, date);
      const diffHours = differenceInHours(now, date);
      const diffDays = differenceInDays(now, date);
      const diffYears = differenceInYears(now, date);

      if (diffSeconds < 60) return 'now';

      let value: number;
      let unit: string;

      if (diffMinutes < 60) {
        value = diffMinutes;
        unit = 'm';
      } else if (diffHours < 24) {
        value = diffHours;
        unit = 'h';
      } else if (diffDays < 365) {
        value = diffDays;
        unit = 'd';
      } else {
        value = diffYears;
        unit = 'y';
      }

      return `${value}${unit} ago`;
    } else if (type === 'verbose') {
      return format(date, 'PPpp');
    }
    
    return format(date, 'MMM d, HH:mm');
  } catch (error) {
    // If parsing fails, return original timestamp
    return timestamp;
  }
}; 

export const formatDateString = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateString) return 'N/A';
  
  try {
    // Handle dd-mm-yyyy format (like "31-03-2022")
    if (dateString.includes('-') && dateString.split('-').length === 3) {
      const parts = dateString.split('-');
      if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        // Convert dd-mm-yyyy to yyyy-mm-dd for proper Date parsing
        const [day, month, year] = parts;
        const isoDate = `${year}-${month}-${day}`;
        return new Date(isoDate).toLocaleDateString('en-US', options || {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }
    
    // Try standard date parsing for other formats
    return new Date(dateString).toLocaleDateString('en-US', options || {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}; 