import { marker_positions } from "@/app/data/hardcodeddata/sampleRedFlagsData";

// Mutable mappings that will be updated based on data
export let ALL_MERCHANTS_MAPPING: Record<string, number> = {
    'Q0': 0,
    'Q25': 250, // Will be updated with 25th percentile value
    'Q50': 500, // Will be updated with 50th percentile value
    'Q75': 750, // Will be updated with 75th percentile value
    'Q100': 1000 // Will be updated with maximum value
  };
  
  export let CATEGORY_MAPPING: Record<string, number> = {
    'Q0': 0,
    'Q25': 250, // Will be updated with 25th percentile value
    'Q50': 500, // Will be updated with 50th percentile value
    'Q75': 750, // Will be updated with 75th percentile value
    'Q100': 1000 // Will be updated with maximum value
  };
  

interface RiskIndicatorProps {
    score: number;
    type: 'percentile' | 'risk-score';
    min?: number;
    max?: number;
    labelsFirst?: boolean;
    riskScore?: number;
    riskScoreLabels?: Record<string, number>;
    comparisonType?: 'all_merchants' | 'business_category';
}

export const RiskIndicator = ({ 
    score, 
    type,
    min = 0,
    max = 1000,
    labelsFirst = false,
    riskScore,
    riskScoreLabels,
    comparisonType = 'all_merchants'
  }: RiskIndicatorProps) => {
    // Get the appropriate mapping based on comparison type
    const mapping = comparisonType === 'all_merchants' ? ALL_MERCHANTS_MAPPING : CATEGORY_MAPPING;
    
    // Get the maximum value from the mapping
    const maxValue = Math.max(...Object.values(mapping));
    
    // Calculate normalized score based on the actual value and maximum value
    const normalizedScore = type === 'percentile'
      ? (score / 100) * 100  // Percentile is always out of 100
      : (score / maxValue) * 100;  // Risk score is relative to max value in mapping
    
    // Fixed percentile keys
    const percentileKeys = ['Q0', 'Q25', 'Q50', 'Q75', 'Q100'];
    
    // Get labels based on type
    const labels = percentileKeys.map(key => mapping[key]);
  
    // Calculate marker positions based on label values
    const markerPositions = marker_positions;
  
    // Get color based on risk score
    const getColor = () => {
      const scoreToUse = type === 'risk-score' ? score : (riskScore || 0);
      if (scoreToUse >= 500) return 'red';
      if (scoreToUse >= 300) return 'orange';
      if (scoreToUse >= 100) return 'yellow';
      return 'green';
    };
  
    const color = getColor();
    const colorMap: Record<string, string> = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500'
    };
  
    const textColorMap: Record<string, string> = {
      red: 'text-red-500',
      orange: 'text-orange-500',
      yellow: 'text-yellow-500',
      green: 'text-green-500'
    };
  
    return (
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            
            {/* Progress bar container */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
              {/* Actual progress bar */}
              <div 
                className={`h-full ${colorMap[color]}`}
                style={{ width: `${normalizedScore}%` }}
              />
              
              {/* Markers with increased size */}
              <div className="absolute inset-0">
                {markerPositions.map((position, index) => (
                  <div 
                    key={index}
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-gray-600 rounded-full -ml-1.5"
                    style={{ left: `${position}%` }}
                  />
                ))}
              </div>
            </div>
            
            {/* Labels */}
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              {labels.map((label, index) => (
                <span key={index}>{label}</span>
              ))}
            </div>
  
            {!labelsFirst && (
              <span className={`text-xs font-medium ${textColorMap[color]}`}>
                {type === 'percentile' ? `Percentile: ${score}th` : `Risk Score: ${score}`}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }; 