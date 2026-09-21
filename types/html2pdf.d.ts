declare module 'html2pdf.js' {
  type Html2PdfInstance = {
    set: (options: unknown) => Html2PdfInstance;
    from: (element: HTMLElement) => Html2PdfInstance;
    toPdf: () => Html2PdfInstance;
    get: (key: string) => unknown;
    save: () => Promise<void> | void;
  };

  function html2pdf(): Html2PdfInstance;

  export default html2pdf;
}
