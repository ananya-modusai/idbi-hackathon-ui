import { ActiveContextType } from "./types";
// import { someRules } from "@/app/pages/Strategy/Red Flags/Rules/DeterministicRulesTab";
// import { Rule } from "@/app/pages/Strategy/Red Flags/RedFlagsPage";
// import { companyIds } from "@/app/pages/IPO/IPOSampleData";
// import { intermediariesData } from "@/app/pages/IPO/Entities/Components/IntermediariesSampleData";

export const merchantIds = [
    { value: "M123", label: "TechServe Solutions" },
    { value: "M124", label: "Digital Payments Ltd" },
    { value: "M125", label: "Global Trade Solutions" },
    { value: "M126", label: "TechServe Solutions" },
    { value: "M127", label: "Digital Payments Ltd" },
    { value: "M128", label: "Global Trade Solutions" },
  ]
  
  export const customerIds = [
    { value: "C789", label: "John Smith" },
    { value: "C790", label: "Alice Johnson" },
    { value: "C791", label: "Bob Wilson" },
  ]
  
  // some hardcoded rules
  export const ruleIds = [
    { value: "R123", label: "Rule 1" },
    { value: "R124", label: "Rule 2" },
    { value: "R125", label: "Rule 3" },
    { value: "R126", label: "Rule 4" },
    { value: "R127", label: "Rule 5" }
  ]

  export const caseIds = [
    { value: "124", label: "High Customer Complaint Rate" },
    { value: "125", label: "Suspicious Transaction Pattern" },
    { value: "123", label: "Regulatory Compliance Review" },
    { value: "122", label: "AML Alert Investigation" },
    { value: "121", label: "Document Verification Issue" }
  ];

  // Transform intermediaries data to match the expected format
  // export const intermediaryIds = intermediariesData.map(intermediary => ({
  //   value: intermediary.id,
  //   label: `${intermediary.name} (${intermediary.orgType})`
  // }));

  export type ContextGroupMapping = {
    [K in keyof ActiveContextType]: {
      group: string;
      defaultText: string;
      defaultPreText: string;
    }
  }
  
  export const contextGroupMapping: ContextGroupMapping = {
    merchant: {
      group: "Merchant Report",
      defaultText: "None",
      defaultPreText: "Active Merchant: "
    },
    customer: {
      group: "Customer",
      defaultText: "None",
      defaultPreText: "Active Customer: "
    },
    case: {
      group: "Case Management",
      defaultText: "None",
      defaultPreText: "Active Case: "
    },
    rule: {
      group: "Strategy",
      defaultText: "None",
      defaultPreText: "Searched Rule: "
    },
    company: {
      group: "Initial Public Offering",
      defaultText: "None",
      defaultPreText: "Active Company: "
    },
    intermediary: {
      group: "Initial Public Offering",
      defaultText: "None",
      defaultPreText: "Active Intermediary: "
    },
    chargeback: {
      group: "Chargeback",
      defaultText: "None",
      defaultPreText: "Active Case: "
    },
    investigation: {
      group: "Underwriting",
      defaultText: "None",
      defaultPreText: "Investigation: "
    }
  } 