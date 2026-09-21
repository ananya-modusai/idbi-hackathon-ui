export interface MerchantRun {
  mid: string;
  legalName: string;
  runStarted: string;
  decisioningTime: string | null;
  totalRunTime: string | null;
  checksDone: string;
  checksDecision: "Suspected Fraud" | "Not Fraud" | "Running";
}

export interface BatchRun {
  id: string;
  date: string;
  runName: string;
  merchants: MerchantRun[];
}

export const MOCK_BATCHES: BatchRun[] = [
  {
    id: "run-1-13",
    date: "13 Apr 2026",
    runName: "Run-1",
    merchants: [
      {
        mid: "MID77231",
        legalName: "Cloud Nine Retailers",
        runStarted: "10:00 AM",
        decisioningTime: "2m 30s",
        totalRunTime: "5m 12s",
        checksDone: "50/50",
        checksDecision: "Not Fraud",
      },
      {
        mid: "MID77232",
        legalName: "Oceanic Exports",
        runStarted: "10:05 AM",
        decisioningTime: "4m 15s",
        totalRunTime: null,
        checksDone: "42/50",
        checksDecision: "Suspected Fraud",
      },
      {
        mid: "MID77233",
        legalName: "Spark Digital",
        runStarted: "10:10 AM",
        decisioningTime: null,
        totalRunTime: null,
        checksDone: "12/50",
        checksDecision: "Running",
      },
    ],
  },
  {
    id: "run-2-13",
    date: "13 Apr 2026",
    runName: "Run-2",
    merchants: [
      {
        mid: "MID88101",
        legalName: "Golden Harvest",
        runStarted: "02:00 PM",
        decisioningTime: "3m 45s",
        totalRunTime: "6m 20s",
        checksDone: "50/50",
        checksDecision: "Not Fraud",
      },
      {
        mid: "MID88102",
        legalName: "Silver Line Tech",
        runStarted: "02:15 PM",
        decisioningTime: "1m 20s",
        totalRunTime: "4m 50s",
        checksDone: "50/50",
        checksDecision: "Suspected Fraud",
      },
    ],
  },
  {
    id: "run-1-14",
    date: "14 Apr 2026",
    runName: "Run-1",
    merchants: [
      {
        mid: "MID99300",
        legalName: "Evergreen Logistics",
        runStarted: "09:30 AM",
        decisioningTime: "5m 05s",
        totalRunTime: "8m 15s",
        checksDone: "50/50",
        checksDecision: "Not Fraud",
      },
    ],
  },
  {
    id: "run-1-15",
    date: "15 Apr 2026",
    runName: "Run-1",
    merchants: [
      {
        mid: "MID10293",
        legalName: "Pulse Payments",
        runStarted: "11:00 AM",
        decisioningTime: null,
        totalRunTime: null,
        checksDone: "5/50",
        checksDecision: "Running",
      },
    ],
  },
];

export const MOCK_METRICS = [
  { label: "Runs Scheduled", value: 12, icon: "Calendar" },
  { label: "Applications Processed", value: 458, icon: "FileCheck" },
  { label: "% Decisioned in 5min", value: "92%", icon: "Clock" },
  { label: "Avg Decisioning Time", value: "3m 12s", icon: "Zap" },
];
