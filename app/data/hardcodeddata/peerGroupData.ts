// Types for peer group data
export interface PeerCompany {
  name: string;
  revenue_from_operations_in_million_inr?: number;
  revenue_from_operations_in_million_usd?: number;
  face_value_per_equity_share: string;
  closing_price_inr: string | number;
  closing_price_date: string;
  pe_ratio: string | number;
  eps_basic_inr: number;
  eps_diluted_inr: number;
  ronw_percent: number;
  nav_per_equity_share_inr: number;
  [key: string]: string | number | undefined;
}

export interface PeerGroupData {
  labels_map: {
    [key: string]: string;
  };
  data: PeerCompany[];
}

export const peerGroupData: PeerGroupData = {
  "labels_map": {
    "name": "Name of the Company",
    "revenue_from_operations_in_million_inr": "Revenue from Operations (in ₹ million)",
    "revenue_from_operations_in_million_usd": "Revenue from Operations (in $ million)",
    "face_value_per_equity_share": "Face value per equity share",
    "closing_price_inr": "Closing Price (₹)",
    "closing_price_date": "Closing Price Date",
    "pe_ratio": "P/E Ratio",
    "eps_basic_inr": "EPS (Basic) (₹)",
    "eps_diluted_inr": "EPS (Diluted) (₹)",
    "ronw_percent": "Return on Net Worth (RoNW) (%)",
    "nav_per_equity_share_inr": "NAV (₹ per equity share)"
  },
  "data": [
    {
      "name": "Bharat Coking Coal Limited",
      "revenue_from_operations_in_million_inr": 139984.50,
      "face_value_per_equity_share": "₹10",
      "closing_price_inr": "NA",
      "closing_price_date": "2025-05-27",
      "pe_ratio": "NA",
      "eps_basic_inr": 2.66,
      "eps_diluted_inr": 2.66,
      "ronw_percent": 20.83,
      "nav_per_equity_share_inr": 14.07
    },
    {
      "name": "Alpha Metallurgical Resources, Inc",
      "revenue_from_operations_in_million_usd": 253202.74,
      "face_value_per_equity_share": "$0.01",
      "closing_price_inr": 10269.97,
      "closing_price_date": "2025-05-27",
      "pe_ratio": 10.04,
      "eps_basic_inr": 1233.78,
      "eps_diluted_inr": 1222.65,
      "ronw_percent": 11.48,
      "nav_per_equity_share_inr": 11182.10
    },
    {
      "name": "Warrior Met Coal, Inc.",
      "revenue_from_operations_in_million_usd": 130589.34,
      "face_value_per_equity_share": "$0.01",
      "closing_price_inr": 4119.25,
      "closing_price_date": "2025-05-27",
      "pe_ratio": 8.40,
      "eps_basic_inr": 410.12,
      "eps_diluted_inr": 410.12,
      "ronw_percent": 12.82,
      "nav_per_equity_share_inr": 3423.71
    }
  ]
}; 