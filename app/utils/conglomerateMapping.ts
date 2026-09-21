// Shared conglomerate mapping utility
export const conglomerateMapping: Record<string, string> = {
  'ADANI DIGITAL LABS PRIVATE LIMITED': 'Adani Group',
  'AMAZON PAY (INDIA) PRIVATE LIMITED': 'Amazon Group'
};

// Helper function to get conglomerate name or 'None'
export const getConglomerateName = (merchantName: string | null | undefined): string => {
  if (!merchantName) return 'None';
  return conglomerateMapping[merchantName] || 'None';
};
