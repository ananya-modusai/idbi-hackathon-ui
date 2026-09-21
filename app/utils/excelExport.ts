import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { API } from '@/app/services/axios';

export const exportFinancialStatementsToExcel = async (data: {
    income: Record<string, unknown>[],
    balance: Record<string, unknown>[],
    cashflow: Record<string, unknown>[]
}, filename: string) => {
    const workbook = new ExcelJS.Workbook();

    // helper that writes a sheet with ordered metrics and bolds only the requested metric rows
    const writeSheet = (sheetName: string, sheetData: Record<string, unknown>[], requiredOrder: string[], boldSet: Set<string>) => {
        const ws = workbook.addWorksheet(sheetName);

        if (sheetData.length === 0) return;

        const years = sheetData.map(d => d.Year);

        // Header row
        ws.addRow(['Metrics', ...years]);

        // Build metrics list: required first, then any others
    const foundMetrics = Object.keys(sheetData[0]).filter(k => k !== 'Year');
        const metrics = [
            ...requiredOrder,
            ...foundMetrics.filter(m => !requiredOrder.includes(m))
        ];

        // Map year values for quick lookup
        const byYear = sheetData.map(d => d);

        metrics.forEach(metric => {
            const rowValues = [metric, ...byYear.map(item => (metric in item ? (item as Record<string, unknown>)[metric] : ''))];
            const row = ws.addRow(rowValues);

            // Bold only if metric is in the boldSet provided
            if (boldSet.has(metric)) {
                row.font = { bold: true };
            }

            // Convert numeric-looking strings to real numbers so Excel doesn't flag them as text
            // Columns: 1 = metric name, 2.. = year values
            for (let i = 0; i < years.length; i++) {
                const colIndex = i + 2; // because first column is metric
                const cell = row.getCell(colIndex);
                const raw = cell.value;
                if (raw === null || raw === undefined || raw === '') continue;

                // If it's already a number, ensure a reasonable number format
                if (typeof raw === 'number') {
                    // Use integer vs decimal format
                    cell.numFmt = Number.isInteger(raw) ? '#,##0' : '#,##0.00';
                    continue;
                }

                if (typeof raw === 'string') {
                    let s = raw.trim();
                    if (s === '') continue;

                    const isPercent = s.includes('%');
                    const hasCurrency = /₹|Rs\b|INR|£|\$|€/i.test(s);

                    // Detect negative numbers in parentheses like (1,000)
                    let negative = false;
                    if (s.startsWith('(') && s.endsWith(')')) {
                        negative = true;
                        s = s.slice(1, -1).trim();
                    }

                    // Remove commas, percent sign and common currency symbols, then strip any remaining non-numeric chars
                    let cleaned = s.replace(/,/g, '').replace(/%/g, '');
                    cleaned = cleaned.replace(/[₹RsINR£$€\s]/gi, '');
                    cleaned = cleaned.replace(/[^0-9.\-]/g, '');
                    if (cleaned === '' || cleaned === '.' || cleaned === '-' ) continue;

                    const parsed = parseFloat(cleaned);
                    if (isNaN(parsed)) continue;
                    let value = parsed;
                    if (negative) value = -value;

                    if (isPercent) {
                        // Excel expects percent values as fractions (0.5 = 50%)
                        cell.value = value / 100;
                        cell.numFmt = '0.00%';
                    } else {
                        cell.value = value;
                        if (hasCurrency && /₹/.test(s)) {
                            // Indian rupee formatting (basic)
                            cell.numFmt = '₹#,##0;[black]₹-#,##0';
                        } else if (hasCurrency && /\$/.test(s)) {
                            cell.numFmt = '"$"#,##0;[black]"$"-#,##0';
                        } else {
                            cell.numFmt = Number.isInteger(value) ? '#,##0' : '#,##0.00';
                        }
                    }
                }
            }
        });

        // set column widths
        ws.columns = [{ width: 40 }, ...years.map(() => ({ width: 22 }))];
    };

    // Define required orders per sheet (these match the UI)
    const incomeOrder = [
        'Revenue and Profitability', 'Revenue from Operations', 'Cost of Sales', 'Gross Profit',
        'Gross Profit Margin (%)', 'Operating Expenses', 'Research & Development', 'Sales & Marketing',
        'General & Administrative', 'Total Operating Expenses', 'Operating Performance', 'Operating Income (EBIT)',
        'Operating Margin (%)', 'Interest Expense', 'Other Income', 'Income Taxes', 'Net Income', 'Net Profit Margin (%)',
        'Per Share Data', 'Shares Outstanding', 'Earnings Per Share'
    ];

    const balanceOrder = [
        'Assets', 'Non-Current Assets', 'Tangible Assets', 'Intangible Assets', 'Capital Work in Progress',
        'Non-Current Investments', 'Long Term Loans & Advances', 'Other Non-Current Assets',
        'Current Assets', 'Current Investments', 'Inventories', 'Trade Receivables', 'Cash & Bank Balances', 'Short Term Loans & Advances',
        'Other Current Assets', 'Total Assets', 'Liabilities', 'Shareholders Funds',
        'Share Capital', 'Reserves & Surplus', 'Non-Current Liabilities', 'Long Term Borrowings', 'Other Long Term Liabilities',
        'Long Term Provisions', 'Current Liabilities', 'Short Term Borrowings', 'Trade Payables', 'Other Current Liabilities',
        'Short Term Provisions', 'Total Liabilities'
    ];

    const cashflowOrder = [
        'Operating Activities', 'Profit Before Tax', 'Finance Cost & Depreciation',
        'Adjustments for Current & Non-Current Assets', 'Adjustments for Current & Non-Current Liabilities',
        'Other Operating Adjustments', 'Net Cash from Operations',
        'Investing Activities', 'Purchase of Assets', 'Sale of Assets', 'Income from Assets',
        'Other Investing Adjustments', 'Net Cash from Investing',
        'Financing Activities', 'Repayment of Capital & Borrowings', 'Raising Capital & Borrowings',
        'Interest & Dividends Paid', 'Other Financing Adjustments', 'Net Cash from Financing', 'Cash Position', 'Cash & Equivalents Before Exchange',
        'Exchange Rate Adjustments', 'Net Change in Cash',
    ];

    // Define which exact metrics should be bold for each sheet (only these will be bold)
    const incomeBold = new Set<string>([
        'Revenue and Profitability',
        'Revenue from Operations',
        'Gross Profit',
        'Operating Expenses',
        'Total Operating Expenses',
        'Operating Performance',
        'Operating Income (EBIT)',
        'Net Income',
        'Per Share Data',
        'Earnings Per Share'
    ]);

    const balanceBold = new Set<string>([
        'Assets', 'Non-Current Assets',
        'Non-Current Assets',
        'Current Assets',
        'Total Assets',
        'Liabilities',
        'Shareholders Funds',
        'Non-Current Liabilities',
        'Current Liabilities',
        'Total Liabilities'
    ]);

    const cashflowBold = new Set<string>([
        'Operating Activities',
        'Cash Generated from Operations',
        'Net Cash from Operations',
        'Investing Activities',
        'Net Cash from Investing',
        'Financing Activities',
        'Net Cash from Financing',
        'Cash Position',
        'Net Change in Cash',
        'Net Increase/Decrease in Cash & Cash Equivalents',
        'Cash at End of Period'
    ]);

    // Write sheets
    writeSheet('Income Statement', data.income, incomeOrder, incomeBold);
    writeSheet('Balance Sheet', data.balance, balanceOrder, balanceBold);
    writeSheet('Cash Flow', data.cashflow, cashflowOrder, cashflowBold);

    // Generate buffer and trigger download
    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    // dynamic import for file-saver to avoid static type issues in the repo
    // handle both named and default exports and provide a DOM fallback
    try {
        const fileSaverModule = (await import('file-saver')) as unknown as { saveAs?: (b: Blob, name: string) => void; default?: (b: Blob, name: string) => void };
        const saveFn: ((b: Blob, name: string) => void) | undefined =
            (fileSaverModule && typeof fileSaverModule.saveAs === 'function') ? fileSaverModule.saveAs
            : (fileSaverModule && typeof fileSaverModule.default === 'function') ? fileSaverModule.default
            : undefined;

        if (saveFn) {
            saveFn(blob, `Modus AI * PayU - Insolvency Financial Statement.xlsx`);
            return;
        }
    } catch {
        // continue to fallback
    }

    // Fallback: create an anchor and trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Modus AI * PayU - Insolvency Financial Statement.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

interface ExcelData {
    'Merchant Name': string;
    'CIN': string;
    'Monitoring Frequency': string;
    'Status': string;
    'Industry': string;
    'Industry Risk Segment': string;
    'PD Score': number;
    'Chargebackable Payment Volume': number;
    'Total Payment Volume': number;
    'Collateral': number;
    'Industry ADD': number;
    'Loss Given Default': number;
    'Value at Risk': number;
    'Settlement Days': string;
    'Gross Non-Delivery Exposure': number;
    'Net Non-Delivery Exposure': number;
    'Expected Loss at Default': number;
}

interface MerchantData {
    originalData?: {
        mid?: string;
        merchantId?: string;
        merchant_id?: string;
        merchantName?: string;
        cin?: string;
        monitoringFrequency?: string;
        status?: string;
        industry?: string;
        industryRiskSegment?: string;
        pd_score?: number;
        cpv_score?: number;
        tpv_score?: number;
        collateral_score?: number;
        lgd_rate?: number;
        industry_add?: number;
    };
}

export const exportToExcel = async (data: MerchantData[], fileName: string = 'Modus AI * PayU - Insolvency.xlsx') => {
    // For each merchant item, fetch up-to-date risk metrics and industry ADD then compute
    const rows: ExcelData[] = data.map((item) => {
        const originalData = item.originalData || {};

        // Get values directly from originalData with defaults
        const CPV = originalData.cpv_score || 0;
        const TPV = originalData.tpv_score || 0;
        const collateral = originalData.collateral_score || 0;
        const industryADD = originalData.industry_add || 0;
        const pdScore = originalData.pd_score || 0;
        const LGD = originalData.lgd_rate || 0;

        // Compute derived values (numbers written directly to sheet)
        const GNDX = CPV * (industryADD); // Gross Non-Delivery Exposure
        const NNDX = GNDX - collateral;  // Net Non-Delivery Exposure
        const VaR = (NNDX * pdScore)/100;  // Value at Risk
    const SDR = TPV > 0 ? (VaR / TPV) : 0;  // Settlement Days (numeric)
        const ELD = NNDX * (LGD / 100);  // Expected Loss at Default

        return {
            'Merchant Name': originalData.merchantName || '',
            'CIN': originalData.cin || '',
            'Monitoring Frequency': originalData.monitoringFrequency || '',
            'Status': originalData.status || '',
            'Industry': originalData.industry || '',
            'Industry Risk Segment': originalData.industryRiskSegment || '',
            'PD Score': originalData.pd_score || 0,
            'Chargebackable Payment Volume': originalData.cpv_score || 0,
            'Total Payment Volume': originalData.tpv_score || 0,
            'Collateral': originalData.collateral_score || 0,
            'Industry ADD': originalData.industry_add || 0,
            'Loss Given Default': originalData.lgd_rate || 0,
            'Value at Risk': VaR,
            'Settlement Days': `T+${(SDR).toFixed(1)}`,
            'Gross Non-Delivery Exposure': GNDX,
            'Net Non-Delivery Exposure': NNDX,
            'Expected Loss at Default': ELD
        } as ExcelData;
    });

    const excelData = rows;

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData as ExcelData[]);

    // Values are computed in JS and already present in the worksheet data; no formula overwrite needed

    // Set column widths
    const columnWidths = [
        { wch: 20 }, // merchantName
        { wch: 15 }, // cin
        { wch: 15 }, // monitoringFrequency
        { wch: 10 }, // status
        { wch: 15 }, // industry
        { wch: 15 }, // industryRiskSegment
        { wch: 10 }, // pdScore
        { wch: 12 }, // CPV
        { wch: 12 }, // TPV
        { wch: 12 }, // collateral
        { wch: 12 }, // industryADD
        { wch: 10 }, // LGD
        { wch: 12 }, // VaR
        { wch: 12 }, // SDR
        { wch: 12 }, // GNDX
        { wch: 12 }, // ELD
        { wch: 12 }  
    ];
    ws['!cols'] = columnWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Merchant Risk Analysis');

    // Save the file
    XLSX.writeFile(wb, fileName);
};
