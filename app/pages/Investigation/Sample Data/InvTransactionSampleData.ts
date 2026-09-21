import { ColorScheme } from '@/components/custom/CustomColorScheme';

import {
  CaseAnalysisSubcategory,
  WebsiteAnalysisIconName,
  WebsiteAnalysisValueSentiment,
  WebsiteAnalysisKeyValue,
  RedFlag
} from './InvCasesSampleData';

export interface VolumeAnalysisCell {
  successfulTxn: string;
  allTxn: string;
  unsuccTxn: string;
}

export interface VolumeAnalysisRow {
  rowLabel: string;
  keyIcon?: WebsiteAnalysisIconName;
  keyIconColor?: ColorScheme;
  lifetime: VolumeAnalysisCell;
  past30d: VolumeAnalysisCell;
  past7d: VolumeAnalysisCell;
  past1d: VolumeAnalysisCell;
}

export interface CaseVolumeAnalysisData
  extends CaseAnalysisSubcategory<VolumeAnalysisRow[]> {
  metrics?: WebsiteAnalysisKeyValue[];
}

export type CasePatternAnalysisData = CaseAnalysisSubcategory<
  WebsiteAnalysisKeyValue[]
>;

export interface TransactionStatusCell {
  allTxn: {
    byAmount: string;
    byCount: string;
    byAmountSentiment?: WebsiteAnalysisValueSentiment;
    byCountSentiment?: WebsiteAnalysisValueSentiment;
  };
  succTxn: {
    byAmount: string;
    byCount: string;
    byAmountSentiment?: WebsiteAnalysisValueSentiment;
    byCountSentiment?: WebsiteAnalysisValueSentiment;
  };
  unsuccTxn: {
    byAmount: string;
    byCount: string;
    byAmountSentiment?: WebsiteAnalysisValueSentiment;
    byCountSentiment?: WebsiteAnalysisValueSentiment;
  };
}

export interface TransactionStatusRow {
  rowLabel: string;
  keyIcon?: WebsiteAnalysisIconName;
  keyIconColor?: ColorScheme;
  lifetime: TransactionStatusCell;
  past30d: TransactionStatusCell;
  past7d: TransactionStatusCell;
  past1d: TransactionStatusCell;
}

export type CaseTransactionStatusData = CaseAnalysisSubcategory<
  TransactionStatusRow[]
>;

export interface TransactionModeCell {
  allTxn: {
    byAmount: string;
    byCount: string;
    byAmountSentiment?: WebsiteAnalysisValueSentiment;
    byCountSentiment?: WebsiteAnalysisValueSentiment;
  };
  succTxn: {
    byAmount: string;
    byCount: string;
    byAmountSentiment?: WebsiteAnalysisValueSentiment;
    byCountSentiment?: WebsiteAnalysisValueSentiment;
  };
  unsuccTxn: {
    byAmount: string;
    byCount: string;
    byAmountSentiment?: WebsiteAnalysisValueSentiment;
    byCountSentiment?: WebsiteAnalysisValueSentiment;
  };
}

export interface TransactionModeRow {
  rowLabel: string;
  keyIcon?: WebsiteAnalysisIconName;
  keyIconColor?: ColorScheme;
  lifetime: TransactionModeCell;
  past30d: TransactionModeCell;
  past7d: TransactionModeCell;
  past1d: TransactionModeCell;
}

export type CaseTransactionModeData = CaseAnalysisSubcategory<
  TransactionModeRow[]
>;

export interface TransactionCurrencyCell {
  allTxn: {
    byAmount: string;
    byCount: string;
  };
  succTxn: {
    byAmount: string;
    byCount: string;
  };
  unsuccTxn: {
    byAmount: string;
    byCount: string;
  };
}

export interface TransactionCurrencyRow {
  rowLabel: string;
  keyIcon?: WebsiteAnalysisIconName;
  keyIconColor?: ColorScheme;
  lifetime: TransactionCurrencyCell;
  past30d: TransactionCurrencyCell;
  past7d: TransactionCurrencyCell;
  past1d: TransactionCurrencyCell;
}

export type CaseTransactionCurrencyData = CaseAnalysisSubcategory<
  TransactionCurrencyRow[]
>;

export interface TransactionProxyCell {
  allTxn: {
    byAmount: string;
    byCount: string;
  };
  succTxn: {
    byAmount: string;
    byCount: string;
  };
  unsuccTxn: {
    byAmount: string;
    byCount: string;
  };
}

export interface TransactionProxyRow {
  rowLabel: string;
  keyIcon?: WebsiteAnalysisIconName;
  keyIconColor?: ColorScheme;
  lifetime: TransactionProxyCell;
  past30d: TransactionProxyCell;
  past7d: TransactionProxyCell;
  past1d: TransactionProxyCell;
}

export type CaseTransactionProxyData = CaseAnalysisSubcategory<
  TransactionProxyRow[]
>;

export interface TransactionTimeCell {
  allTxn: {
    byAmount: string;
    byCount: string;
  };
  succTxn: {
    byAmount: string;
    byCount: string;
  };
  unsuccTxn: {
    byAmount: string;
    byCount: string;
  };
}

export interface TransactionTimeRow {
  rowLabel: string;
  keyIcon?: WebsiteAnalysisIconName;
  keyIconColor?: ColorScheme;
  lifetime: TransactionTimeCell;
  past30d: TransactionTimeCell;
  past7d: TransactionTimeCell;
  past1d: TransactionTimeCell;
}

export type CaseTransactionTimeData = CaseAnalysisSubcategory<
  TransactionTimeRow[]
>;

export interface TransactionRegionCell {
  allTxn: {
    byAmount: string;
    byCount: string;
  };
  succTxn: {
    byAmount: string;
    byCount: string;
  };
  unsuccTxn: {
    byAmount: string;
    byCount: string;
  };
}

export interface TransactionRegionRow {
  rowLabel: string;
  keyIcon?: WebsiteAnalysisIconName;
  keyIconColor?: ColorScheme;
  lifetime: TransactionRegionCell;
  past30d: TransactionRegionCell;
  past7d: TransactionRegionCell;
  past1d: TransactionRegionCell;
}

export type CaseTransactionRegionData = CaseAnalysisSubcategory<
  TransactionRegionRow[]
>;

export interface TransactionGatewayCell {
  allTxn: {
    byAmount: string;
    byCount: string;
  };
  succTxn: {
    byAmount: string;
    byCount: string;
  };
  unsuccTxn: {
    byAmount: string;
    byCount: string;
  };
}

export interface TransactionGatewayRow {
  rowLabel: string;
  keyIcon?: WebsiteAnalysisIconName;
  keyIconColor?: ColorScheme;
  lifetime: TransactionGatewayCell;
  past30d: TransactionGatewayCell;
  past7d: TransactionGatewayCell;
  past1d: TransactionGatewayCell;
}

export type CaseTransactionGatewayData = CaseAnalysisSubcategory<
  TransactionGatewayRow[]
>;

export const invVolumeAnalysisData: Record<
  string,
  CaseVolumeAnalysisData
> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "Total Count",
        keyIcon: "Hash",
        keyIconColor: "blue",
        lifetime: {
          successfulTxn: "1,247",
          allTxn: "1,389",
          unsuccTxn: "142"
        },
        past30d: {
          successfulTxn: "342",
          allTxn: "387",
          unsuccTxn: "45"
        },
        past7d: {
          successfulTxn: "89",
          allTxn: "102",
          unsuccTxn: "13"
        },
        past1d: {
          successfulTxn: "12",
          allTxn: "14",
          unsuccTxn: "2"
        }
      },
      {
        rowLabel: "Total Amount",
        keyIcon: "Banknote",
        keyIconColor: "green",
        lifetime: {
          successfulTxn: "₹11,245,680",
          allTxn: "₹12,156,420",
          unsuccTxn: "₹9,10,740"
        },
        past30d: {
          successfulTxn: "₹3,087,450",
          allTxn: "₹3,342,180",
          unsuccTxn: "₹2,54,730"
        },
        past7d: {
          successfulTxn: "₹802,350",
          allTxn: "₹918,600",
          unsuccTxn: "₹1,16,250"
        },
        past1d: {
          successfulTxn: "₹108,240",
          allTxn: "₹125,400",
          unsuccTxn: "₹17,160"
        }
      },
      {
        rowLabel: "Min Amount",
        keyIcon: "ArrowDown",
        keyIconColor: "blue",
        lifetime: {
          successfulTxn: "₹4,500",
          allTxn: "₹4,500",
          unsuccTxn: "₹4,500"
        },
        past30d: {
          successfulTxn: "₹4,500",
          allTxn: "₹4,500",
          unsuccTxn: "₹4,500"
        },
        past7d: {
          successfulTxn: "₹5,540",
          allTxn: "₹4,500",
          unsuccTxn: "₹4,500"
        },
        past1d: {
          successfulTxn: "₹7,950",
          allTxn: "₹7,950",
          unsuccTxn: "₹7,950"
        }
      },
      {
        rowLabel: "Max Amount",
        keyIcon: "ArrowUp",
        keyIconColor: "blue",
        lifetime: {
          successfulTxn: "₹18,900",
          allTxn: "₹18,900",
          unsuccTxn: "₹18,900"
        },
        past30d: {
          successfulTxn: "₹18,900",
          allTxn: "₹18,900",
          unsuccTxn: "₹18,900"
        },
        past7d: {
          successfulTxn: "₹18,900",
          allTxn: "₹18,900",
          unsuccTxn: "₹18,900"
        },
        past1d: {
          successfulTxn: "₹9,950",
          allTxn: "₹9,950",
          unsuccTxn: "₹9,950"
        }
      },
      {
        rowLabel: "Avg Amount",
        keyIcon: "Activity",
        keyIconColor: "blue",
        lifetime: {
          successfulTxn: "₹9,014.50",
          allTxn: "₹8,754.32",
          unsuccTxn: "₹6,413.66"
        },
        past30d: {
          successfulTxn: "₹9,027.63",
          allTxn: "₹8,636.64",
          unsuccTxn: "₹5,660.67"
        },
        past7d: {
          successfulTxn: "₹9,010.67",
          allTxn: "₹9,005.88",
          unsuccTxn: "₹8,942.31"
        },
        past1d: {
          successfulTxn: "₹9,020.00",
          allTxn: "₹8,957.14",
          unsuccTxn: "₹8,580.00"
        }
      }
    ],
    redFlags: []
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Transaction Analysis",
    metrics: [
      {
        field: "Transactions inline with LOB",
        value: "Yes",
        keyIcon: "BadgeCheck",
        keyIconColor: "green",
        valueSentiment: "positive"
      }
    ],
    data: [
      {
        rowLabel: "Total Count",
        keyIcon: "Hash",
        keyIconColor: "blue",
        lifetime: {
          successfulTxn: "225",
          allTxn: "320",
          unsuccTxn: "95"
        },
        past30d: {
          successfulTxn: "113",
          allTxn: "148",
          unsuccTxn: "35"
        },
        past7d: {
          successfulTxn: "18",
          allTxn: "28",
          unsuccTxn: "10"
        },
        past1d: {
          successfulTxn: "5",
          allTxn: "10",
          unsuccTxn: "5"
        }
      },
      {
        rowLabel: "Total Amount",
        keyIcon: "Banknote",
        keyIconColor: "green",
        lifetime: {
          successfulTxn: "₹74,79,020",
          allTxn: "₹1,37,58,768",
          unsuccTxn: "₹62,79,748"
        },
        past30d: {
          successfulTxn: "₹40,67,463",
          allTxn: "₹66,56,199",
          unsuccTxn: "₹25,88,736"
        },
        past7d: {
          successfulTxn: "₹7,18,031",
          allTxn: "₹14,90,206",
          unsuccTxn: "₹7,72,175"
        },
        past1d: {
          successfulTxn: "₹1,32,473",
          allTxn: "₹2,90,880",
          unsuccTxn: "₹1,58,407"
        }
      },
      {
        rowLabel: "Min Amount",
        keyIcon: "ArrowDown",
        keyIconColor: "blue",
        lifetime: {
          successfulTxn: "₹46",
          allTxn: "₹1",
          unsuccTxn: "₹147"
        },
        past30d: {
          successfulTxn: "₹1,217",
          allTxn: "₹1",
          unsuccTxn: "₹3,813"
        },
        past7d: {
          successfulTxn: "₹10,918",
          allTxn: "₹10,748",
          unsuccTxn: "₹10,748"
        },
        past1d: {
          successfulTxn: "₹8,046",
          allTxn: "₹8,046",
          unsuccTxn: "₹22,973"
        }
      },
      {
        rowLabel: "Max Amount",
        keyIcon: "ArrowUp",
        keyIconColor: "blue",
        lifetime: {
          successfulTxn: "₹3,73,507",
          allTxn: "₹3,73,507",
          unsuccTxn: "₹3,70,213"
        },
        past30d: {
          successfulTxn: "₹3,73,507",
          allTxn: "₹3,73,507",
          unsuccTxn: "₹3,70,213"
        },
        past7d: {
          successfulTxn: "₹1,50,755",
          allTxn: "₹1,50,755",
          unsuccTxn: "₹1,50,755"
        },
        past1d: {
          successfulTxn: "₹44,935",
          allTxn: "₹44,935",
          unsuccTxn: "₹45,946"
        }
      },
      {
        rowLabel: "Avg Amount",
        keyIcon: "Activity",
        keyIconColor: "blue",
        lifetime: {
          successfulTxn: "₹33,240",
          allTxn: "₹43,009",
          unsuccTxn: "₹66,102"
        },
        past30d: {
          successfulTxn: "₹36,017",
          allTxn: "₹44,974",
          unsuccTxn: "₹73,964"
        },
        past7d: {
          successfulTxn: "₹39,891",
          allTxn: "₹53,222",
          unsuccTxn: "₹77,218"
        },
        past1d: {
          successfulTxn: "₹26,495",
          allTxn: "₹29,088",
          unsuccTxn: "₹31,681"
        }
      }
    ],
    redFlags: []
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "Total Count",
        keyIcon: "Hash",
        keyIconColor: "blue",
        lifetime: {
          successfulTxn: "12",
          allTxn: "15",
          unsuccTxn: "3"
        },
        past30d: {
          successfulTxn: "8",
          allTxn: "10",
          unsuccTxn: "2"
        },
        past7d: {
          successfulTxn: "2",
          allTxn: "3",
          unsuccTxn: "1"
        },
        past1d: {
          successfulTxn: "0",
          allTxn: "0",
          unsuccTxn: "0"
        }
      },
      {
        rowLabel: "Total Amount",
        keyIcon: "Banknote",
        keyIconColor: "green",
        lifetime: {
          successfulTxn: "₹2,20,000",
          allTxn: "₹2,45,000",
          unsuccTxn: "₹25,000"
        },
        past30d: {
          successfulTxn: "₹1,65,000",
          allTxn: "₹1,80,000",
          unsuccTxn: "₹15,000"
        },
        past7d: {
          successfulTxn: "₹40,000",
          allTxn: "₹45,000",
          unsuccTxn: "₹5,000"
        },
        past1d: {
          successfulTxn: "₹0",
          allTxn: "₹0",
          unsuccTxn: "₹0"
        }
      },
      {
        rowLabel: "Min Amount",
        keyIcon: "ArrowDown",
        keyIconColor: "red",
        lifetime: {
          successfulTxn: "₹5,000",
          allTxn: "₹5,000",
          unsuccTxn: "₹8,000"
        },
        past30d: {
          successfulTxn: "₹8,000",
          allTxn: "₹8,000",
          unsuccTxn: "₹7,000"
        },
        past7d: {
          successfulTxn: "₹15,000",
          allTxn: "₹15,000",
          unsuccTxn: "₹5,000"
        },
        past1d: {
          successfulTxn: "₹0",
          allTxn: "₹0",
          unsuccTxn: "₹0"
        }
      },
      {
        rowLabel: "Max Amount",
        keyIcon: "ArrowUp",
        keyIconColor: "green",
        lifetime: {
          successfulTxn: "₹50,000",
          allTxn: "₹50,000",
          unsuccTxn: "₹12,000"
        },
        past30d: {
          successfulTxn: "₹45,000",
          allTxn: "₹45,000",
          unsuccTxn: "₹8,000"
        },
        past7d: {
          successfulTxn: "₹25,000",
          allTxn: "₹25,000",
          unsuccTxn: "₹5,000"
        },
        past1d: {
          successfulTxn: "₹0",
          allTxn: "₹0",
          unsuccTxn: "₹0"
        }
      },
      {
        rowLabel: "Average Amount",
        keyIcon: "BarChart3",
        keyIconColor: "purple",
        lifetime: {
          successfulTxn: "₹18,333",
          allTxn: "₹16,333",
          unsuccTxn: "₹8,333"
        },
        past30d: {
          successfulTxn: "₹20,625",
          allTxn: "₹18,000",
          unsuccTxn: "₹7,500"
        },
        past7d: {
          successfulTxn: "₹20,000",
          allTxn: "₹15,000",
          unsuccTxn: "₹5,000"
        },
        past1d: {
          successfulTxn: "₹0",
          allTxn: "₹0",
          unsuccTxn: "₹0"
        }
      }
    ],
    redFlags: []
  }
};

export const invTransactionStatusData: Record<
  string,
  CaseTransactionStatusData
> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "SUCCESS",
        keyIcon: "CheckCircle2",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹11,245,680",
            byCount: "1,247"
          },
          succTxn: {
            byAmount: "₹11,245,680",
            byCount: "1,247"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹3,087,450",
            byCount: "342"
          },
          succTxn: {
            byAmount: "₹3,087,450",
            byCount: "342"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹802,350",
            byCount: "89"
          },
          succTxn: {
            byAmount: "₹802,350",
            byCount: "89"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹108,240",
            byCount: "12"
          },
          succTxn: {
            byAmount: "₹108,240",
            byCount: "12"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "FAILED",
        keyIcon: "AlertTriangle",
        keyIconColor: "red",
        lifetime: {
          allTxn: {
            byAmount: "₹456,240",
            byCount: "68"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹456,240",
            byCount: "68"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹127,365",
            byCount: "19"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹127,365",
            byCount: "19"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹485,000",
            byCount: "58",
            byCountSentiment: "negative"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹485,000",
            byCount: "58"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹8,580",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹8,580",
            byCount: "1"
          }
        }
      },
      {
        rowLabel: "INCOMPLETE",
        keyIcon: "Timer",
        keyIconColor: "yellow",
        lifetime: {
          allTxn: {
            byAmount: "₹234,180",
            byCount: "35"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹234,180",
            byCount: "35"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹65,430",
            byCount: "10"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹65,430",
            byCount: "10"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹29,100",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹29,100",
            byCount: "3"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹4,290",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹4,290",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "INIT_FAILED",
        keyIcon: "Ban",
        keyIconColor: "red",
        lifetime: {
          allTxn: {
            byAmount: "₹127,365",
            byCount: "19"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹127,365",
            byCount: "19"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹35,610",
            byCount: "6"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹35,610",
            byCount: "6"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹14,550",
            byCount: "2"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹14,550",
            byCount: "2"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹2,145",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹2,145",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "USER_DROPPED",
        keyIcon: "UserX",
        keyIconColor: "gray",
        lifetime: {
          allTxn: {
            byAmount: "₹68,745",
            byCount: "15"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹68,745",
            byCount: "15"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹19,230",
            byCount: "7"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹19,230",
            byCount: "7"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹185,000",
            byCount: "32"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹185,000",
            byCount: "32"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹1,430",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹1,430",
            byCount: "1"
          }
        }
      },
      {
        rowLabel: "Rest",
        keyIcon: "MoreHorizontal",
        keyIconColor: "gray",
        lifetime: {
          allTxn: {
            byAmount: "₹24,210",
            byCount: "5"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹24,210",
            byCount: "5"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹7,095",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹7,095",
            byCount: "3"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹4,800",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹4,800",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹715",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹715",
            byCount: "0"
          }
        }
      }
    ],
    redFlags: [
      {
        code: "TA015",
        redFlag: "Transaction spike noted in sliced data",
        severity: "Low",
        reasoning: "High % failed txn in past 7d (All Txn)",
        triggered: true
      }
    ]
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "SUCCESS",
        keyIcon: "CheckCircle2",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹74,79,020",
            byCount: "225"
          },
          succTxn: {
            byAmount: "₹74,79,020",
            byCount: "225"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹40,67,463",
            byCount: "113"
          },
          succTxn: {
            byAmount: "₹40,67,463",
            byCount: "113"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹7,18,031",
            byCount: "18"
          },
          succTxn: {
            byAmount: "₹7,18,031",
            byCount: "18"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹1,32,473",
            byCount: "5"
          },
          succTxn: {
            byAmount: "₹1,32,473",
            byCount: "5"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "FAILED",
        keyIcon: "AlertTriangle",
        keyIconColor: "red",
        lifetime: {
          allTxn: {
            byAmount: "₹62,79,748",
            byCount: "95"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹62,79,748",
            byCount: "95"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹25,88,736",
            byCount: "35"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹25,88,736",
            byCount: "35"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹7,72,175",
            byCount: "10",
            byCountSentiment: "negative"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹7,72,175",
            byCount: "10"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹1,58,407",
            byCount: "5",
            byCountSentiment: "negative"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹1,58,407",
            byCount: "5"
          }
        }
      }
    ],
    redFlags: [
      {
        code: "TA007",
        redFlag: "High proportion of failed transactions",
        severity: "High",
        reasoning: "The proportion of failed transactions is 95 out of 320 total, which is approximately 29.7%. This is significantly high for Financial Services and related categories, indicating a potential issue.",
        triggered: true
      }
    ]
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "SUCCESS",
        keyIcon: "CheckCircle2",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹2,20,000",
            byCount: "12"
          },
          succTxn: {
            byAmount: "₹2,20,000",
            byCount: "12"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹1,65,000",
            byCount: "8"
          },
          succTxn: {
            byAmount: "₹1,65,000",
            byCount: "8"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹40,000",
            byCount: "2"
          },
          succTxn: {
            byAmount: "₹40,000",
            byCount: "2"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "FAILED",
        keyIcon: "Ban",
        keyIconColor: "red",
        lifetime: {
          allTxn: {
            byAmount: "₹20,000",
            byCount: "2"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹20,000",
            byCount: "2"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹12,000",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹12,000",
            byCount: "1"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹5,000",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹5,000",
            byCount: "1"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "INCOMPLETE",
        keyIcon: "Timer",
        keyIconColor: "orange",
        lifetime: {
          allTxn: {
            byAmount: "₹5,000",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹5,000",
            byCount: "1"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹3,000",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹3,000",
            byCount: "1"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      }
    ],
    redFlags: []
  }
};

export const invTransactionModeData: Record<
  string,
  CaseTransactionModeData
> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "UPI-Intent",
        keyIcon: "Phone",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹4,862,568",
            byCount: "556"
          },
          succTxn: {
            byAmount: "₹4,498,273",
            byCount: "500"
          },
          unsuccTxn: {
            byAmount: "₹3,64,295",
            byCount: "56"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹1,336,872",
            byCount: "155"
          },
          succTxn: {
            byAmount: "₹1,234,979",
            byCount: "138"
          },
          unsuccTxn: {
            byAmount: "₹1,01,893",
            byCount: "17"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹367,440",
            byCount: "41"
          },
          succTxn: {
            byAmount: "₹320,939",
            byCount: "36"
          },
          unsuccTxn: {
            byAmount: "₹46,501",
            byCount: "5"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹50,160",
            byCount: "6"
          },
          succTxn: {
            byAmount: "₹13,866",
            byCount: "3"
          },
          unsuccTxn: {
            byAmount: "₹1,117",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "UPI-Collect",
        keyIcon: "ArrowDown",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹1,823,463",
            byCount: "208",
          },
          succTxn: {
            byAmount: "₹1,686,852",
            byCount: "187"
          },
          unsuccTxn: {
            byAmount: "₹1,36,611",
            byCount: "21"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹501,327",
            byCount: "58"
          },
          succTxn: {
            byAmount: "₹463,118",
            byCount: "51"
          },
          unsuccTxn: {
            byAmount: "₹38,209",
            byCount: "7"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹137,790",
            byCount: "15"
          },
          succTxn: {
            byAmount: "₹120,353",
            byCount: "13"
          },
          unsuccTxn: {
            byAmount: "₹15,602",
            byCount: "2"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹285,000",
            byCount: "28",
            byAmountSentiment: "negative",
            byCountSentiment: "negative"
          },
          succTxn: {
            byAmount: "₹78,777",
            byCount: "8",
            byAmountSentiment: "negative",
            byCountSentiment: "negative"
          },
          unsuccTxn: {
            byAmount: "₹6,347",
            byCount: "1"
          }
        }
      },
      {
        rowLabel: "UPI-CC",
        keyIcon: "Banknote",
        keyIconColor: "purple",
        lifetime: {
          allTxn: {
            byAmount: "₹1,215,642",
            byCount: "139"
          },
          succTxn: {
            byAmount: "₹1,124,568",
            byCount: "125"
          },
          unsuccTxn: {
            byAmount: "₹91,074",
            byCount: "14"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹334,218",
            byCount: "39"
          },
          succTxn: {
            byAmount: "₹308,745",
            byCount: "34"
          },
          unsuccTxn: {
            byAmount: "₹25,473",
            byCount: "5"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹91,860",
            byCount: "10"
          },
          succTxn: {
            byAmount: "₹80,235",
            byCount: "9"
          },
          unsuccTxn: {
            byAmount: "₹10,401",
            byCount: "1"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹12,540",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹3,466",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹279",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "CC",
        keyIcon: "Banknote",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹2,431,284",
            byCount: "278"
          },
          succTxn: {
            byAmount: "₹2,249,135",
            byCount: "249"
          },
          unsuccTxn: {
            byAmount: "₹1,82,149",
            byCount: "29"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹668,436",
            byCount: "77"
          },
          succTxn: {
            byAmount: "₹617,490",
            byCount: "68"
          },
          unsuccTxn: {
            byAmount: "₹50,946",
            byCount: "9"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹183,720",
            byCount: "20"
          },
          succTxn: {
            byAmount: "₹160,470",
            byCount: "17"
          },
          unsuccTxn: {
            byAmount: "₹20,803",
            byCount: "3"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹25,080",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹6,932",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹558",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "Net Banking",
        keyIcon: "Server",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹972,514",
            byCount: "111"
          },
          succTxn: {
            byAmount: "₹899,655",
            byCount: "99"
          },
          unsuccTxn: {
            byAmount: "₹72,859",
            byCount: "12"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹267,374",
            byCount: "31"
          },
          succTxn: {
            byAmount: "₹246,996",
            byCount: "27"
          },
          unsuccTxn: {
            byAmount: "₹20,378",
            byCount: "4"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹73,488",
            byCount: "8"
          },
          succTxn: {
            byAmount: "₹64,188",
            byCount: "7"
          },
          unsuccTxn: {
            byAmount: "₹8,321",
            byCount: "1"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹10,032",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹2,773",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹223",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "Wallet",
        keyIcon: "Currency",
        keyIconColor: "orange",
        lifetime: {
          allTxn: {
            byAmount: "₹607,821",
            byCount: "69"
          },
          succTxn: {
            byAmount: "₹562,284",
            byCount: "62"
          },
          unsuccTxn: {
            byAmount: "₹45,537",
            byCount: "7"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹167,109",
            byCount: "19"
          },
          succTxn: {
            byAmount: "₹154,373",
            byCount: "17"
          },
          unsuccTxn: {
            byAmount: "₹12,736",
            byCount: "2"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹57,554",
            byCount: "6"
          },
          succTxn: {
            byAmount: "₹40,118",
            byCount: "4"
          },
          unsuccTxn: {
            byAmount: "₹17,436",
            byCount: "2"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹10,313",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹1,733",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹8,580",
            byCount: "1"
          }
        }
      },
      {
        rowLabel: "Rest",
        keyIcon: "MoreHorizontal",
        keyIconColor: "gray",
        lifetime: {
          allTxn: {
            byAmount: "₹243,128",
            byCount: "28"
          },
          succTxn: {
            byAmount: "₹224,913",
            byCount: "25"
          },
          unsuccTxn: {
            byAmount: "₹18,215",
            byCount: "3"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹66,844",
            byCount: "8"
          },
          succTxn: {
            byAmount: "₹61,749",
            byCount: "7"
          },
          unsuccTxn: {
            byAmount: "₹5,095",
            byCount: "1"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹18,372",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹16,047",
            byCount: "3"
          },
          unsuccTxn: {
            byAmount: "₹2,080",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹2,508",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹693",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹56",
            byCount: "0"
          }
        }
      }
    ],
    redFlags: [
      {
        code: "TA015",
        redFlag: "Transaction spike noted in sliced data",
        severity: "Low",
        reasoning: "High UPI-Collect txn count in past 1d (All & Successful Txn)",
        triggered: true
      },
      {
        code: "TA004",
        redFlag: "High % UPI Collect transactions",
        severity: "Low",
        reasoning: "70% of past 1d txn from UPI-Collect",
        triggered: true
      }
    ]
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "UPI",
        keyIcon: "Phone",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹61,14,283",
            byCount: "215"
          },
          succTxn: {
            byAmount: "₹47,66,449",
            byCount: "185"
          },
          unsuccTxn: {
            byAmount: "₹13,47,834",
            byCount: "30"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹34,30,551",
            byCount: "101"
          },
          succTxn: {
            byAmount: "₹27,68,788",
            byCount: "90"
          },
          unsuccTxn: {
            byAmount: "₹6,61,763",
            byCount: "11"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹5,42,217",
            byCount: "16"
          },
          succTxn: {
            byAmount: "₹4,96,271",
            byCount: "14"
          },
          unsuccTxn: {
            byAmount: "₹45,946",
            byCount: "2"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹1,57,844",
            byCount: "6"
          },
          succTxn: {
            byAmount: "₹1,11,898",
            byCount: "4"
          },
          unsuccTxn: {
            byAmount: "₹45,946",
            byCount: "2"
          }
        }
      },
      {
        rowLabel: "NET_BANKING",
        keyIcon: "Server",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹37,94,566",
            byCount: "47"
          },
          succTxn: {
            byAmount: "₹15,95,154",
            byCount: "22"
          },
          unsuccTxn: {
            byAmount: "₹21,99,412",
            byCount: "25"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹20,31,068",
            byCount: "24"
          },
          succTxn: {
            byAmount: "₹8,64,009",
            byCount: "13"
          },
          unsuccTxn: {
            byAmount: "₹11,67,059",
            byCount: "11"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹8,61,019",
            byCount: "8"
          },
          succTxn: {
            byAmount: "₹1,99,710",
            byCount: "3"
          },
          unsuccTxn: {
            byAmount: "₹6,61,309",
            byCount: "5"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹78,864",
            byCount: "2"
          },
          succTxn: {
            byAmount: "₹20,575",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹58,289",
            byCount: "1"
          }
        }
      },
      {
        rowLabel: "DEBIT_CARD",
        keyIcon: "Banknote",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹35,02,988",
            byCount: "43"
          },
          succTxn: {
            byAmount: "₹10,10,008",
            byCount: "13"
          },
          unsuccTxn: {
            byAmount: "₹24,92,980",
            byCount: "30"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹10,17,427",
            byCount: "14"
          },
          succTxn: {
            byAmount: "₹3,27,257",
            byCount: "5"
          },
          unsuccTxn: {
            byAmount: "₹6,90,170",
            byCount: "9"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹64,920",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹64,920",
            byCount: "3"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹54,172",
            byCount: "2"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹54,172",
            byCount: "2"
          }
        }
      },
      {
        rowLabel: "CREDIT_CARD",
        keyIcon: "Banknote",
        keyIconColor: "purple",
        lifetime: {
          allTxn: {
            byAmount: "₹3,11,544",
            byCount: "11"
          },
          succTxn: {
            byAmount: "₹73,479",
            byCount: "3"
          },
          unsuccTxn: {
            byAmount: "₹2,38,065",
            byCount: "8"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹1,43,223",
            byCount: "7"
          },
          succTxn: {
            byAmount: "₹73,479",
            byCount: "3"
          },
          unsuccTxn: {
            byAmount: "₹69,744",
            byCount: "4"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "WALLET",
        keyIcon: "Banknote",
        keyIconColor: "orange",
        lifetime: {
          allTxn: {
            byAmount: "₹23,507",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹22,050",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹1,457",
            byCount: "2"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹22,050",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹22,050",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹22,050",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹22,050",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "UPI_CREDIT_CARD",
        keyIcon: "Banknote",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹11,880",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹11,880",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹11,880",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹11,880",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      }
    ],
    redFlags: []
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "UPI-Intent",
        keyIcon: "Phone",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹1,50,000",
            byCount: "8"
          },
          succTxn: {
            byAmount: "₹1,40,000",
            byCount: "7"
          },
          unsuccTxn: {
            byAmount: "₹10,000",
            byCount: "1"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹1,20,000",
            byCount: "6"
          },
          succTxn: {
            byAmount: "₹1,15,000",
            byCount: "5"
          },
          unsuccTxn: {
            byAmount: "₹5,000",
            byCount: "1"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹30,000",
            byCount: "2"
          },
          succTxn: {
            byAmount: "₹30,000",
            byCount: "2"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "Net Banking",
        keyIcon: "Banknote",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹70,000",
            byCount: "4"
          },
          succTxn: {
            byAmount: "₹60,000",
            byCount: "3"
          },
          unsuccTxn: {
            byAmount: "₹10,000",
            byCount: "1"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹45,000",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹35,000",
            byCount: "2"
          },
          unsuccTxn: {
            byAmount: "₹10,000",
            byCount: "1"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹15,000",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹10,000",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹5,000",
            byCount: "1"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "Wallet",
        keyIcon: "Banknote",
        keyIconColor: "purple",
        lifetime: {
          allTxn: {
            byAmount: "₹25,000",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹20,000",
            byCount: "2"
          },
          unsuccTxn: {
            byAmount: "₹5,000",
            byCount: "1"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹15,000",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹15,000",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      }
    ],
    redFlags: []
  }
};

export const invTransactionCurrencyData: Record<
  string,
  CaseTransactionCurrencyData
> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "INR",
        keyIcon: "Currency",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹1,03,32,957",
            byCount: "1,222"
          },
          succTxn: {
            byAmount: "₹95,58,828",
            byCount: "1,097"
          },
          unsuccTxn: {
            byAmount: "₹7,74,129",
            byCount: "125"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹28,40,853",
            byCount: "341"
          },
          succTxn: {
            byAmount: "₹26,24,333",
            byCount: "301"
          },
          unsuccTxn: {
            byAmount: "₹2,16,520",
            byCount: "40"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹7,80,810",
            byCount: "90"
          },
          succTxn: {
            byAmount: "₹6,81,998",
            byCount: "78"
          },
          unsuccTxn: {
            byAmount: "₹98,812",
            byCount: "12"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹1,06,590",
            byCount: "12"
          },
          succTxn: {
            byAmount: "₹92,004",
            byCount: "11"
          },
          unsuccTxn: {
            byAmount: "₹14,586",
            byCount: "1"
          }
        }
      },
      {
        rowLabel: "USD",
        keyIcon: "Dollar",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹12,15,642",
            byCount: "111"
          },
          succTxn: {
            byAmount: "₹11,24,568",
            byCount: "100"
          },
          unsuccTxn: {
            byAmount: "₹91,074",
            byCount: "11"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹3,34,218",
            byCount: "31"
          },
          succTxn: {
            byAmount: "₹3,08,745",
            byCount: "27"
          },
          unsuccTxn: {
            byAmount: "₹25,473",
            byCount: "4"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹91,860",
            byCount: "8"
          },
          succTxn: {
            byAmount: "₹80,235",
            byCount: "7"
          },
          unsuccTxn: {
            byAmount: "₹11,625",
            byCount: "1"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹12,540",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹10,824",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹1,716",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "JPY",
        keyIcon: "Banknote",
        keyIconColor: "red",
        lifetime: {
          allTxn: {
            byAmount: "₹4,86,257",
            byCount: "42"
          },
          succTxn: {
            byAmount: "₹4,49,827",
            byCount: "37"
          },
          unsuccTxn: {
            byAmount: "₹36,430",
            byCount: "5"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹1,33,687",
            byCount: "12"
          },
          succTxn: {
            byAmount: "₹1,23,498",
            byCount: "10"
          },
          unsuccTxn: {
            byAmount: "₹10,189",
            byCount: "2"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹36,744",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹32,094",
            byCount: "3"
          },
          unsuccTxn: {
            byAmount: "₹4,650",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹5,016",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹4,330",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹686",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "Rest",
        keyIcon: "MoreHorizontal",
        keyIconColor: "gray",
        lifetime: {
          allTxn: {
            byAmount: "₹1,21,564",
            byCount: "14"
          },
          succTxn: {
            byAmount: "₹1,12,457",
            byCount: "13"
          },
          unsuccTxn: {
            byAmount: "₹9,107",
            byCount: "1"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹33,422",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹30,874",
            byCount: "3"
          },
          unsuccTxn: {
            byAmount: "₹2,548",
            byCount: "0"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹9,186",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹8,023",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹1,163",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹1,254",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹1,082",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹172",
            byCount: "1"
          }
        }
      }
    ],
    redFlags: []
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "INR",
        keyIcon: "Currency",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹2,45,000",
            byCount: "15"
          },
          succTxn: {
            byAmount: "₹2,20,000",
            byCount: "12"
          },
          unsuccTxn: {
            byAmount: "₹25,000",
            byCount: "3"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹1,80,000",
            byCount: "10"
          },
          succTxn: {
            byAmount: "₹1,65,000",
            byCount: "8"
          },
          unsuccTxn: {
            byAmount: "₹15,000",
            byCount: "2"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹45,000",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹40,000",
            byCount: "2"
          },
          unsuccTxn: {
            byAmount: "₹5,000",
            byCount: "1"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      }
    ],
    redFlags: []
  }
};

export const invTransactionProxyData: Record<
  string,
  CaseTransactionProxyData
> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "DCH - Data Center IP",
        keyIcon: "Server",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹45,60,000",
            byCount: "520"
          },
          succTxn: {
            byAmount: "₹42,10,000",
            byCount: "470"
          },
          unsuccTxn: {
            byAmount: "₹3,50,000",
            byCount: "50"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹12,00,000",
            byCount: "135"
          },
          succTxn: {
            byAmount: "₹10,90,000",
            byCount: "120"
          },
          unsuccTxn: {
            byAmount: "₹1,10,000",
            byCount: "15"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹3,00,000",
            byCount: "32"
          },
          succTxn: {
            byAmount: "₹2,65,000",
            byCount: "28"
          },
          unsuccTxn: {
            byAmount: "₹35,000",
            byCount: "4"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹45,000",
            byCount: "5"
          },
          succTxn: {
            byAmount: "₹38,400",
            byCount: "4"
          },
          unsuccTxn: {
            byAmount: "₹6,600",
            byCount: "1"
          }
        }
      },
      {
        rowLabel: "PUB - Public IP",
        keyIcon: "Globe",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹32,40,000",
            byCount: "420"
          },
          succTxn: {
            byAmount: "₹30,00,000",
            byCount: "380"
          },
          unsuccTxn: {
            byAmount: "₹2,40,000",
            byCount: "40"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹9,20,000",
            byCount: "110"
          },
          succTxn: {
            byAmount: "₹8,50,000",
            byCount: "100"
          },
          unsuccTxn: {
            byAmount: "₹70,000",
            byCount: "10"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹2,40,000",
            byCount: "28"
          },
          succTxn: {
            byAmount: "₹2,20,000",
            byCount: "24"
          },
          unsuccTxn: {
            byAmount: "₹20,000",
            byCount: "4"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹32,400",
            byCount: "4"
          },
          succTxn: {
            byAmount: "₹31,920",
            byCount: "4"
          },
          unsuccTxn: {
            byAmount: "₹480",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "NA - Private IP",
        keyIcon: "Shield",
        keyIconColor: "purple",
        lifetime: {
          allTxn: {
            byAmount: "₹26,40,000",
            byCount: "300"
          },
          succTxn: {
            byAmount: "₹24,50,000",
            byCount: "280"
          },
          unsuccTxn: {
            byAmount: "₹1,90,000",
            byCount: "20"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹7,80,000",
            byCount: "90"
          },
          succTxn: {
            byAmount: "₹7,20,000",
            byCount: "80"
          },
          unsuccTxn: {
            byAmount: "₹60,000",
            byCount: "10"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹1,80,000",
            byCount: "22"
          },
          succTxn: {
            byAmount: "₹1,60,000",
            byCount: "19"
          },
          unsuccTxn: {
            byAmount: "₹20,000",
            byCount: "3"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹24,000",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹22,320",
            byCount: "3"
          },
          unsuccTxn: {
            byAmount: "₹1,680",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "VPN - VPN IP",
        keyIcon: "ShieldCheck",
        keyIconColor: "orange",
        lifetime: {
          allTxn: {
            byAmount: "₹17,16,420",
            byCount: "149"
          },
          succTxn: {
            byAmount: "₹15,85,680",
            byCount: "117"
          },
          unsuccTxn: {
            byAmount: "₹1,30,740",
            byCount: "32"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹4,42,180",
            byCount: "52"
          },
          succTxn: {
            byAmount: "₹4,27,450",
            byCount: "42"
          },
          unsuccTxn: {
            byAmount: "₹14,730",
            byCount: "10"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹1,98,600",
            byCount: "20"
          },
          succTxn: {
            byAmount: "₹1,57,350",
            byCount: "18"
          },
          unsuccTxn: {
            byAmount: "₹41,250",
            byCount: "2"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹24,000",
            byCount: "2"
          },
          succTxn: {
            byAmount: "₹15,600",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹8,400",
            byCount: "1"
          }
        }
      }
    ],
    redFlags: []
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "VPN - VPN IP",
        keyIcon: "ShieldCheck",
        keyIconColor: "orange",
        lifetime: {
          allTxn: {
            byAmount: "₹42,50,000",
            byCount: "6"
          },
          succTxn: {
            byAmount: "₹28,30,000",
            byCount: "4"
          },
          unsuccTxn: {
            byAmount: "₹14,20,000",
            byCount: "2"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹18,50,000",
            byCount: "2"
          },
          succTxn: {
            byAmount: "₹12,30,000",
            byCount: "2"
          },
          unsuccTxn: {
            byAmount: "₹6,20,000",
            byCount: "0"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "DCH - Data Center IP",
        keyIcon: "Server",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹35,80,000",
            byCount: "5"
          },
          succTxn: {
            byAmount: "₹21,40,000",
            byCount: "3"
          },
          unsuccTxn: {
            byAmount: "₹14,40,000",
            byCount: "2"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹12,60,000",
            byCount: "2"
          },
          succTxn: {
            byAmount: "₹8,40,000",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹4,20,000",
            byCount: "1"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "PUB - Public IP",
        keyIcon: "Globe",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹8,90,000",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹8,90,000",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹8,90,000",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹8,90,000",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹8,90,000",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹8,90,000",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      }
    ],
    redFlags: []
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "PUB - Public IP",
        keyIcon: "Globe",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹2,45,000",
            byCount: "15"
          },
          succTxn: {
            byAmount: "₹2,20,000",
            byCount: "12"
          },
          unsuccTxn: {
            byAmount: "₹25,000",
            byCount: "3"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹1,80,000",
            byCount: "10"
          },
          succTxn: {
            byAmount: "₹1,65,000",
            byCount: "8"
          },
          unsuccTxn: {
            byAmount: "₹15,000",
            byCount: "2"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹45,000",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹40,000",
            byCount: "2"
          },
          unsuccTxn: {
            byAmount: "₹5,000",
            byCount: "1"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      }
    ],
    redFlags: []
  }
};

export const invTransactionTimeData: Record<
  string,
  CaseTransactionTimeData
> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "Normal Day Hours (6am - 8pm)",
        keyIcon: "CalendarClock",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹79,50,000",
            byCount: "900"
          },
          succTxn: {
            byAmount: "₹73,20,000",
            byCount: "820"
          },
          unsuccTxn: {
            byAmount: "₹6,30,000",
            byCount: "80"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹21,50,000",
            byCount: "250"
          },
          succTxn: {
            byAmount: "₹19,80,000",
            byCount: "220"
          },
          unsuccTxn: {
            byAmount: "₹1,70,000",
            byCount: "30"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹5,20,000",
            byCount: "60"
          },
          succTxn: {
            byAmount: "₹4,55,000",
            byCount: "53"
          },
          unsuccTxn: {
            byAmount: "₹65,000",
            byCount: "7"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹72,000",
            byCount: "8"
          },
          succTxn: {
            byAmount: "₹62,400",
            byCount: "7"
          },
          unsuccTxn: {
            byAmount: "₹9,600",
            byCount: "1"
          }
        }
      },
      {
        rowLabel: "Normal Night Hours (8pm - 12am)",
        keyIcon: "Navigation",
        keyIconColor: "purple",
        lifetime: {
          allTxn: {
            byAmount: "₹29,40,000",
            byCount: "320"
          },
          succTxn: {
            byAmount: "₹27,60,000",
            byCount: "290"
          },
          unsuccTxn: {
            byAmount: "₹1,80,000",
            byCount: "30"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹7,80,000",
            byCount: "95"
          },
          succTxn: {
            byAmount: "₹7,15,750",
            byCount: "86"
          },
          unsuccTxn: {
            byAmount: "₹64,250",
            byCount: "9"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹2,45,000",
            byCount: "28"
          },
          succTxn: {
            byAmount: "₹2,15,000",
            byCount: "25"
          },
          unsuccTxn: {
            byAmount: "₹30,000",
            byCount: "3"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹33,000",
            byCount: "4"
          },
          succTxn: {
            byAmount: "₹27,540",
            byCount: "3"
          },
          unsuccTxn: {
            byAmount: "₹5,460",
            byCount: "1"
          }
        }
      },
      {
        rowLabel: "Late Night Hours (12am - 6am)",
        keyIcon: "Timer",
        keyIconColor: "orange",
        lifetime: {
          allTxn: {
            byAmount: "₹12,66,420",
            byCount: "169"
          },
          succTxn: {
            byAmount: "₹11,65,680",
            byCount: "137"
          },
          unsuccTxn: {
            byAmount: "₹1,00,740",
            byCount: "32"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹4,12,180",
            byCount: "42"
          },
          succTxn: {
            byAmount: "₹3,91,700",
            byCount: "36"
          },
          unsuccTxn: {
            byAmount: "₹20,480",
            byCount: "6"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹1,53,600",
            byCount: "14"
          },
          succTxn: {
            byAmount: "₹1,32,350",
            byCount: "11"
          },
          unsuccTxn: {
            byAmount: "₹21,250",
            byCount: "3"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹20,400",
            byCount: "2"
          },
          succTxn: {
            byAmount: "₹18,300",
            byCount: "2"
          },
          unsuccTxn: {
            byAmount: "₹2,100",
            byCount: "0"
          }
        }
      }
    ],
    redFlags: []
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "Day Hours (7 AM - 8 PM)",
        keyIcon: "CalendarClock",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹96,47,287",
            byCount: "199"
          },
          succTxn: {
            byAmount: "₹47,81,873",
            byCount: "134"
          },
          unsuccTxn: {
            byAmount: "₹48,65,414",
            byCount: "65"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹47,67,740",
            byCount: "97"
          },
          succTxn: {
            byAmount: "₹29,08,684",
            byCount: "75"
          },
          unsuccTxn: {
            byAmount: "₹18,59,056",
            byCount: "22"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹12,25,395",
            byCount: "15"
          },
          succTxn: {
            byAmount: "₹5,68,203",
            byCount: "9"
          },
          unsuccTxn: {
            byAmount: "₹6,57,192",
            byCount: "6"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹90,116",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹35,944",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹54,172",
            byCount: "2"
          }
        }
      },
      {
        rowLabel: "Night Hours (8 PM - 12 AM)",
        keyIcon: "Navigation",
        keyIconColor: "purple",
        lifetime: {
          allTxn: {
            byAmount: "₹14,26,582",
            byCount: "71"
          },
          succTxn: {
            byAmount: "₹12,03,069",
            byCount: "57"
          },
          unsuccTxn: {
            byAmount: "₹2,23,513",
            byCount: "14"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹6,84,605",
            byCount: "28"
          },
          succTxn: {
            byAmount: "₹4,96,747",
            byCount: "21"
          },
          unsuccTxn: {
            byAmount: "₹1,87,858",
            byCount: "7"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹1,29,752",
            byCount: "8"
          },
          succTxn: {
            byAmount: "₹73,058",
            byCount: "5"
          },
          unsuccTxn: {
            byAmount: "₹56,694",
            byCount: "3"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹97,540",
            byCount: "5"
          },
          succTxn: {
            byAmount: "₹51,594",
            byCount: "3"
          },
          unsuccTxn: {
            byAmount: "₹45,946",
            byCount: "2"
          }
        }
      },
      {
        rowLabel: "Late Night Hours (12 AM - 6 AM)",
        keyIcon: "Timer",
        keyIconColor: "orange",
        lifetime: {
          allTxn: {
            byAmount: "₹26,84,899",
            byCount: "50"
          },
          succTxn: {
            byAmount: "₹14,94,078",
            byCount: "34"
          },
          unsuccTxn: {
            byAmount: "₹11,90,821",
            byCount: "16"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹12,03,854",
            byCount: "23"
          },
          succTxn: {
            byAmount: "₹6,62,032",
            byCount: "17"
          },
          unsuccTxn: {
            byAmount: "₹5,41,822",
            byCount: "6"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹1,35,059",
            byCount: "5"
          },
          succTxn: {
            byAmount: "₹76,770",
            byCount: "4"
          },
          unsuccTxn: {
            byAmount: "₹58,289",
            byCount: "1"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹1,03,224",
            byCount: "2"
          },
          succTxn: {
            byAmount: "₹44,935",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹58,289",
            byCount: "1"
          }
        }
      }
    ],
    redFlags: []
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "Day Hours (7 AM - 8 PM)",
        keyIcon: "CalendarClock",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹1,80,000",
            byCount: "11"
          },
          succTxn: {
            byAmount: "₹1,65,000",
            byCount: "9"
          },
          unsuccTxn: {
            byAmount: "₹15,000",
            byCount: "2"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹1,35,000",
            byCount: "7"
          },
          succTxn: {
            byAmount: "₹1,25,000",
            byCount: "6"
          },
          unsuccTxn: {
            byAmount: "₹10,000",
            byCount: "1"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹30,000",
            byCount: "2"
          },
          succTxn: {
            byAmount: "₹30,000",
            byCount: "2"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "Night Hours (8 PM - 12 AM)",
        keyIcon: "Navigation",
        keyIconColor: "purple",
        lifetime: {
          allTxn: {
            byAmount: "₹45,000",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹40,000",
            byCount: "2"
          },
          unsuccTxn: {
            byAmount: "₹5,000",
            byCount: "1"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹30,000",
            byCount: "2"
          },
          succTxn: {
            byAmount: "₹25,000",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹5,000",
            byCount: "1"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹15,000",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹10,000",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹5,000",
            byCount: "1"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "Late Night Hours (12 AM - 6 AM)",
        keyIcon: "Timer",
        keyIconColor: "orange",
        lifetime: {
          allTxn: {
            byAmount: "₹20,000",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹15,000",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹5,000",
            byCount: "0"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹15,000",
            byCount: "1"
          },
          succTxn: {
            byAmount: "₹15,000",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      }
    ],
    redFlags: []
  }
};

export const invTransactionRegionData: Record<
  string,
  CaseTransactionRegionData
> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "New Delhi - Delhi - IND",
        keyIcon: "IndiaFlag",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹4,560,000",
            byCount: "520"
          },
          succTxn: {
            byAmount: "₹4,310,000",
            byCount: "470"
          },
          unsuccTxn: {
            byAmount: "₹250,000",
            byCount: "50"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹1,215,000",
            byCount: "150"
          },
          succTxn: {
            byAmount: "₹1,129,880",
            byCount: "133"
          },
          unsuccTxn: {
            byAmount: "₹85,120",
            byCount: "17"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹345,000",
            byCount: "38"
          },
          succTxn: {
            byAmount: "₹303,000",
            byCount: "33"
          },
          unsuccTxn: {
            byAmount: "₹42,000",
            byCount: "5"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹52,000",
            byCount: "5"
          },
          succTxn: {
            byAmount: "₹43,600",
            byCount: "4"
          },
          unsuccTxn: {
            byAmount: "₹8,400",
            byCount: "1"
          }
        }
      },
      {
        rowLabel: "NYC - New York City - USA",
        keyIcon: "UsaFlag",
        keyIconColor: "purple",
        lifetime: {
          allTxn: {
            byAmount: "₹2,940,000",
            byCount: "310"
          },
          succTxn: {
            byAmount: "₹2,760,000",
            byCount: "280"
          },
          unsuccTxn: {
            byAmount: "₹180,000",
            byCount: "30"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹780,000",
            byCount: "90"
          },
          succTxn: {
            byAmount: "₹715,750",
            byCount: "80"
          },
          unsuccTxn: {
            byAmount: "₹64,250",
            byCount: "10"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹190,000",
            byCount: "22"
          },
          succTxn: {
            byAmount: "₹166,000",
            byCount: "20"
          },
          unsuccTxn: {
            byAmount: "₹24,000",
            byCount: "2"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹24,000",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹24,000",
            byCount: "3"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "Mumbai - Maharashtra - IND",
        keyIcon: "IndiaFlag",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹3,180,000",
            byCount: "405"
          },
          succTxn: {
            byAmount: "₹2,880,000",
            byCount: "365"
          },
          unsuccTxn: {
            byAmount: "₹300,000",
            byCount: "40"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹840,000",
            byCount: "95"
          },
          succTxn: {
            byAmount: "₹782,820",
            byCount: "85"
          },
          unsuccTxn: {
            byAmount: "₹57,180",
            byCount: "10"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹240,000",
            byCount: "26"
          },
          succTxn: {
            byAmount: "₹210,000",
            byCount: "23"
          },
          unsuccTxn: {
            byAmount: "₹30,000",
            byCount: "3"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹32,400",
            byCount: "4"
          },
          succTxn: {
            byAmount: "₹26,640",
            byCount: "3"
          },
          unsuccTxn: {
            byAmount: "₹5,760",
            byCount: "1"
          }
        }
      },
      {
        rowLabel: "Rest",
        keyIcon: "MoreHorizontal",
        keyIconColor: "gray",
        lifetime: {
          allTxn: {
            byAmount: "₹1,476,420",
            byCount: "154"
          },
          succTxn: {
            byAmount: "₹1,295,680",
            byCount: "132"
          },
          unsuccTxn: {
            byAmount: "₹180,740",
            byCount: "22"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹507,180",
            byCount: "52"
          },
          succTxn: {
            byAmount: "₹459,000",
            byCount: "44"
          },
          unsuccTxn: {
            byAmount: "₹48,180",
            byCount: "8"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹143,600",
            byCount: "16"
          },
          succTxn: {
            byAmount: "₹123,350",
            byCount: "13"
          },
          unsuccTxn: {
            byAmount: "₹20,250",
            byCount: "3"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹17,000",
            byCount: "2"
          },
          succTxn: {
            byAmount: "₹14,000",
            byCount: "2"
          },
          unsuccTxn: {
            byAmount: "₹3,000",
            byCount: "0"
          }
        }
      }
    ],
    redFlags: []
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "Bengaluru - Karnataka - IND",
        keyIcon: "IndiaFlag",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹15,77,614",
            byCount: "28"
          },
          succTxn: {
            byAmount: "₹3,89,663",
            byCount: "11"
          },
          unsuccTxn: {
            byAmount: "₹11,87,951",
            byCount: "17"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹5,90,992",
            byCount: "9"
          },
          succTxn: {
            byAmount: "₹2,76,964",
            byCount: "5"
          },
          unsuccTxn: {
            byAmount: "₹3,14,028",
            byCount: "4"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "Mumbai - Maharashtra - IND",
        keyIcon: "IndiaFlag",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹8,38,561",
            byCount: "14"
          },
          succTxn: {
            byAmount: "₹3,41,360",
            byCount: "9"
          },
          unsuccTxn: {
            byAmount: "₹4,97,201",
            byCount: "5"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹6,22,758",
            byCount: "8"
          },
          succTxn: {
            byAmount: "₹2,99,995",
            byCount: "6"
          },
          unsuccTxn: {
            byAmount: "₹3,22,763",
            byCount: "2"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "Dubai - UAE",
        keyIcon: "Globe",
        keyIconColor: "purple",
        lifetime: {
          allTxn: {
            byAmount: "₹3,48,924",
            byCount: "12"
          },
          succTxn: {
            byAmount: "₹3,40,440",
            byCount: "10"
          },
          unsuccTxn: {
            byAmount: "₹8,484",
            byCount: "2"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹3,28,977",
            byCount: "7"
          },
          succTxn: {
            byAmount: "₹3,28,977",
            byCount: "7"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      },
      {
        rowLabel: "Hong Kong - HKG",
        keyIcon: "Globe",
        keyIconColor: "red",
        lifetime: {
          allTxn: {
            byAmount: "₹5,64,726",
            byCount: "6"
          },
          succTxn: {
            byAmount: "₹1,50,755",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹4,13,971",
            byCount: "5"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹5,64,726",
            byCount: "6"
          },
          succTxn: {
            byAmount: "₹1,50,755",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹4,13,971",
            byCount: "5"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹5,64,726",
            byCount: "6"
          },
          succTxn: {
            byAmount: "₹1,50,755",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹4,13,971",
            byCount: "5"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹1,12,461",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹1,12,461",
            byCount: "3"
          }
        }
      },
      {
        rowLabel: "Azadpur - Delhi - IND",
        keyIcon: "IndiaFlag",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹68,919",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹22,973",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹45,946",
            byCount: "2"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹68,919",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹22,973",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹45,946",
            byCount: "2"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹68,919",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹22,973",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹45,946",
            byCount: "2"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹68,919",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹22,973",
            byCount: "1"
          },
          unsuccTxn: {
            byAmount: "₹45,946",
            byCount: "2"
          }
        }
      },
      {
        rowLabel: "Rest",
        keyIcon: "MoreHorizontal",
        keyIconColor: "gray",
        lifetime: {
          allTxn: {
            byAmount: "₹1,03,61,024",
            byCount: "257"
          },
          succTxn: {
            byAmount: "₹57,73,829",
            byCount: "193"
          },
          unsuccTxn: {
            byAmount: "₹45,87,195",
            byCount: "64"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹49,79,817",
            byCount: "119"
          },
          succTxn: {
            byAmount: "₹31,80,792",
            byCount: "93"
          },
          unsuccTxn: {
            byAmount: "₹17,99,025",
            byCount: "26"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹8,56,561",
            byCount: "19"
          },
          succTxn: {
            byAmount: "₹5,44,303",
            byCount: "16"
          },
          unsuccTxn: {
            byAmount: "₹3,12,258",
            byCount: "3"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹1,09,500",
            byCount: "4"
          },
          succTxn: {
            byAmount: "₹1,09,500",
            byCount: "4"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      }
    ],
    redFlags: [
      {
        code: "TA008",
        redFlag: "Foreign geography detected",
        severity: "Low",
        reasoning: "Transactions are observed from low risk foreign cities such as Dubai, Hong Kong, which are outside the primary operating geography for Indian financial services and money transfer businesses. These cities are considered lower risk due to their international nature and potential for cross-border money movement.",
        triggered: true
      }
    ]
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "Hyderabad - Telangana - IND",
        keyIcon: "IndiaFlag",
        keyIconColor: "blue",
        lifetime: {
          allTxn: {
            byAmount: "₹2,45,000",
            byCount: "15"
          },
          succTxn: {
            byAmount: "₹2,20,000",
            byCount: "12"
          },
          unsuccTxn: {
            byAmount: "₹25,000",
            byCount: "3"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹1,80,000",
            byCount: "10"
          },
          succTxn: {
            byAmount: "₹1,65,000",
            byCount: "8"
          },
          unsuccTxn: {
            byAmount: "₹15,000",
            byCount: "2"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹45,000",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹40,000",
            byCount: "2"
          },
          unsuccTxn: {
            byAmount: "₹5,000",
            byCount: "1"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      }
    ],
    redFlags: []
  }
};

export const invTransactionGatewayData: Record<
  string,
  CaseTransactionGatewayData
> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "True",
        keyIcon: "CheckCircle2",
        keyIconColor: "green",
        lifetime: {
          allTxn: {
            byAmount: "₹4,865,280",
            byCount: "512"
          },
          succTxn: {
            byAmount: "₹4,420,000",
            byCount: "470"
          },
          unsuccTxn: {
            byAmount: "₹445,280",
            byCount: "42"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹1,265,000",
            byCount: "150"
          },
          succTxn: {
            byAmount: "₹1,129,880",
            byCount: "133"
          },
          unsuccTxn: {
            byAmount: "₹135,120",
            byCount: "17"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹356,000",
            byCount: "40"
          },
          succTxn: {
            byAmount: "₹310,500",
            byCount: "35"
          },
          unsuccTxn: {
            byAmount: "₹45,500",
            byCount: "5"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹54,000",
            byCount: "6"
          },
          succTxn: {
            byAmount: "₹45,600",
            byCount: "5"
          },
          unsuccTxn: {
            byAmount: "₹8,400",
            byCount: "1"
          }
        }
      },
      {
        rowLabel: "False",
        keyIcon: "Ban",
        keyIconColor: "red",
        lifetime: {
          allTxn: {
            byAmount: "₹7,291,140",
            byCount: "877"
          },
          succTxn: {
            byAmount: "₹6,825,680",
            byCount: "777"
          },
          unsuccTxn: {
            byAmount: "₹465,460",
            byCount: "100"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹2,077,180",
            byCount: "237"
          },
          succTxn: {
            byAmount: "₹1,957,570",
            byCount: "209"
          },
          unsuccTxn: {
            byAmount: "₹119,610",
            byCount: "28"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹562,600",
            byCount: "62"
          },
          succTxn: {
            byAmount: "₹491,850",
            byCount: "54"
          },
          unsuccTxn: {
            byAmount: "₹70,750",
            byCount: "8"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹71,400",
            byCount: "8"
          },
          succTxn: {
            byAmount: "₹62,640",
            byCount: "7"
          },
          unsuccTxn: {
            byAmount: "₹8,760",
            byCount: "1"
          }
        }
      }
    ],
    redFlags: []
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "False",
        keyIcon: "Ban",
        keyIconColor: "red",
        lifetime: {
          allTxn: {
            byAmount: "₹1,36,59,768",
            byCount: "320"
          },
          succTxn: {
            byAmount: "₹69,79,020",
            byCount: "225"
          },
          unsuccTxn: {
            byAmount: "₹66,80,748",
            byCount: "95"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹65,55,189",
            byCount: "152"
          },
          succTxn: {
            byAmount: "₹39,59,061",
            byCount: "112"
          },
          unsuccTxn: {
            byAmount: "₹25,96,128",
            byCount: "40"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹14,89,706",
            byCount: "32"
          },
          succTxn: {
            byAmount: "₹6,76,531",
            byCount: "21"
          },
          unsuccTxn: {
            byAmount: "₹8,13,175",
            byCount: "11"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹2,90,880",
            byCount: "10"
          },
          succTxn: {
            byAmount: "₹1,32,473",
            byCount: "4"
          },
          unsuccTxn: {
            byAmount: "₹1,58,407",
            byCount: "6"
          }
        }
      }
    ],
    redFlags: []
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        rowLabel: "False",
        keyIcon: "Ban",
        keyIconColor: "red",
        lifetime: {
          allTxn: {
            byAmount: "₹2,45,000",
            byCount: "15"
          },
          succTxn: {
            byAmount: "₹2,20,000",
            byCount: "12"
          },
          unsuccTxn: {
            byAmount: "₹25,000",
            byCount: "3"
          }
        },
        past30d: {
          allTxn: {
            byAmount: "₹1,80,000",
            byCount: "10"
          },
          succTxn: {
            byAmount: "₹1,65,000",
            byCount: "8"
          },
          unsuccTxn: {
            byAmount: "₹15,000",
            byCount: "2"
          }
        },
        past7d: {
          allTxn: {
            byAmount: "₹45,000",
            byCount: "3"
          },
          succTxn: {
            byAmount: "₹40,000",
            byCount: "2"
          },
          unsuccTxn: {
            byAmount: "₹5,000",
            byCount: "1"
          }
        },
        past1d: {
          allTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          succTxn: {
            byAmount: "₹0",
            byCount: "0"
          },
          unsuccTxn: {
            byAmount: "₹0",
            byCount: "0"
          }
        }
      }
    ],
    redFlags: []
  }
};

export const invPatternAnalysisData: Record<
  string,
  CasePatternAnalysisData
> = {
  INV002: {
    caseId: "INV002",
    analysisCategory: "Transaction Analysis",
    data: [
      {
        field: "Pattern summary",
        value: "No risky patterns found",
        keyIcon: "ShieldCheck",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Card testing pattern (multiple low amount card transactions)",
        value: "Not found",
        keyIcon: "Activity",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Flat-value pattern (e.g., multiple transactions ending in 0/1, 1999 repeated)",
        value: "Not found",
        keyIcon: "List",
        keyIconColor: "purple",
        valueSentiment: "positive"
      }
    ],
    redFlags: []
  }
};

