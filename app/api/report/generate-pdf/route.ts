import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const formatRunDate = (value?: string | null): string => {
  if (!value) return "N/A";
  
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  // Add 5 hours and 30 minutes offset for IST
  date.setHours(date.getHours() + 5);
  date.setMinutes(date.getMinutes() + 30);

  const day = String(date.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strHours = String(hours).padStart(2, "0");
  
  return `${day} ${monthName} ${year}, ${strHours}:${minutes} ${ampm}`;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
  const { html, filename = 'report.pdf', options = {}, headerData = {} } = body || {};

  // Header data sent from client (merchantName, reportTitle, merchantIndustry, merchantCIN)
  // merchantIndustry can be a string or an object like { industry: string, risk_segment: string }
  const { merchantName = '', reportTitle = '', merchantIndustry = '', merchantCIN = '', runDate = null } = headerData as any;

  // Normalize merchantIndustry to a plain string for the header template to avoid '[object Object]'
  const merchantIndustryLabel = ((): string => {
    if (!merchantIndustry) return '';
    if (typeof merchantIndustry === 'string') return merchantIndustry;
    if (typeof merchantIndustry === 'object') {
      // Prefer `industry` field if present, otherwise try common alternatives
      // Support both { industry } and nested shapes gracefully
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mi: any = merchantIndustry;
      return String(mi.industry || mi.name || mi || '').trim();
    }
    return String(merchantIndustry);
  })();

    if (!html) return new Response('Missing html', { status: 400 });

    // Ensure the HTML contains a repeating watermark for every printed page.
    // Some callers may not run the client-side injector, so we defensively
    // inject the same pseudo-element CSS and body class server-side here.
    const watermarkCss = `
      /* Hide existing per-template watermarks to avoid duplicates */
      .watermark { display: none !important; }

      /* Inject a fixed DIV watermark with a unique id so it's not affected
         by template rules. Use a high z-index so it's visible on top of
         content (low opacity) and is repeated on every printed page. */
      #pdf-watermark-global {
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        transform-origin: center;
        font-weight: 800; letter-spacing: 4px; color: #000; opacity: 0.06;
        white-space: nowrap; user-select: none; pointer-events: none;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
        z-index: 9999; font-size: 140px; text-align: center; max-width: 90%; display:block; width:100%;
      }
      .pdf-export-root { position: relative; z-index: 1; }
      @media print { #pdf-watermark-global { font-size:140px; opacity:0.04; } }
    `;

  let processedHtml = String(html || '');
    // Inject style into <head> if not present
    if (!/pdf-export-root-wrapper/.test(processedHtml)) {
      if (/<head[^>]*>/i.test(processedHtml)) {
        processedHtml = processedHtml.replace(/<head([^>]*)>/i, `<head$1><style>${watermarkCss}</style>`);
      } else {
        // If <head> missing, create one after <!doctype html>
        processedHtml = processedHtml.replace(/<!doctype html>/i, `<!doctype html><head><style>${watermarkCss}</style></head>`);
      }
      // Insert the watermark DIV into the body and ensure a pdf-export-root
      // wrapper exists around the page content.
      if (/<body([^>]*)>/i.test(processedHtml)) {
        processedHtml = processedHtml.replace(/<body([^>]*)>/i, `<body$1><div id="pdf-watermark-global"></div><div class="pdf-export-root">`);
      } else {
        // If no body tag, wrap the entire HTML
        processedHtml = `<body><div id="pdf-watermark-global"></div><div class="pdf-export-root">${processedHtml}</div></body>`;
      }
      // close the wrapper before </body> if necessary
      if (/<\/body>/i.test(processedHtml) && !/<\/div>\s*<\/body>/i.test(processedHtml)) {
        processedHtml = processedHtml.replace(/<\/body>/i, `</div></body>`);
      } else if (!/<\/body>/i.test(processedHtml)) {
        processedHtml = `${processedHtml}</div>`;
      }
    }

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // Set content and wait for network to be mostly idle. Emulate screen so
    // the rendered CSS matches the UI (not print media styles).
    await page.setContent(processedHtml, { waitUntil: 'networkidle0' });
    try {
      await page.emulateMediaType('screen');
    } catch (e) {
      // Older puppeteer versions may not support emulateMediaType; continue.
    }

    // Build header/footer templates so each printed page has the same header/footer.
    const genDate = formatRunDate(runDate);
    // Header designed to match UI: large blue uppercase company name left, subtitle with CIN and generated date,
    // blue underline, logo on the right.
    // Use 10mm padding to match content margins (pdfConfig.margin = 10mm)
    // Logo SVG - increased size for better visibility while keeping header height constrained
    // SVG viewBox is 3845x1500, so to get larger height, width scales proportionally
    const logoSvg = `<svg width="154" height="60" viewBox="0 0 3845 1500" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; height:42px; width:auto; margin:0; padding:0;">
<path d="M3415.22 278.202C3415.75 275.336 3417.27 272.746 3419.52 270.883C3421.76 269.02 3424.58 268 3427.5 268C3430.42 268 3433.24 269.02 3435.48 270.883C3437.73 272.746 3439.25 275.336 3439.78 278.202L3452.92 347.661C3453.85 352.599 3456.25 357.141 3459.81 360.695C3463.36 364.248 3467.9 366.648 3472.84 367.581L3542.3 380.715C3545.16 381.251 3547.75 382.772 3549.62 385.016C3551.48 387.259 3552.5 390.084 3552.5 393C3552.5 395.916 3551.48 398.741 3549.62 400.984C3547.75 403.228 3545.16 404.749 3542.3 405.285L3472.84 418.419C3467.9 419.352 3463.36 421.752 3459.81 425.305C3456.25 428.859 3453.85 433.401 3452.92 438.339L3439.78 507.798C3439.25 510.664 3437.73 513.254 3435.48 515.117C3433.24 516.98 3430.42 518 3427.5 518C3424.58 518 3421.76 516.98 3419.52 515.117C3417.27 513.254 3415.75 510.664 3415.22 507.798L3402.08 438.339C3401.15 433.401 3398.75 428.859 3395.19 425.305C3391.64 421.752 3387.1 419.352 3382.16 418.419L3312.7 405.285C3309.84 404.749 3307.25 403.228 3305.38 400.984C3303.52 398.741 3302.5 395.916 3302.5 393C3302.5 390.084 3303.52 387.259 3305.38 385.016C3307.25 382.772 3309.84 381.251 3312.7 380.715L3382.16 367.581C3387.1 366.648 3391.64 364.248 3395.19 360.695C3398.75 357.141 3401.15 352.599 3402.08 347.661L3415.22 278.202Z" fill="#00285B"/>
<path d="M3515 280.5V338.5V280.5Z" fill="#00285B"/>
<path d="M3515 280.5V338.5" stroke="#00285B" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3544 308.5H3486H3544Z" fill="#00285B"/>
<path d="M3544 308.5H3486" stroke="#00285B" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3346 515.5C3362.02 515.5 3375 502.516 3375 486.5C3375 470.484 3362.02 457.5 3346 457.5C3329.98 457.5 3317 470.484 3317 486.5C3317 502.516 3329.98 515.5 3346 515.5Z" fill="#00285B"/>
<path d="M990.528 668.42C1014.89 668.42 1036.54 673.447 1055.49 683.5C1074.82 693.167 1089.9 708.247 1100.73 728.74C1111.94 749.233 1117.55 775.72 1117.55 808.2V988H1007.35V826.18C1007.35 803.753 1003.1 787.513 994.588 777.46C986.082 767.02 974.482 761.8 959.788 761.8C949.348 761.8 939.875 764.313 931.368 769.34C922.862 774.367 916.288 782.1 911.648 792.54C907.008 802.593 904.688 815.74 904.688 831.98V988H794.488V826.18C794.488 803.753 790.235 787.513 781.728 777.46C773.608 767.02 762.008 761.8 746.928 761.8C736.102 761.8 726.435 764.313 717.928 769.34C709.808 774.367 703.235 782.1 698.208 792.54C693.568 802.593 691.248 815.74 691.248 831.98V988H581.048V673.64H686.028V761.22L665.148 736.28C676.748 713.853 692.602 697.033 712.708 685.82C732.815 674.22 755.242 668.42 779.988 668.42C808.215 668.42 832.962 675.767 854.228 690.46C875.882 704.767 890.382 727.193 897.728 757.74L861.768 750.2C872.982 724.68 889.802 704.767 912.228 690.46C935.042 675.767 961.142 668.42 990.528 668.42ZM1337.23 993.22C1302.81 993.22 1272.27 986.26 1245.59 972.34C1218.91 958.42 1197.83 939.28 1182.37 914.92C1167.29 890.173 1159.75 861.947 1159.75 830.24C1159.75 798.533 1167.29 770.5 1182.37 746.14C1197.83 721.78 1218.91 702.833 1245.59 689.3C1272.27 675.38 1302.81 668.42 1337.23 668.42C1371.64 668.42 1402.19 675.38 1428.87 689.3C1455.93 702.833 1477.01 721.78 1492.09 746.14C1507.17 770.5 1514.71 798.533 1514.71 830.24C1514.71 861.947 1507.17 890.173 1492.09 914.92C1477.01 939.28 1455.93 958.42 1428.87 972.34C1402.19 986.26 1371.64 993.22 1337.23 993.22ZM1337.23 905.64C1349.99 905.64 1361.2 902.74 1370.87 896.94C1380.92 891.14 1388.85 882.633 1394.65 871.42C1400.45 859.82 1403.35 846.093 1403.35 830.24C1403.35 814.387 1400.45 801.047 1394.65 790.22C1388.85 779.007 1380.92 770.5 1370.87 764.7C1361.2 758.9 1349.99 756 1337.23 756C1324.85 756 1313.64 758.9 1303.59 764.7C1293.92 770.5 1285.99 779.007 1279.81 790.22C1274.01 801.047 1271.11 814.387 1271.11 830.24C1271.11 846.093 1274.01 859.82 1279.81 871.42C1285.99 882.633 1293.92 891.14 1303.59 896.94C1313.64 902.74 1324.85 905.64 1337.23 905.64ZM1691.04 993.22C1662.42 993.22 1636.32 986.647 1612.74 973.5C1589.54 959.967 1570.98 941.213 1557.06 917.24C1543.14 892.88 1536.18 863.88 1536.18 830.24C1536.18 796.987 1543.14 768.373 1557.06 744.4C1570.98 720.04 1589.54 701.287 1612.74 688.14C1636.32 674.993 1662.42 668.42 1691.04 668.42C1718.1 668.42 1740.92 674.22 1759.48 685.82C1778.42 697.42 1792.73 715.207 1802.4 739.18C1812.06 763.153 1816.9 793.507 1816.9 830.24C1816.9 867.747 1812.26 898.487 1802.98 922.46C1793.7 946.433 1779.78 964.22 1761.22 975.82C1742.66 987.42 1719.26 993.22 1691.04 993.22ZM1714.24 905.64C1726.61 905.64 1737.63 902.74 1747.3 896.94C1757.35 891.14 1765.28 882.633 1771.08 871.42C1776.88 859.82 1779.78 846.093 1779.78 830.24C1779.78 814.387 1776.88 801.047 1771.08 790.22C1765.28 779.007 1757.35 770.5 1747.3 764.7C1737.63 758.9 1726.61 756 1714.24 756C1701.48 756 1690.07 758.9 1680.02 764.7C1670.35 770.5 1662.62 779.007 1656.82 790.22C1651.02 801.047 1648.12 814.387 1648.12 830.24C1648.12 846.093 1651.02 859.82 1656.82 871.42C1662.62 882.633 1670.35 891.14 1680.02 896.94C1690.07 902.74 1701.48 905.64 1714.24 905.64ZM1783.26 988V934.06L1783.84 830.24L1778.04 726.42V557.64H1888.24V988H1783.26ZM2079.78 993.22C2054.26 993.22 2031.25 988.193 2010.76 978.14C1990.65 968.087 1974.8 952.427 1963.2 931.16C1951.98 909.507 1946.38 882.247 1946.38 849.38V673.64H2056.58V831.4C2056.58 855.76 2061.02 873.16 2069.92 883.6C2079.2 894.04 2092.15 899.26 2108.78 899.26C2119.6 899.26 2129.46 896.747 2138.36 891.72C2147.25 886.693 2154.4 878.767 2159.82 867.94C2165.23 856.727 2167.94 842.42 2167.94 825.02V673.64H2278.14V988H2173.16V899.26L2193.46 924.2C2182.63 947.4 2166.97 964.8 2146.48 976.4C2125.98 987.613 2103.75 993.22 2079.78 993.22ZM2451.78 993.22C2425.1 993.22 2399 990.127 2373.48 983.94C2348.35 977.753 2328.05 970.02 2312.58 960.74L2345.64 885.34C2360.33 894.233 2377.54 901.387 2397.26 906.8C2416.98 911.827 2436.31 914.34 2455.26 914.34C2473.82 914.34 2486.58 912.407 2493.54 908.54C2500.89 904.673 2504.56 899.453 2504.56 892.88C2504.56 886.693 2501.08 882.247 2494.12 879.54C2487.55 876.447 2478.65 874.127 2467.44 872.58C2456.61 871.033 2444.63 869.293 2431.48 867.36C2418.33 865.427 2404.99 862.913 2391.46 859.82C2378.31 856.34 2366.13 851.313 2354.92 844.74C2344.09 837.78 2335.39 828.5 2328.82 816.9C2322.25 805.3 2318.96 790.607 2318.96 772.82C2318.96 752.713 2324.76 734.927 2336.36 719.46C2348.35 703.607 2365.75 691.233 2388.56 682.34C2411.37 673.06 2439.21 668.42 2472.08 668.42C2494.12 668.42 2516.35 670.74 2538.78 675.38C2561.59 679.633 2580.73 686.207 2596.2 695.1L2563.14 769.92C2547.67 761.027 2532.21 755.033 2516.74 751.94C2501.27 748.46 2486.58 746.72 2472.66 746.72C2454.1 746.72 2440.95 748.847 2433.22 753.1C2425.87 757.353 2422.2 762.573 2422.2 768.76C2422.2 774.947 2425.49 779.78 2432.06 783.26C2438.63 786.353 2447.33 788.867 2458.16 790.8C2469.37 792.347 2481.55 794.087 2494.7 796.02C2507.85 797.567 2520.99 800.08 2534.14 803.56C2547.67 807.04 2559.85 812.26 2570.68 819.22C2581.89 825.793 2590.79 834.88 2597.36 846.48C2603.93 857.693 2607.22 872.193 2607.22 889.98C2607.22 909.313 2601.23 926.713 2589.24 942.18C2577.64 957.647 2560.24 970.02 2537.04 979.3C2514.23 988.58 2485.81 993.22 2451.78 993.22ZM2992.28 988V929.42L2984.74 914.92V807.04C2984.74 789.64 2979.32 776.3 2968.5 767.02C2958.06 757.353 2941.24 752.52 2918.04 752.52C2902.96 752.52 2887.68 755.033 2872.22 760.06C2856.75 764.7 2843.6 771.273 2832.78 779.78L2795.66 704.96C2813.44 693.36 2834.71 684.467 2859.46 678.28C2884.59 671.707 2909.53 668.42 2934.28 668.42C2985.32 668.42 3024.76 680.213 3052.6 703.8C3080.82 727 3094.94 763.54 3094.94 813.42V988H2992.28ZM2899.48 993.22C2874.34 993.22 2853.08 988.967 2835.68 980.46C2818.28 971.953 2804.94 960.353 2795.66 945.66C2786.76 930.967 2782.32 914.533 2782.32 896.36C2782.32 877.027 2787.15 860.4 2796.82 846.48C2806.87 832.173 2822.14 821.347 2842.64 814C2863.13 806.267 2889.62 802.4 2922.1 802.4H2996.34V859.82H2937.18C2919.39 859.82 2906.82 862.72 2899.48 868.52C2892.52 874.32 2889.04 882.053 2889.04 891.72C2889.04 901.387 2892.71 909.12 2900.06 914.92C2907.4 920.72 2917.46 923.62 2930.22 923.62C2942.2 923.62 2953.03 920.72 2962.7 914.92C2972.75 908.733 2980.1 899.453 2984.74 887.08L2999.82 927.68C2994.02 949.333 2982.61 965.767 2965.6 976.98C2948.97 987.807 2926.93 993.22 2899.48 993.22ZM3152.9 988V673.64H3263.1V988H3152.9ZM3208 638.84C3187.89 638.84 3171.65 633.233 3159.28 622.02C3146.9 610.807 3140.72 596.887 3140.72 580.26C3140.72 563.633 3146.9 549.713 3159.28 538.5C3171.65 527.287 3187.89 521.68 3208 521.68C3228.1 521.68 3244.34 527.093 3256.72 537.92C3269.09 548.36 3275.28 561.893 3275.28 578.52C3275.28 595.92 3269.09 610.42 3256.72 622.02C3244.73 633.233 3228.49 638.84 3208 638.84Z" fill="#00285B"/>
</svg>`;
    
    // Read PayU logo and convert to base64
    const payuLogoPath = path.join(process.cwd(), 'app/auth/assets/payu-logo.png');
    const payuLogoBuffer = fs.readFileSync(payuLogoPath);
    const payuLogoBase64 = payuLogoBuffer.toString('base64');
    const payuLogoDataUri = `data:image/png;base64,${payuLogoBase64}`;
    
    const headerTemplate = `
      <div style="font-family: Arial, Helvetica, sans-serif; width:100%; padding:0 10mm; box-sizing:border-box; margin:0 10mm; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin:0; padding:0;">
          <div style="color:#2563EB; font-weight:800; font-size:28px; letter-spacing:0.5px; line-height:1; margin:0; padding:0;">${String(merchantName).toUpperCase()}</div>
          <div style="display:flex; align-items:center; gap:12px; margin:0; padding:0;">
            ${logoSvg}
            <span style="color:#6B7280; font-size:24px; font-weight:300; line-height:1; margin:0; padding:0 2px 0 0;">×</span>
            <img src="${payuLogoDataUri}" alt="PayU Logo" style="height:28px; width:auto; display:block; margin:0; padding:0;" />
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin:0; padding:0;">
          <div style="color:#6B7280; font-size:14px; margin:0; padding:0;">${String(merchantIndustryLabel || '')} &nbsp;&nbsp; <span style="margin-left:12px;">CIN ${String(merchantCIN || '')}</span> <span style="margin-left:12px;">Run Date: ${genDate}</span></div>
          <div style="color:#6B7280; font-size:12px; font-weight:500; margin:0; padding:0;">Merchant Insolvency Report</div>
        </div>
        <div style="height:10px; margin-top:2px; border-bottom:4px solid #2563EB;"></div>
      </div>`;

    const disclaimer = 'This document is provided by Modus AI for informational purposes only and does not constitute legal, financial, or professional advice.';
    // Use 10mm padding to match content margins (pdfConfig.margin = 10mm)
    const footerTemplate = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size:10px; width:100%; padding:0 10mm; box-sizing:border-box; margin:0 10mm;">
        <!-- Top separator line above footer -->
        <div style="width:100%; border-top:0.5px solid #e5e7eb; margin-bottom:6px;"></div>
        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
          <div style="color:#6B7280; font-size:9px;">
            <strong style="color:#000; font-weight:600;">Disclaimer :</strong> ${disclaimer.replace(/"/g, '\"')}
          </div>
          <div style="color:#1F2937; font-size:10px;">
            Page <span class="pageNumber">{{pageNumber}}</span> of <span class="totalPages">{{totalPages}}</span>
          </div>
        </div>
      </div>`;

    // Allow caller to override some pdf options via `options`.
    // Use landscape A4 to match the previous html2pdf orientation and page size.
    // Use 10mm left/right margins to match content margins (pdfConfig.margin = 10mm)
    const pdfOptions: any = {
      format: 'A4',
      landscape: true,
      printBackground: true,
  // top margin reduced to 28mm to match previous defaults while leaving room for header
  // slightly reduce bottom margin to give more printable room and avoid
  // a tiny overflow that can create a trailing blank page in some documents
  // left and right margins set to 10mm to match content margins
  margin: { top: '28mm', bottom: '18mm', left: '10mm', right: '10mm' },
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      ...options,
    };

    const buffer = await page.pdf(pdfOptions);
    await browser.close();

    const uint8 = new Uint8Array(buffer);

    return new Response(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
      },
    });
  } catch (err) {
    console.error('PDF generation error', err);
    return new Response(String(err || 'Internal error'), { status: 500 });
  }
}
