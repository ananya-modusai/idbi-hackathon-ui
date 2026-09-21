const MONTHS: Record<string, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
  May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
  Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
};

/** "31 Mar, 2025" -> "As of 31 March 2025" */
export const formatAsOf = (v?: string | null): string => {
  if (!v) return '';
  const m = v.match(/^(\d{1,2})\s+([A-Za-z]{3}),?\s+(\d{4})$/);
  return m ? `As of ${m[1]} ${MONTHS[m[2]] || m[2]} ${m[3]}` : `As of ${v}`;
};
