// Compliance & Legal data, generated from the TARC workbook:
//   app/data/tarc_rerun_peer_comparison/xlsx_reports/L70100DL2016PLC390526_TARC_LIMITED.xls
// Sheets: GST, EPFO Establishments, MSME Supplier Payment Delays,
//         Legal History, Legal Cases - Financial Dispute.

export interface GstComplianceRow {
  gstin: string; status: string; state: string; returnType: string;
  latestFiling: string; taxPeriod: string; taxpayerType: string;
  jurisdiction: string; filingStatus: string;
}

export const gstComplianceRows: GstComplianceRow[] = [
  {
    "gstin": "07AAOCA7650B2ZP",
    "status": "Active",
    "state": "Delhi",
    "returnType": "GSTR3B",
    "latestFiling": "20 Aug, 2026",
    "taxPeriod": "July 2026",
    "taxpayerType": "Regular",
    "jurisdiction": "Ward 100",
    "filingStatus": "Filed after due date"
  },
  {
    "gstin": "07AAOCA7650B2ZP",
    "status": "Active",
    "state": "Delhi",
    "returnType": "GSTR1",
    "latestFiling": "7 Aug, 2026",
    "taxPeriod": "July 2026",
    "taxpayerType": "Regular",
    "jurisdiction": "Ward 100",
    "filingStatus": "Filed after due date"
  },
  {
    "gstin": "07AAOCA7650B1ZQ",
    "status": "Active",
    "state": "Delhi",
    "returnType": "GSTR6",
    "latestFiling": "18 Aug, 2026",
    "taxPeriod": "July 2026",
    "taxpayerType": "Input Service Distributor (ISD)",
    "jurisdiction": "Ward 100",
    "filingStatus": "Filed on time"
  },
  {
    "gstin": "06AAOCA7650B2ZR",
    "status": "Active",
    "state": "Haryana",
    "returnType": "GSTR3B",
    "latestFiling": "20 Aug, 2026",
    "taxPeriod": "July 2026",
    "taxpayerType": "Regular",
    "jurisdiction": "Gurgaon (South) Ward 9",
    "filingStatus": "Filed after due date"
  },
  {
    "gstin": "06AAOCA7650B2ZR",
    "status": "Active",
    "state": "Haryana",
    "returnType": "GSTR1",
    "latestFiling": "11 Aug, 2026",
    "taxPeriod": "July 2026",
    "taxpayerType": "Regular",
    "jurisdiction": "Gurgaon (South) Ward 9",
    "filingStatus": "Filed after due date"
  },
  {
    "gstin": "06AAOCA7650B1ZS",
    "status": "Active",
    "state": "Haryana",
    "returnType": "GSTR3B",
    "latestFiling": "19 Aug, 2026",
    "taxPeriod": "July 2026",
    "taxpayerType": "Regular",
    "jurisdiction": "Gurgaon (West) Ward 11",
    "filingStatus": "Filed on time"
  },
  {
    "gstin": "06AAOCA7650B1ZS",
    "status": "Active",
    "state": "Haryana",
    "returnType": "GSTR1",
    "latestFiling": "7 Aug, 2026",
    "taxPeriod": "July 2026",
    "taxpayerType": "Regular",
    "jurisdiction": "Gurgaon (West) Ward 11",
    "filingStatus": "Filed on time"
  }
];

export interface EpfoComplianceRow {
  establishment: string; entityName: string; latestWageMonth: string;
  employees: string; contribution: string; paymentDate: string; status: string;
}

export const epfoComplianceRows: EpfoComplianceRow[] = [
  {
    "establishment": "DSNHP2196007000",
    "entityName": "ANANT RAJ GLOBAL LIMITED",
    "latestWageMonth": "May, 2026",
    "employees": "99",
    "contribution": "₹0.09 Cr",
    "paymentDate": "12 Jun, 2026",
    "status": "Paid after due date"
  }
];

export interface LitigationRow {
  matter: string; direction: string; status: string; category: string;
  court: string; caseNo: string; latestHearing: string;
}

export const litigationStats = [
  {
    "label": "Pending Matters",
    "value": "13",
    "icon": "Clock"
  },
  {
    "label": "Filed Against Company",
    "value": "10",
    "icon": "Gavel"
  },
  {
    "label": "Financial Disputes",
    "value": "1",
    "icon": "Banknote"
  },
  {
    "label": "Disposed Matters",
    "value": "6",
    "icon": "BadgeCheck"
  }
];

export const litigationRows: LitigationRow[] = [
  {
    "matter": "Anant Raj Agencies Pvt. Ltd. & Anr.",
    "direction": "Filed against company",
    "status": "Pending",
    "category": "Mergers and Amalgamations",
    "court": "NATIONAL COMPANY LAW TRIBUNAL",
    "caseNo": "CANo.43/2020InCP(CAA)No.19/Chd/Hry/2019(2ndMotion)",
    "latestHearing": "18 Feb, 2020"
  },
  {
    "matter": "Ana-nt Raj Agencies Pvt. Ltd.",
    "direction": "Filed against company",
    "status": "Pending",
    "category": "Mergers and Amalgamations",
    "court": "NATIONAL COMPANY LAW TRIBUNAL",
    "caseNo": "CP(CAA)No.19/Chd/Hry/2019(2ndMotion)a/wCANo.43/2020",
    "latestHearing": "18 Jun, 2020"
  },
  {
    "matter": "PRIYANKA",
    "direction": "Filed against company",
    "status": "Pending",
    "category": "Others",
    "court": "CIVIL JUDGE SENIOR DIVISION, GURUGRAM",
    "caseNo": "CS/2091/2025",
    "latestHearing": "3 Aug, 2026"
  },
  {
    "matter": "GENETIC CONSTRUCTION",
    "direction": "Filed against company",
    "status": "Pending",
    "category": "Others",
    "court": "DISTRICT AND SESSIONS JUDGE, SOUTH , SAKET",
    "caseNo": "Execution (Comm.)/105/2024",
    "latestHearing": "21 Aug, 2026"
  },
  {
    "matter": "Genetic Constructions",
    "direction": "Filed against company",
    "status": "Pending",
    "category": "Others",
    "court": "DISTRICT AND SESSIONS JUDGE,NEW DELHI, PHC",
    "caseNo": "OMP (COMM.)/5/2026",
    "latestHearing": "10 Aug, 2026"
  },
  {
    "matter": "BHARDWAJ BUILDERS",
    "direction": "Filed against company",
    "status": "Disposed",
    "category": "Insolvency",
    "court": "NATIONAL COMPANY LAW TRIBUNAL",
    "caseNo": "C.P. (IB) - 190/2023",
    "latestHearing": "12 Oct, 2023"
  },
  {
    "matter": "I B ENTERPRISES",
    "direction": "Filed against company",
    "status": "Disposed",
    "category": "Insolvency",
    "court": "NATIONAL COMPANY LAW TRIBUNAL",
    "caseNo": "C.P. (IB) - 200/2023",
    "latestHearing": "30 Oct, 2023"
  },
  {
    "matter": "BHARDWAJ BUILDERS",
    "direction": "Filed against company",
    "status": "Disposed",
    "category": "Insolvency",
    "court": "NATIONAL COMPANY LAW TRIBUNAL",
    "caseNo": "IA(I.B.C) - 5378/2023",
    "latestHearing": "12 Oct, 2023"
  },
  {
    "matter": "Anant Raj Agencies Pvt. Ltd.",
    "direction": "Filed against company",
    "status": "Disposed",
    "category": "Mergers and Amalgamations",
    "court": "NATIONAL COMPANY LAW TRIBUNAL",
    "caseNo": "CANo.137/2020InCP(CAA)No.19/Chd/Hry/20192ndMotion",
    "latestHearing": "9 Jun, 2020"
  },
  {
    "matter": "GENETIC CONSTRUCTIONS",
    "direction": "Filed against company",
    "status": "Disposed",
    "category": "Others",
    "court": "DISTRICT AND SESSIONS JUDGE, SOUTH , SAKET",
    "caseNo": "OMP (COMM.)/27/2024",
    "latestHearing": "13 Jul, 2026"
  },
  {
    "matter": "PHEONIX EXPOVENT",
    "direction": "Filed by company",
    "status": "Pending",
    "category": "Others",
    "court": "DISTRICT AND SESSIONS JUDGE, SOUTH , SAKET",
    "caseNo": "CS (COMM)/560/2025",
    "latestHearing": "4 Aug, 2026"
  },
  {
    "matter": "M/s Genetic Constructions through its prop Sh Jagbir Singh",
    "direction": "Filed by company",
    "status": "Pending",
    "category": "Others",
    "court": "DISTRICT AND SESSIONS JUDGE,NEW DELHI, PHC",
    "caseNo": "OMP (COMM.)/191/2024",
    "latestHearing": "5 Aug, 2026"
  },
  {
    "matter": "Self",
    "direction": "Corporate restructuring",
    "status": "Pending",
    "category": "Mergers and Amalgamations",
    "court": "NATIONAL COMPANY LAW TRIBUNAL",
    "caseNo": "CA(CAA)No.12/Chd/Hry/2020(1stMotion)(2ndMotion)",
    "latestHearing": "25 Aug, 2020"
  },
  {
    "matter": "Self",
    "direction": "Corporate restructuring",
    "status": "Pending",
    "category": "Mergers and Amalgamations",
    "court": "NATIONAL COMPANY LAW TRIBUNAL",
    "caseNo": "CA(CAA)No.8/Chd/Hry/2019",
    "latestHearing": "11 Apr, 2019"
  },
  {
    "matter": "Self",
    "direction": "Corporate restructuring",
    "status": "Pending",
    "category": "Mergers and Amalgamations",
    "court": "NATIONAL COMPANY LAW TRIBUNAL",
    "caseNo": "CP(CAA)No.19/Chd/Hry/19(2ndMotion)",
    "latestHearing": "7 Nov, 2019"
  },
  {
    "matter": "Self",
    "direction": "Corporate restructuring",
    "status": "Pending",
    "category": "Mergers and Amalgamations",
    "court": "NATIONAL COMPANY LAW TRIBUNAL",
    "caseNo": "CP(CAA)No.19/Chd/Hry/2019",
    "latestHearing": "19 Dec, 2019"
  },
  {
    "matter": "Self",
    "direction": "Corporate restructuring",
    "status": "Pending",
    "category": "Mergers and Amalgamations",
    "court": "NATIONAL COMPANY LAW TRIBUNAL",
    "caseNo": "CP(CAA)No.19/Chd/Hry/2019(2ndMotion)",
    "latestHearing": "24 Aug, 2020"
  },
  {
    "matter": "Self",
    "direction": "Corporate restructuring",
    "status": "Pending",
    "category": "Mergers and Amalgamations",
    "court": "NATIONAL COMPANY LAW TRIBUNAL",
    "caseNo": "cp(caa)no.8/chd/hry/19",
    "latestHearing": "2 May, 2019"
  },
  {
    "matter": "Self",
    "direction": "Corporate restructuring",
    "status": "Disposed",
    "category": "Corporate Disputes",
    "court": "NATIONAL COMPANY LAW TRIBUNAL",
    "caseNo": "CANo.43/2020",
    "latestHearing": "24 Aug, 2020"
  }
];

export interface MsmeRow { supplier: string; pan: string; amountDue: string; }

export const msmeSummary = {
  "reportingPeriod": "October to March 2026",
  "suppliers": "30",
  "totalAmountDue": "₹3.24 Cr"
};

export const msmeRows: MsmeRow[] = [
  {
    "supplier": "ANADEE DIGITAL SOLUTIONS PRIVATE LIMITED",
    "pan": "AAQCA7909K",
    "amountDue": "₹0.02 Cr"
  },
  {
    "supplier": "ANIKA GLOBAL TRADING PVT. LTD.",
    "pan": "AAACA6414F",
    "amountDue": "₹0.01 Cr"
  },
  {
    "supplier": "BLISS REFRIGE RATION PRIVATE LIMITED",
    "pan": "AAECB0249F",
    "amountDue": "₹0.09 Cr"
  },
  {
    "supplier": "BLU- SMART MOBILITY TECH PRIVATE LIMITED",
    "pan": "AAHCG6286C",
    "amountDue": "₹0.01 Cr"
  },
  {
    "supplier": "BRAND ABSTRACT",
    "pan": "BXJPS3371M",
    "amountDue": "₹0.01 Cr"
  },
  {
    "supplier": "BSPA SECURITY SYSTEMS",
    "pan": "AANFB4876A",
    "amountDue": "₹0.06 Cr"
  },
  {
    "supplier": "CARE 2 EARN SERVICES PRIVATE LIMITED",
    "pan": "AAFCC3678L",
    "amountDue": "₹0.5 Cr"
  },
  {
    "supplier": "CRES- CONCREAT E REAL ESTATE SOLUTIONS PRIVATE LIMITED",
    "pan": "AAOCA7650B",
    "amountDue": "₹0.02 Cr"
  },
  {
    "supplier": "DEVNOW INTERNA TIONAL",
    "pan": "AALFD1361L",
    "amountDue": "₹0.0 Cr"
  },
  {
    "supplier": "EXELIQ CABS PRIVATE LIMITED",
    "pan": "AAFCE4558B",
    "amountDue": "₹0.02 Cr"
  },
  {
    "supplier": "FIX & FINE SERVICES",
    "pan": "CWXPP0575N",
    "amountDue": "₹0.04 Cr"
  },
  {
    "supplier": "GABA PROJECTS PRIVATE LIMITED",
    "pan": "AAFCG0697R",
    "amountDue": "₹0.02 Cr"
  },
  {
    "supplier": "GOURI IT NETWOR K SOLUTIO N",
    "pan": "BALPK6936P",
    "amountDue": "₹0.0 Cr"
  },
  {
    "supplier": "GOURME R SERVICES PRIVATE LIMITED",
    "pan": "AAECP7947G",
    "amountDue": "₹0.01 Cr"
  },
  {
    "supplier": "HANDY ONLINE SOLUTIONS PRIVATE LIMITED",
    "pan": "AADCH6128C",
    "amountDue": "₹0.01 Cr"
  },
  {
    "supplier": "HUNGRY HELPERS",
    "pan": "AMXPY9566C",
    "amountDue": "₹0.0 Cr"
  },
  {
    "supplier": "IGUANA MOTION PICTURES",
    "pan": "AAHFI9248P",
    "amountDue": "₹0.0 Cr"
  },
  {
    "supplier": "KIRTANE & PANDIT LLP",
    "pan": "AAPFK1026M",
    "amountDue": "₹0.07 Cr"
  },
  {
    "supplier": "LORD SHYAMA REALBUIL D PRIVATE LIMITED",
    "pan": "AACCL9014A",
    "amountDue": "₹0.0 Cr"
  },
  {
    "supplier": "MCRAM & SAH PRIVATE LIMITED",
    "pan": "AAMCM7914J",
    "amountDue": "₹0.01 Cr"
  },
  {
    "supplier": "MINDWE AVE COMMU NICATIO NS",
    "pan": "AEYPC6639K",
    "amountDue": "₹0.06 Cr"
  },
  {
    "supplier": "MUHAVR A ENTERPR ISES PRIVATE LIMITED",
    "pan": "AAICM1839L",
    "amountDue": "₹0.0 Cr"
  },
  {
    "supplier": "PC TECH SYSTEM SOLUTIONS",
    "pan": "ATAPJ3834E",
    "amountDue": "₹0.05 Cr"
  },
  {
    "supplier": "POPKOR N PR PLUS COMMU NICATIO N PVT. LTD.",
    "pan": "AAHCP2794E",
    "amountDue": "₹0.06 Cr"
  },
  {
    "supplier": "PROVIDE NCE ADWORK S",
    "pan": "ATAPK7943F",
    "amountDue": "₹0.0 Cr"
  },
  {
    "supplier": "SAURAB H GUPTA",
    "pan": "AIGPG9366H",
    "amountDue": "₹1.41 Cr"
  },
  {
    "supplier": "SHILPA BATRA (SHILPKAR HOMES)",
    "pan": "AKMPB4204H",
    "amountDue": "₹0.23 Cr"
  },
  {
    "supplier": "SRM BUILDTECH PRIVATE LIMITED",
    "pan": "AANCS9224J",
    "amountDue": "₹0.53 Cr"
  },
  {
    "supplier": "TRISITA ENGINEE RING LLP",
    "pan": "AALFT0664Q",
    "amountDue": "₹0.0 Cr"
  },
  {
    "supplier": "VDV ELECTRICAL S",
    "pan": "ACGPY2379G",
    "amountDue": "₹0.0 Cr"
  }
];

export interface ComplianceKeyMetric { label: string; value: string; icon: string; }

export const complianceKeyMetrics: ComplianceKeyMetric[] = [
  { label: 'Company Status', value: 'Active', icon: 'BadgeCheck' },
  { label: 'GST Registrations', value: '4', icon: 'ShieldCheck' },
  { label: 'GST Filing Delays', value: '4', icon: 'FileWarning' },
  { label: 'EPFO Payment Delays', value: '1', icon: 'Users' },
  { label: 'MSME Amount Due', value: '₹3.24 Cr', icon: 'Banknote' },
  { label: 'Pending Matters', value: '13', icon: 'Scale' },
];
