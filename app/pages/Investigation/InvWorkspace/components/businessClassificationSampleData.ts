// Business Classification cross-reference matrix — sample data & types

export const BC_SOURCES = ["onboarding", "website", "probe42"] as const;
export type BCSource = (typeof BC_SOURCES)[number];

export const BC_SOURCE_LABELS: Record<BCSource, string> = {
  onboarding: "Onboarding Data",
  website: "Website",
  probe42: "MCA",
};

export const BC_SOURCE_COLORS: Record<BCSource, string> = {
  onboarding: "#6366f1",
  website: "#0ea5e9",
  probe42: "#f59e0b",
};

export interface BCFieldDef {
  key: string;
  label: string;
}

export interface BCFieldGroup {
  label: string;
  fields: BCFieldDef[];
}

export const BC_FIELD_GROUPS: BCFieldGroup[] = [
  {
    label: "Business Identity",
    fields: [
      { key: "tradeName", label: "Trade / Business Name / Brand Name" },
      { key: "registeredName", label: "Legal Name" },
      { key: "connectedUrls", label: "URLs" },
      { key: "nameInUrl", label: "Name in URL" },
      { key: "typeOfEntity", label: "Type of Entity" },
    ],
  },
  {
    label: "Business Classification",
    fields: [
      { key: "mcc", label: "MCC" },
      { key: "industry", label: "Industry" },
      { key: "segment", label: "Segment" },
      { key: "lineOfBusiness", label: "Line Of Business" },
    ],
  },
  {
    label: "Registration Details",
    fields: [
      { key: "pan", label: "PAN" },
      { key: "cin", label: "CIN" },
    ],
  },
  {
    label: "Key Personnel",
    fields: [
      { key: "details", label: "Details" },
    ],
  },
  {
    label: "Address",
    fields: [
      { key: "registeredAddress", label: "Registered Address" },
      { key: "businessAddress", label: "Business Address" },
    ],
  },
  {
    label: "Contact Details",
    fields: [
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
    ],
  },
];

export type BCDataRecord = Record<BCSource, string | null>;
export type BCData = Record<string, BCDataRecord>;

export const BC_SAMPLE_DATA: BCData = {
  mcc: {
    onboarding: "7372",
    website: null,
    probe42: "7372",
  },
  industry: {
    onboarding: "Computer Programming",
    website: "Web Design & Development",
    probe42: "Computer Programming, Data Processing",
  },
  segment: {
    onboarding: "Technology",
    website: null,
    probe42: "Technology",
  },
  lineOfBusiness: {
    onboarding: null,
    website: null,
    probe42: null,
  },
  tradeName: {
    onboarding: "Aashtech Innovation",
    website: "Aashtech Innovation Pvt Ltd",
    probe42: "Aashtech Innovation Private Limited",
  },
  registeredName: {
    onboarding: "Aashtech Innovation Pvt Ltd",
    website: null,
    probe42: "Aashtech Innovation Private Limited",
  },
  nameInUrl: {
    onboarding: null,
    website: "aashtech.com",
    probe42: null,
  },
  nameOnWebsite: {
    onboarding: null,
    website: "Aashtech Innovation Pvt Ltd",
    probe42: null,
  },
  connectedUrls: {
    onboarding: "aashtech.com",
    website: "aashtech.com, aashtech.in",
    probe42: "aashtech.co.in",
  },
  phone: {
    onboarding: "+91-9876543210",
    website: "+91-9876543210",
    probe42: "+91-9876543210",
  },
  email: {
    onboarding: "info@aashtech.com",
    website: "contact@aashtech.com",
    probe42: null,
  },
  registeredAddress: {
    onboarding: "123, MG Road, Bangalore",
    website: null,
    probe42: "456, Brigade Road, Bangalore",
  },
  businessAddress: {
    onboarding: null,
    website: "789, Koramangala, Bangalore",
    probe42: "456, Brigade Road, Bangalore",
  },
  pan: {
    onboarding: "AABCA1234E",
    website: null,
    probe42: "AABCA1234E",
  },
  cin: {
    onboarding: null,
    website: null,
    probe42: "U72200KA2020PTC123456",
  },
  gstn: {
    onboarding: "29AABCA1234E1Z5",
    website: null,
    probe42: "29AABCA1234E1Z5",
  },
  owner: {
    onboarding: "Rahul Sharma",
    website: null,
    probe42: "Rahul Sharma",
  },
  director: {
    onboarding: null,
    website: null,
    probe42: "Rahul Sharma, Priya Mehta",
  },
  details: {
    onboarding: "Rahul Sharma (Owner)",
    website: null,
    probe42: "Rahul Sharma (Owner)\nRahul Sharma (Director)\nPriya Mehta (Director)",
  },
};

// ── Analysis helpers ────────────────────────────────────────────────────────

function normalizeVal(val: string): string {
  return val
    .toLowerCase()
    .replace(/private limited/g, "pvt ltd")
    .replace(/pvt\.?\s*ltd\.?/g, "pvt ltd")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

export type BCFieldStatus = "match" | "conflict" | "insufficient";

export interface BCAnalysisResult {
  status: BCFieldStatus;
  conflicts: Array<{ original: string; sources: BCSource[] }>;
  matchingSources: BCSource[];
}

export function analyzeField(fieldData: BCDataRecord): BCAnalysisResult {
  const populated = BC_SOURCES.filter((s) => fieldData[s] != null) as BCSource[];
  if (populated.length <= 1) {
    return { status: "insufficient", conflicts: [], matchingSources: populated };
  }

  const normalized: Record<string, string> = {};
  populated.forEach((s) => {
    normalized[s] = normalizeVal(fieldData[s]!);
  });

  const uniqueVals = [...new Set(Object.values(normalized))];
  if (uniqueVals.length === 1) {
    return { status: "match", conflicts: [], matchingSources: populated };
  }

  // Group by normalized value to find conflicts
  const groups: Record<string, BCSource[]> = {};
  populated.forEach((s) => {
    const nv = normalized[s];
    if (!groups[nv]) groups[nv] = [];
    groups[nv].push(s);
  });

  const conflicts = Object.entries(groups).map(([, srcs]) => ({
    original: fieldData[srcs[0]]!,
    sources: srcs,
  }));

  return { status: "conflict", conflicts, matchingSources: populated };
}

export type BCAnalysis = Record<string, BCAnalysisResult>;

export function buildAnalysis(data: BCData): BCAnalysis {
  const result: BCAnalysis = {};
  BC_FIELD_GROUPS.forEach((group) => {
    group.fields.forEach((field) => {
      result[field.key] = analyzeField(data[field.key] || { onboarding: null, website: null, probe42: null });
    });
  });
  return result;
}
