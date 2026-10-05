/**
 * Heroicons mapping for graph node types with grayscale colors
 * Each node type maps to icon color and background styling
 */
import {
  User,
  Users,
  FileText,
  Phone,
  Mail,
  MapPin,
  Landmark,
  Globe,
  Smartphone,
  Wallet,
  QrCode,
  Building2,
  MoreHorizontal,
  Store,
  LucideIcon
} from 'lucide-react';

export interface NodeIconConfig {
  iconType: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  size: number;
}

export const NODE_ICON_MAP: Record<string, NodeIconConfig> = {
  CUSTOMER: {
    iconType: 'CUSTOMER',
    icon: Users,
    color: '#a78bfa',
    bgColor: '#f3e8ff',
    size: 24
  },
  PERSON: {
    iconType: 'PERSON',
    icon: User,
    color: '#a78bfa',
    bgColor: '#f3e8ff',
    size: 24
  },
  GOV_ID: {
    iconType: 'GOV_ID',
    icon: FileText,
    color: '#fcd34d',
    bgColor: '#fef9c3',
    size: 24
  },
  PHONE: {
    iconType: 'PHONE',
    icon: Phone,
    color: '#86efac',
    bgColor: '#dcfce7',
    size: 24
  },
  EMAIL: {
    iconType: 'EMAIL',
    icon: Mail,
    color: '#a5f3fc',
    bgColor: '#cffafe',
    size: 24
  },
  ADDRESS: {
    iconType: 'ADDRESS',
    icon: MapPin,
    color: '#fca5a5',
    bgColor: '#fee2e2',
    size: 24
  },
  PINCODE: {
    iconType: 'PINCODE',
    icon: Landmark,
    color: '#c084fc',
    bgColor: '#f3e8ff',
    size: 24
  },
  GEOLOCATION: {
    iconType: 'GEOLOCATION',
    icon: Globe,
    color: '#f472b6',
    bgColor: '#fce7f3',
    size: 24
  },
  DEVICE: {
    iconType: 'DEVICE',
    icon: Smartphone,
    color: '#67e8f9',
    bgColor: '#cffafe',
    size: 24
  },
  BANK_ACCOUNT: {
    iconType: 'BANK_ACCOUNT',
    icon: Building2,
    color: '#5eead4',
    bgColor: '#ccfbf1',
    size: 24
  },
  UPI_VPA: {
    iconType: 'UPI_VPA',
    icon: Wallet,
    color: '#fb923c',
    bgColor: '#ffedd5',
    size: 24
  },
  BANK_BRANCH: {
    iconType: 'BANK_BRANCH',
    icon: Building2,
    color: '#94a3b8',
    bgColor: '#f1f5f9',
    size: 24
  },
  REFERENCE_CONTACT: {
    iconType: 'REFERENCE_CONTACT',
    icon: Phone,
    color: '#86efac',
    bgColor: '#dcfce7',
    size: 24
  },
  MERCHANT: {
    iconType: 'MERCHANT',
    icon: Store,
    color: '#d8b4fe',
    bgColor: '#f3e8ff',
    size: 24
  }
};

/**
 * Get icon configuration for a node type
 * Falls back to a generic icon if node type not found
 */
// Map degree (number or name) to a blue color scale
const degreeToBlueColor = (degree?: number | string) => {
  // Handle explicit degree 0 (isolated customer node) - map to dark blue same as first degree
  if (typeof degree === 'number' && degree === 0) {
    return '#1e40af'; // DARK_BLUE
  }

  // Use numeric if provided as string name
  let dNum: number | undefined;
  if (typeof degree === 'string') {
    const map: Record<string, number> = {
      first: 1,
      second: 2,
      third: 3,
      fourth: 4,
      fifth: 5,
      sixth: 6
    };
    dNum = map[degree.toLowerCase()];
  } else if (typeof degree === 'number') {
    dNum = degree;
  }

  // Default colors
  const DARK_BLUE = '#1e40af'; // 0, 1-2
  const MID_BLUE = '#3b82f6'; // 3-4
  const LIGHT_BLUE = '#93c5fd'; // 5-6

  if (dNum === undefined) return undefined;
  if (dNum <= 2) return DARK_BLUE;
  if (dNum <= 4) return MID_BLUE;
  return LIGHT_BLUE;
};

/**
 * Get icon configuration for a node type
 * If degree is provided, the returned config will override the base icon color
 */
export const getNodeIconConfig = (nodeType?: string, degree?: number | string): NodeIconConfig => {
  // Normalize node type
  const normalizedType = (nodeType || 'CUSTOMER').toUpperCase();
  const base = NODE_ICON_MAP[normalizedType] || NODE_ICON_MAP.CUSTOMER;

  // If a degree is provided and the node is NOT a CUSTOMER, force dark blue
  const DARK_BLUE = '#1e40af';
  const degreeColor = degreeToBlueColor(degree);
  if (degreeColor) {
    if (normalizedType !== 'CUSTOMER') {
      return {
        ...base,
        // Force dark blue for all degreeed non-customer node icons
        color: DARK_BLUE
      };
    }

    // For CUSTOMER nodes, preserve the degree-based color logic
    return {
      ...base,
      color: degreeColor
    };
  }

  return base;
};
