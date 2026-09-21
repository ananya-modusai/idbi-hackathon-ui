import jsPDF from 'jspdf';
import { API } from '@/app/services/axios';

// Small reusable types to avoid `any` in this module
type AnyRecord = Record<string, unknown>;

// Typing for html2pdf chaining API used in this module
interface Html2PdfChain {
  set(options: AnyRecord): Html2PdfChain;
  from(element: HTMLElement): Html2PdfChain;
  toPdf(): Html2PdfChain;
  get(arg: string): Promise<jsPDF>;
  save(): Promise<void>;
}

type Html2PdfFactory = () => Html2PdfChain;

// Minimal typing for jsPDF internal object we use in post-processing
interface JsPdfInternal {
  getNumberOfPages(): number;
  pageSize: {
    getWidth(): number;
    getHeight(): number;
  };
}

// Common colors
export const colors = {
  blue: { r: 37, g: 99, b: 235 },
  grayDark: { r: 31, g: 41, b: 55 },
  gray: { r: 107, g: 114, b: 128 },
  borderGray: { r: 229, g: 231, b: 235 },
  red: { r: 220, g: 38, b: 38 },
  orange: { r: 234, g: 88, b: 12 },
  yellow: { r: 202, g: 138, b: 4 },
};

// Common dimensions and settings
export const pdfConfig = {
  pageWidth: 210,
  pageHeight: 297,
  margin: 10,
  headerHeight: 25,
  footerHeight: 15,
};

// Common text styles
export const textStyles = {
  title: {
    size: 20,
    font: 'helvetica',
    style: 'bold',
  },
  subtitle: {
    size: 14,
    font: 'helvetica',
    style: 'normal',
  },
  body: {
    size: 10,
    font: 'helvetica',
    style: 'normal',
  },
  small: {
    size: 8,
    font: 'helvetica',
    style: 'normal',
  },
};

// Header generation with company name, industry, and CIN
export const generateHeader = (
  pdf: jsPDF,
  companyName: string,
  industryText?: string,
  cinText?: string,
  reportTitle: string = 'Report'
) => {
  const { pageWidth, margin } = pdfConfig;
  const genDate = new Date().toLocaleDateString();

  // HEADER (Left: company name; below it industry/CIN)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(colors.grayDark.r, colors.grayDark.g, colors.grayDark.b);
  pdf.text(companyName, margin, 12);

  // Subtitle (industry or CIN)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  let subText = '';
  if (industryText) {
    subText = String(industryText);
  } else if (cinText) {
    subText = `CIN ${cinText}`;
  }
  if (subText) {
    pdf.text(subText, margin, 20);
  }

  // HEADER (Right: report title; below it generated on)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(reportTitle, pageWidth - margin, 12, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
  pdf.text(genDate, pageWidth - margin, 18, { align: 'right' });

  // Blue underline for header
  pdf.setDrawColor(colors.blue.r, colors.blue.g, colors.blue.b);
  pdf.setLineWidth(1);
  pdf.line(margin, 25, pageWidth - margin, 25);
};

// Footer generation
export const generateFooter = (pdf: jsPDF, pageNumber: number, totalPages: number) => {
  const { pageWidth, pageHeight, margin } = pdfConfig;
  
  pdf.setDrawColor(colors.borderGray.r, colors.borderGray.g, colors.borderGray.b);
  pdf.setLineWidth(0.5);
  pdf.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
  pdf.text(
    `Page ${pageNumber} of ${totalPages}`,
    pageWidth - margin,
    pageHeight - 12,
    { align: 'right' }
  );
  pdf.text(
    'This report contains confidential information.',
    margin,
    pageHeight - 12
  );
};

// Format numbers with commas and optional decimal places
export const formatNumber = (value: number, decimals: number = 2): string => {
  if (isNaN(value)) return '-';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Format currency amounts
export const formatCurrency = (value: number, currency: string = '₹'): string => {
  if (isNaN(value)) return '-';
  return `${currency}${formatNumber(value, 2)}`;
};

// Format percentage values
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (isNaN(value)) return '-';
  return `${formatNumber(value, decimals)}%`;
};

// Get severity color based on risk level
export const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'severe':
    case 'high':
      return colors.red;
    case 'medium':
      return colors.orange;
    case 'low':
      return colors.yellow;
    default:
      return colors.gray;
  }
};

// Calculate text width for positioning
export const getTextWidth = (pdf: jsPDF, text: string): number => {
  return pdf.getTextWidth(text);
};

// Add page with header and footer
export const addPage = (
  pdf: jsPDF, 
  pageNumber: number,
  totalPages: number,
  companyName: string,
  industryText?: string,
  cinText?: string,
  reportTitle?: string
) => {
  pdf.addPage();
  generateHeader(pdf, companyName, industryText, cinText, reportTitle);
  generateFooter(pdf, pageNumber, totalPages);
};

// Check if text will overflow and needs splitting
export const willTextOverflow = (
  pdf: jsPDF,
  text: string,
  x: number,
  maxWidth: number
): boolean => {
  const textWidth = pdf.getTextWidth(text);
  return textWidth > maxWidth - x;
};

// Split text into lines that fit within maxWidth
export const splitTextToFit = (
  pdf: jsPDF,
  text: string,
  maxWidth: number
): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (pdf.getTextWidth(testLine) <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
};

// Draw section header with title and optional icon
export const drawSectionHeader = (
  pdf: jsPDF,
  title: string,
  y: number,
  fontSize: number = 14
) => {
  const { margin, pageWidth } = pdfConfig;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(fontSize);
  pdf.setTextColor(colors.grayDark.r, colors.grayDark.g, colors.grayDark.b);
  pdf.text(title, margin, y);

  // Add a subtle underline
  pdf.setDrawColor(colors.borderGray.r, colors.borderGray.g, colors.borderGray.b);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y + 2, pageWidth - margin, y + 2);

  return y + 8; // Return the new Y position after the header
};

// Initialize PDF document with common settings
export const initializePDF = (): jsPDF => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  pdf.setFont('helvetica');
  return pdf;
};

// ---------------------------------------------------------------------------
// HTML->PDF wrapper utilities (replaces per-template pdfUtils files)
// These provide the same generateXxxPDF API used across the app but reuse the
// shared header/footer and helpers above.
// ---------------------------------------------------------------------------

const createLoadingElement = (text = 'Generating PDF...') => {
  const loadingElement = document.createElement('div');
  loadingElement.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
        <div style="margin-bottom: 10px;">${text}</div>
        <div style="width: 200px; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
          <div style="width: 0%; height: 100%; background: #2563eb; border-radius: 2px; animation: progress 3s ease-in-out infinite;"></div>
        </div>
      </div>
    </div>
    <style>
      @keyframes progress { 0% { width: 0%; } 50% { width: 70%; } 100% { width: 100%; } }
    </style>
  `;
  return loadingElement;
};

async function generateTemplatePDF(
  element: HTMLElement,
  merchantName: string,
  reportTitle = 'Report',
  merchantIndustry?: string | { industry: string; risk_segment: string } | null,
  merchantCIN?: string,
  options: AnyRecord = {}
): Promise<void> {
  // Build a complete HTML document to send to the server for rendering.
  // Include the current page's <link rel="stylesheet"> and <style> tags to preserve styles.
  const headNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')) as Element[];
  const headHtml = headNodes.map(n => n.outerHTML).join('\n');

  // Add a base tag so relative URLs (/_next/static/..., /public/...) resolve correctly
  const baseHref = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
  const baseTag = baseHref ? `<base href="${baseHref}">` : '';

  // Watermark removed - no longer injecting global watermark
  const injectedWatermarkCss = `
    /* Hide any template-level watermarks */
    .watermark { display: none !important; }

    /* Main content root */
    .pdf-export-root { position: relative; z-index: 1; }
  `;

  // Add print/layout normalization to avoid unexpected extra page when the
  // content slightly overflows the printable area due to padding/margins.
  // Reset html/body margins and reduce template bottom padding. Allow lists
  // to break naturally between items — only prevent splitting individual
  // red-flag items across pages.
  const printNormalizationCss = `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      height: auto !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      box-sizing: border-box;
    }
    *, *:before, *:after { box-sizing: inherit; }

    /* Reduce bottom padding/margins that can push content to another page */
    .pdf-redflags-template, .pdf-export-root {
      padding-bottom: 0 !important;
      margin-bottom: 0 !important;
    }

    /* Prevent splitting individual red-flag cards, but allow the list to break */
    .pdf-redflag-item {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    @media print {
      .pdf-redflags-template { padding-bottom: 6px !important; }
    }
  `;

  const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" />${baseTag}${headHtml}<style>${injectedWatermarkCss}</style></head><body><div class="pdf-export-root">${element.outerHTML}</div></body></html>`;

  let filename: string = String((options && (options as AnyRecord).filename) || `${merchantName.replace(/[^a-z0-9]/gi, ' ')} ${reportTitle}.pdf`);

  // Hardcoded merchant_id for now


  const loadingElement = createLoadingElement(`Generating ${reportTitle} PDF...`);
  try {
    document.body.appendChild(loadingElement);

    // Step 1: Get presigned PUT URL for HTML upload (use axios API client so auth interceptor runs)
    const urlResp = await API.post('/api/v1/report/generate-url', { merchant_id: merchantCIN });
    const { upload_url, s3_path, fields } = urlResp.data || {};
    if (!upload_url || !s3_path) {
      throw new Error('Invalid response from generate-url endpoint');
    }

    // Step 2: Upload HTML to presigned URL using form POST with fields
    const htmlBlob = new Blob([fullHtml], { type: 'text/html' });
    const formData = new FormData();
    if (fields && typeof fields === 'object') {
      Object.entries(fields as Record<string, unknown>).forEach(([k, v]) => {
        formData.append(k, String(v));
      });
    }
    // S3 expects the file field name to be 'file'
    formData.append('file', htmlBlob);

    const uploadResponse = await fetch(upload_url, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload HTML: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    // Step 3: Request PDF generation with S3 path
    const headerData = {
      merchantName,
      reportTitle,
      merchantIndustry,
      merchantCIN,
      runDate: (options as AnyRecord)?.runDate || null,
    };
    // remove space from file name and make it underscore
    filename = filename.replace(/\s+/g, '_');

    const pdfResp = await API.post('/api/v1/report/generate-pdf', {
      path: s3_path,
      filename,
      headerData,
      merchant_id: merchantCIN,
    });
    const { download_url } = pdfResp.data || {};
    if (!download_url) {
      throw new Error('No download URL received from PDF generation');
    }

    if (!download_url) {
      throw new Error('No download URL received from PDF generation');
    }

    // Step 4: Download PDF from presigned GET URL
    const downloadResponse = await fetch(download_url);

    if (!downloadResponse.ok) {
      throw new Error(`Failed to download PDF: ${downloadResponse.status} ${downloadResponse.statusText}`);
    }

    const arrayBuffer = await downloadResponse.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = String(filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    if (loadingElement && document.body.contains(loadingElement)) document.body.removeChild(loadingElement);
    console.log(`${reportTitle} PDF generated successfully (S3-based flow)`);
  } catch (error) {
    if (loadingElement && document.body.contains(loadingElement)) document.body.removeChild(loadingElement);
    const errorElement = document.createElement('div');
    errorElement.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: #dc2626; color: white; padding: 12px 16px; border-radius: 6px; z-index: 9999;">
        Failed to generate ${reportTitle} PDF. Please try again.
      </div>
    `;
    document.body.appendChild(errorElement);
    setTimeout(() => { if (document.body.contains(errorElement)) document.body.removeChild(errorElement); }, 3000);
    throw error;
  }

  
}

// Per-template exported helpers that keep existing signatures
export function generateOverviewPDF(
  element: HTMLElement,
  merchantName: string,
  merchantIndustry?: string | { industry: string; risk_segment: string } | null,
  merchantCIN?: string,
  options?: AnyRecord
): Promise<void> {
  return generateTemplatePDF(element, merchantName, 'Insolvency Overview Report', merchantIndustry, merchantCIN, options || {});
}

export function generateExternalInsightsPDF(
  element: HTMLElement,
  merchantName: string,
  merchantIndustry?: string | { industry: string; risk_segment: string } | null,
  merchantCIN?: string,
  options?: AnyRecord
): Promise<void> {
  return generateTemplatePDF(element, merchantName, 'External Insights Report', merchantIndustry, merchantCIN, options || {});
}

export function generateFullReportPDF(
  element: HTMLElement,
  merchantName: string,
  merchantIndustry?: string | { industry: string; risk_segment: string } | null,
  merchantCIN?: string,
  options?: AnyRecord
): Promise<void> {
  return generateTemplatePDF(element, merchantName, 'Insolvency Full Report', merchantIndustry, merchantCIN, options || {});
}

export function generateRedFlagsPDF(
  element: HTMLElement,
  merchantName: string,
  merchantIndustry?: string | { industry: string; risk_segment: string } | null,
  merchantCIN?: string,
  options?: AnyRecord
) {
  return generateTemplatePDF(element, merchantName, 'Red Flags Report', merchantIndustry, merchantCIN, options || {});
}

export function generateMetricsPDF(
  element: HTMLElement,
  merchantName: string,
  merchantIndustry?: string | { industry: string; risk_segment: string } | null,
  merchantCIN?: string,
  options?: AnyRecord
) {
  return generateTemplatePDF(element, merchantName, 'Metrics Report', merchantIndustry, merchantCIN, options || {});
}

export function generateFinancialOperationalPDF(
  element: HTMLElement,
  merchantName: string,
  merchantIndustry?: string | { industry: string; risk_segment: string } | null,
  merchantCIN?: string,
  options?: AnyRecord
) {
  return generateTemplatePDF(element, merchantName, 'Financial & Operational Report', merchantIndustry, merchantCIN, options || {});
}

export const preparePDFElement = (element: HTMLElement): Promise<void> => {
  // Keep backward-compatible prepare behavior
  element.style.width = '1122px';
  // Avoid forcing a fixed minHeight equal to the page height. Forcing a
  // full-page minHeight combined with header/footer margins can cause
  // the renderer to emit an extra blank page at the end of the PDF. Let
  // the content determine height instead.
  element.style.minHeight = 'auto';
  element.style.backgroundColor = 'white';
  element.style.color = '#333';
  element.style.fontFamily = 'Arial, sans-serif';

  // Note: do NOT hide `.pdf-header` here when using server-side rendering (puppeteer)
  // — templates may already include their own headers which should be preserved.
  const elementsToHide = element.querySelectorAll('.hide-for-pdf, button, .cursor-pointer');
  elementsToHide.forEach(el => { (el as HTMLElement).style.display = 'none'; });

  const images = element.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => new Promise(resolve => {
    if ((img as HTMLImageElement).complete) resolve(img); else { (img as HTMLImageElement).onload = () => resolve(img); (img as HTMLImageElement).onerror = () => resolve(img); }
  }));

  return Promise.all(imagePromises).then(() => { console.log('All images loaded for PDF generation'); }) as Promise<void>;
};