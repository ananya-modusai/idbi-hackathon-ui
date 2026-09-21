
type AnyRecord = Record<string, unknown>;

import { API } from '@/app/services/axios';

export const pdfConfig = {
  pageWidth: 210,
  pageHeight: 297,
  margin: 10,
};

const createLoadingElement = (text = 'Generating PDF...') => {
  if (typeof document === 'undefined') return null;
  const loadingElement = document.createElement('div');
  loadingElement.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
        <div style="margin-bottom: 10px; font-family: sans-serif;">${text}</div>
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
  options: AnyRecord = {},
  // legacy param kept for compatibility with callers but not required
  endpoint = '/api/report/generate-pdf'
): Promise<void> {
  const headNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')) as Element[];
  const headHtml = headNodes.map(n => n.outerHTML).join('\n');

  const baseHref = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
  const baseTag = baseHref ? `<base href="${baseHref}">` : '';

  const injectedWatermarkCss = `
    .watermark { display: none !important; }
    .pdf-export-root { position: relative; z-index: 1; }
  `;

  const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" />${baseTag}${headHtml}<style>${injectedWatermarkCss}</style></head><body><div class="pdf-export-root">${element.outerHTML}</div></body></html>`;

  let filename: string = String((options && (options as AnyRecord).filename) || `${merchantName.replace(/[^a-z0-9]/gi, ' ')} ${reportTitle}.pdf`);
  filename = filename.replace(/\s+/g, '_');

  const loadingElement = typeof document !== 'undefined' ? createLoadingElement(`Generating ${reportTitle} PDF...`) : null;
  try {
    if (loadingElement) document.body.appendChild(loadingElement);

    // Build header data to send to backend
    const headerData = {
      merchantName,
      reportTitle,
      merchantIndustry,
      merchantCIN,
      website: options.website || '',
      runDate: (options as AnyRecord)?.runDate || null,
      riskScore: (options.riskScore !== undefined && options.riskScore !== null) ? String(options.riskScore) : '',
      riskLabel: (options.riskLabel !== undefined && options.riskLabel !== null) ? String(options.riskLabel) : '',
      riskColor: (options.riskColor !== undefined && options.riskColor !== null) ? String(options.riskColor) : '',
    };


    // Use NEXT_PUBLIC_API_URL when provided; otherwise fallback to relative endpoints
    const apiBase = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL)
      ? String(process.env.NEXT_PUBLIC_API_URL)
      : '';

    // Step 1: Request a secure upload slot for HTML using axios API client (includes auth)
    const urlResp = await API.post('/api/v1/report/generate-investigation-url', { merchant_id: merchantCIN });
    const { upload_url, fields, s3_path } = urlResp.data || {};
    if (!upload_url || !s3_path) {
      throw new Error('Invalid response from generate-investigation-url endpoint');
    }

    // Step 2: Upload HTML to S3 using the returned upload_url and fields
    const htmlBlob = new Blob([fullHtml], { type: 'text/html' });
    const formData = new FormData();
    if (fields && typeof fields === 'object') {
      Object.entries(fields as Record<string, unknown>).forEach(([k, v]) => {
        formData.append(k, String(v));
      });
    }
    // S3 expects the file field to be 'file'
    formData.append('file', htmlBlob);

    const uploadResponse = await fetch(upload_url, { method: 'POST', body: formData });
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload HTML to S3: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    // Step 3: Request PDF generation from the server using the s3 path (axios client sends auth)
    const pdfResp = await API.post('/api/v1/report/generate-investigation-pdf', {
      path: s3_path,
      filename,
      headerData,
      merchant_id: merchantCIN,
    });
    const { download_url } = pdfResp.data || {};
    if (!download_url) {
      throw new Error('No download URL received from PDF generation');
    }

    // Download generated PDF from presigned URL
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
  } catch (error) {
    if (loadingElement && document.body.contains(loadingElement)) document.body.removeChild(loadingElement);
    console.error('PDF generation error:', error);
    throw error;
  }
}

export function generateInvestigationReportPDF(
  element: HTMLElement,
  merchantName: string,
  merchantIndustry?: string | { industry: string; risk_segment: string } | null,
  merchantCIN?: string,
  options?: AnyRecord
): Promise<void> {
  return generateTemplatePDF(
    element, 
    merchantName, 
    'Merchant Investigation Report', 
    merchantIndustry, 
    merchantCIN, 
    options || {},
    '/api/report/generate-investigation-pdf'
  );
}

export const preparePDFElement = (element: HTMLElement): Promise<void> => {
  element.style.width = '1122px';
  element.style.minHeight = 'auto';
  element.style.backgroundColor = 'white';
  element.style.color = '#333';
  element.style.fontFamily = 'Arial, sans-serif';

  const elementsToHide = element.querySelectorAll('.hide-for-pdf, button, .cursor-pointer, .inv-carousel-nav');
  elementsToHide.forEach(el => { (el as HTMLElement).style.display = 'none'; });

  const images = element.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => new Promise(resolve => {
    if ((img as HTMLImageElement).complete) resolve(img); else { (img as HTMLImageElement).onload = () => resolve(img); (img as HTMLImageElement).onerror = () => resolve(img); }
  }));

  return Promise.all(imagePromises) as Promise<any>;
};
