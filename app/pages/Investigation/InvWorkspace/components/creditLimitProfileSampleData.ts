export interface CreditWorthinessRow {
  sNo: number;
  date: string;
  ratingAgency: string;
  type: string;
  rating: string;
}

export interface LegalHistoryRow {
  caseNo: string;
  caseType: string;
  caseStatus: string;
  caseCategory: string;
  court: string;
  litigants: string;
  lastHearingDate: string;
}

export const creditWorthinessData: CreditWorthinessRow[] = [
  {
    sNo: 1,
    date: "2025-02-03",
    ratingAgency: "CRISIL",
    type: "Short Term Rating",
    rating: "CRISIL A1+"
  },
  {
    sNo: 2,
    date: "2025-02-03",
    ratingAgency: "CRISIL",
    type: "Long Term Rating",
    rating: "CRISIL AAA/Stable"
  }
];

export const legalHistoryData: LegalHistoryRow[] = [
  {
    caseNo: "4999(MB)2023",
    caseType: "Filed Against this Corporate",
    caseStatus: "Pending",
    caseCategory: "Insolvency",
    court: "NATIONAL COMPANY LAW TRIBUNAL",
    litigants: "RAVI SETHIA RESOLUTION PROFESSIONAL OF FUTURE LIFESTYLE FASHIONS LIMITED",
    lastHearingDate: "21 Feb, 2025"
  },
  {
    caseNo: "IA(I.B.C) - 4999/2023",
    caseType: "Filed Against this Corporate",
    caseStatus: "Pending",
    caseCategory: "Insolvency",
    court: "NATIONAL COMPANY LAW TRIBUNAL",
    litigants: "Ravi Sethia Resolution Professional of Future Lifestyle Fashions Limited",
    lastHearingDate: "17 Apr, 2024"
  },
  {
    caseNo: "S.C.C./12057/2025",
    caseType: "Filed Against this Corporate",
    caseStatus: "Pending",
    caseCategory: "NI Act / Company Offences",
    court: "CHIEF JUDICIAL MAGISTRATE , THANE",
    litigants: "State of Maharashtra",
    lastHearingDate: "16 Jul, 2025"
  },
  {
    caseNo: "S.C.C./12075/2025",
    caseType: "Filed Against this Corporate",
    caseStatus: "Pending",
    caseCategory: "NI Act / Company Offences",
    court: "CHIEF JUDICIAL MAGISTRATE , THANE",
    litigants: "Maharashtra Private Security Guards through Vasudeo S Patil",
    lastHearingDate: "16 Jul, 2025"
  },
  {
    caseNo: "ITA 1652/CHNY/2024",
    caseType: "Filed Against this Corporate",
    caseStatus: "Disposed",
    caseCategory: "Income Tax Appeals",
    court: "INCOME TAX APPELLATE TRIBUNAL",
    litigants: "ITO, CW-6(3), Chennai, Chennai",
    lastHearingDate: "6 Sep, 2024"
  },
  {
    caseNo: "2559(MB)2024",
    caseType: "Filed By this Corporate",
    caseStatus: "Pending",
    caseCategory: "Insolvency",
    court: "NATIONAL COMPANY LAW TRIBUNAL",
    litigants: "OFFICE OF THE COMMISSIONER OF CGST CENTRAL EXCISE RAIGAD",
    lastHearingDate: "9 Oct, 2024"
  },
  {
    caseNo: "2559(MB)2024",
    caseType: "Filed By this Corporate",
    caseStatus: "Pending",
    caseCategory: "Insolvency",
    court: "NATIONAL COMPANY LAW TRIBUNAL",
    litigants: "OFFICE OF THE COMMISSIONER OF CGST CENTRAL EXCISE RAIGAD",
    lastHearingDate: "12 Feb, 2025"
  },
  {
    caseNo: "2974(MB)2024",
    caseType: "Filed By this Corporate",
    caseStatus: "Pending",
    caseCategory: "Insolvency",
    court: "NATIONAL COMPANY LAW TRIBUNAL",
    litigants: "OFFICE OF THE DEPUTY COMMISSIONER DIVISION IV CGST AND CENTRAL EXCISE BELAPUR COMMISSIONERATE",
    lastHearingDate: "12 Feb, 2025"
  },
  {
    caseNo: "C.P.(CAA) - 113/2022",
    caseType: "Consolidation of Corporate Affairs",
    caseStatus: "Pending",
    caseCategory: "Merger and Amalgamation",
    court: "NATIONAL COMPANY LAW TRIBUNAL",
    litigants: "Self",
    lastHearingDate: "11 Jan, 2023"
  },
  {
    caseNo: "113(CHE)2022",
    caseType: "Consolidation of Corporate Affairs",
    caseStatus: "Disposed",
    caseCategory: "Merger and Amalgamation",
    court: "NATIONAL COMPANY LAW TRIBUNAL",
    litigants: "Self",
    lastHearingDate: "10 Jul, 2023"
  },
  {
    caseNo: "62(CHE)2022",
    caseType: "Consolidation of Corporate Affairs",
    caseStatus: "Disposed",
    caseCategory: "Merger and Amalgamation",
    court: "NATIONAL COMPANY LAW TRIBUNAL",
    litigants: "Self",
    lastHearingDate: "18 Oct, 2022"
  }
];
