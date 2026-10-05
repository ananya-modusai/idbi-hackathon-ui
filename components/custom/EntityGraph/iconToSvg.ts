/**
 * Icon loader for canvas rendering
 *
 * For a few node types we use the local bitmap/SVG assets in the
 * `icons/` folder. For other types we fall back to inline SVG
 * strings (so stroke color can still be overridden).
 */
// Use require() to import image assets so the values are treated as "any"
// which avoids StaticImageData typing issues when returning .src below.
const idCardUrl: any = require('./icons/id-card.png');
const phoneCallUrl: any = require('./icons/phone-call.png');
const responsiveUrl: any = require('./icons/responsive.png');
const userUrl: any = require('./icons/address.png');
const emailUrl: any = require('./icons/email.png');
const bankAccountUrl: any = require('./icons/bank-account.png');

// Scale factor applied to non-customer icons. Customer icons remain the base 24x24.
const NON_CUSTOMER_SCALE = 1.5;

export const getIconSvgDataUri = (iconType: string, color: string): string => {
  // Local asset overrides (return the asset URL directly)
  const assetMap: Record<string, string> = {
    GOV_ID: idCardUrl,
    PHONE: phoneCallUrl,
    DEVICE: responsiveUrl,
    BANK_ACCOUNT: bankAccountUrl,
    // Use GEOLOCATION/LOCATION mapping to the user icon
    GEOLOCATION: userUrl,
    LOCATION: userUrl,
    EMAIL: emailUrl
  };

  if (assetMap[iconType]) {
    const asset = assetMap[iconType] as any;
    // Resolve common shapes returned by bundlers/Next.js static imports.
    // They can be a string URL, an object with a `src` prop, or a default export.
    const resolveAssetUrl = (a: any): string | null => {
      if (!a && a !== 0) return null;
      if (typeof a === 'string') return a;
      if (typeof a.src === 'string') return a.src;
      if (typeof a.default === 'string') return a.default;
      if (a.default && typeof a.default.src === 'string') return a.default.src;
      // Some loaders put the URL under `url` or `path`
      if (typeof a.url === 'string') return a.url;
      if (typeof a.path === 'string') return a.path;
      return null;
    };

    const resolved = resolveAssetUrl(asset);
    if (resolved) return resolved;
    // Fallback to string conversion (will likely fail but keeps behavior predictable)
    console.warn(`iconToSvg: unable to resolve asset URL for ${iconType}`, asset);
    return String(asset);
  }

  // SVG strings for each icon type (24x24 Heroicons outline style)
  const icons: Record<string, string> = {
  CUSTOMER: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`,
  PERSON: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`,
  GOV_ID: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h.008v.008H5.75v-.008zm0 2h.008v.008H5.75v-.008zm0 2h.008v.008H5.75v-.008zm4-4h.008v.008H9.75v-.008zm0 2h.008v.008H9.75v-.008zm0 2h.008v.008H9.75v-.008zm4-4h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008zM3.75 21h16.5A2.25 2.25 0 0022 18.75V5.25A2.25 2.25 0 0019.5 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>`,
  PHONE: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.733.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>`,
  EMAIL: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0h-15m0 0l-3.257-2.143A.75.75 0 004.5 4.5h15a.75.75 0 00.757.607l-3.257 2.143" /></svg>`,
  ADDRESS: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>`,
  PINCODE: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" /></svg>`,
  GEOLOCATION: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503-6.97l.307-.763A.375.375 0 0111.25 6v-.75a.75.75 0 00-1.5 0v.75c0 .414.336.75.75.75h3.027a.375.375 0 01.373.481l-.307.763M4.5 20.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 9v9a2.25 2.25 0 002.25 2.25z" /></svg>`,
  DEVICE: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5A2.25 2.25 0 008.25 22.5h7.5A2.25 2.25 0 0018 20.25V3.75A2.25 2.25 0 0015.75 1.5h-2.25m0 18h4.5m-9-13.5h4.5" /></svg>`,
  BANK_ACCOUNT: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>`,
  UPI_VPA: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" /></svg>`,
  BANK_BRANCH: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m16.64 0H24m-3.97-9h-3.183a.75.75 0 00-.75.75v2.25m0-12.75h4.5a2.25 2.25 0 012.25 2.25v12a2.25 2.25 0 01-2.25 2.25h-4.5a2.25 2.25 0 01-2.25-2.25V4.5a2.25 2.25 0 012.25-2.25z" /></svg>`,
  REFERENCE_CONTACT: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
  MERCHANT: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m16.64 0H24m-3.97-9h-3.183a.75.75 0 00-.75.75v2.25m0-12.75h4.5a2.25 2.25 0 012.25 2.25v12a2.25 2.25 0 01-2.25 2.25h-4.5a2.25 2.25 0 01-2.25-2.25V4.5a2.25 2.25 0 012.25-2.25z" /></svg>`
  };

  // Choose base SVG (fall back to CUSTOMER)
  let svg = icons[iconType] || icons.CUSTOMER;

  // If this is a non-customer icon, increase its rendered size by adding width/height
  const scale = iconType === 'CUSTOMER' ? 1 : NON_CUSTOMER_SCALE;
  if (scale !== 1) {
    // Ensure the root <svg> tag contains width and height attributes (based on 24x24 viewBox)
    const size = 24 * scale;
    const svgOpenRegex = /<svg\b([^>]*)>/i;
    const m = svg.match(svgOpenRegex);
    if (m) {
      const attrs = m[1];
      // Remove any existing width/height attributes then re-insert scaled values
      let newAttrs = attrs
        .replace(/\swidth=\"[^\"]*\"/gi, '')
        .replace(/\swidth=\'[^\']*\'/gi, '')
        .replace(/\sheight=\"[^\"]*\"/gi, '')
        .replace(/\sheight=\'[^\']*\'/gi, '');
      newAttrs = `${newAttrs} width=\"${size}\" height=\"${size}\"`;
      svg = svg.replace(svgOpenRegex, `<svg${newAttrs}>`);
    }
  }

  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;utf8,${encoded}`;
};

// Asset cache to prevent concurrent fetch of the same URL for different colors
const assetCache: Record<string, Promise<any> | undefined> = {};

const fetchAsset = async <T extends 'text' | 'blob'>(url: string, type: T): Promise<T extends 'text' ? string : Blob> => {
  if (assetCache[url]) return assetCache[url];
  
  const promise = (async () => {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Fetch failed with status ${resp.status}`);
    return type === 'text' ? await resp.text() : await resp.blob();
  })();
  
  assetCache[url] = promise;
  return promise as any;
};

// Cache for loaded images
const imageCache: Record<string, Promise<HTMLImageElement> | undefined> = {};

export const getIconImage = (iconType: string, color: string): Promise<HTMLImageElement> => {
  const key = `${iconType}-${color}`;
  
  const cached = imageCache[key];
  if (cached) {
    return cached;
  }

  const loadPromise = (async () => {
    const result = getIconSvgDataUri(iconType, color);

    // If result is already a data URI (inline SVG), just load it
    if (typeof result === 'string' && result.startsWith('data:image/svg+xml')) {
      const img = new Image();
      return new Promise<HTMLImageElement>((resolve) => {
        img.onload = () => {
          resolve(img);
        };
        img.onerror = () => {
          console.error(`Failed to load icon for ${iconType}`);
          resolve(img);
        };
        img.src = result;
      });
    }

    // Otherwise result is likely a URL to an asset (SVG or PNG)
    const assetUrl = String(result);

    // Helper to create Image from a dataURL or url
    const loadImageFromSrc = (src: string) => {
      const img = new Image();
      return new Promise<HTMLImageElement>((resolve) => {
        img.onload = () => {
          resolve(img);
        };
        img.onerror = () => {
          console.error(`Failed to load icon for ${iconType}`);
          resolve(img);
        };
        img.src = src;
      });
    };

    // If SVG asset, fetch and inject stroke color then convert to data URI
    if (assetUrl.toLowerCase().endsWith('.svg')) {
      try {
        const svgText = await fetchAsset(assetUrl, 'text');
        // Try to set stroke attributes to requested color and slightly increase stroke width.
        // Replace existing stroke and stroke-width attributes, or inject them onto the <svg> tag if missing.
        let modified = svgText;
        // Replace stroke="..." (double and single quoted forms)
        modified = modified.replace(/stroke="#?[^"]+"/gi, `stroke="${color}"`);
        modified = modified.replace(/stroke='#?[^']+'?/gi, `stroke='${color}'`);
        // Replace existing stroke-width if present
        modified = modified.replace(/stroke-width="[^"]+"/gi, `stroke-width="1.75"`);
        modified = modified.replace(/stroke-width='[^']+'?/gi, `stroke-width='1.75'`);
        // Ensure <svg> tag has stroke and stroke-width if they were missing
        const svgOpenMatch = modified.match(/<svg\b([^>]*)>/i);
        if (svgOpenMatch) {
          const attrs = svgOpenMatch[1];
          const needsStroke = !/\bstroke=/.test(attrs);
          const needsStrokeWidth = !/\bstroke-width=/.test(attrs);
          if (needsStroke || needsStrokeWidth) {
            const add = `${needsStroke ? ` stroke=\"${color}\"` : ''}${needsStrokeWidth ? ` stroke-width=\"1.75\"` : ''}`;
            modified = modified.replace(/<svg\b([^>]*)>/i, `<svg$1${add}>`);
          }
        }
        // If this is a non-customer icon, inject width/height to scale the rendered SVG
        const scale = iconType === 'CUSTOMER' ? 1 : NON_CUSTOMER_SCALE;
        if (scale !== 1) {
          const size = 24 * scale;
          const svgOpenRegex = /<svg\b([^>]*)>/i;
          const m = modified.match(svgOpenRegex);
          if (m) {
            const attrs = m[1];
            let newAttrs = attrs
              .replace(/\swidth=\"[^\"]*\"/gi, '')
              .replace(/\swidth=\'[^\']*\'/gi, '')
              .replace(/\sheight=\"[^\"]*\"/gi, '')
              .replace(/\sheight=\'[^\']*\'/gi, '');
            newAttrs = `${newAttrs} width=\"${size}\" height=\"${size}\"`;
            modified = modified.replace(svgOpenRegex, `<svg${newAttrs}>`);
          }
        }
        const encoded = encodeURIComponent(modified);
        const dataUri = `data:image/svg+xml;utf8,${encoded}`;
        return await loadImageFromSrc(dataUri);
      } catch (err) {
        console.warn('iconToSvg: failed to fetch/modify svg asset', assetUrl, err);
        return await loadImageFromSrc(assetUrl);
      }
    }

    // For raster images (png, jpg) we tint them on a canvas to approximate color change
    try {
      const blob = await fetchAsset(assetUrl, 'blob');
      const objectUrl = URL.createObjectURL(blob);
      // Load base image
      const baseImg = await loadImageFromSrc(objectUrl);
      // Create canvas and tint. Scale raster icons for non-customer types.
      const canvas = document.createElement('canvas');
      const imgBaseWidth = baseImg.naturalWidth || baseImg.width || 24;
      const imgBaseHeight = baseImg.naturalHeight || baseImg.height || 24;
      const scale = iconType === 'CUSTOMER' ? 1 : NON_CUSTOMER_SCALE;
      canvas.width = Math.round(imgBaseWidth * scale);
      canvas.height = Math.round(imgBaseHeight * scale);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw scaled image
        ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
        // Apply tint by using 'source-in' composite
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
        const dataUrl = canvas.toDataURL();
        URL.revokeObjectURL(objectUrl);
        return await loadImageFromSrc(dataUrl);
      }

      URL.revokeObjectURL(objectUrl);
      return await loadImageFromSrc(assetUrl);
    } catch (err) {
      console.warn('iconToSvg: failed to fetch/tint raster asset', assetUrl, err);
      return await loadImageFromSrc(assetUrl);
    }
  })();

  imageCache[key] = loadPromise;
  return loadPromise;
};
