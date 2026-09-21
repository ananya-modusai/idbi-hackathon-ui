import { API } from './axios';

// Common fraud investigation query suggestions for financial institutions in India
const FRAUD_INVESTIGATION_SUGGESTIONS = [
    // BASIC QUERIES - These will appear first due to array order
    "Find transactions by this merchant",
    "Show basic merchant details",
    "Check merchant verification status",
    "List recent transactions",
    "Show merchant risk score",
    "View merchant KYC documents",
    "Check merchant banking details",
    "Show merchant registration date",
    "List all payment methods used",
    "Find customer complaints about this merchant",
    "Show merchant transaction volume",
    "Check merchant settlement status",
    "View merchant business category",
    "Show merchant location details",
    "List associated bank accounts",
    "Check for pending disputes",
    "Show merchant onboarding information",
    "Display transaction success rate",
    "Check merchant MCC code",
    "View recent refunds",
    
    // STANDARD QUERIES
    "Show transaction patterns for suspected fraud",
    "Compare transaction velocity with historical data",
    "Identify accounts with unusual activity in last 24 hours",
    "Analyze geographic distribution of transactions",
    "Find common attributes between flagged accounts",
    "Check for multiple accounts with same device fingerprint",
    "List transactions with mismatched billing and shipping addresses",
    "Detect rapid succession transactions from same card",
    "Show accounts with suspicious IP address changes",
    "Identify transactions from known fraud hotspots in India",
    "Analyze KYC documents for alterations or discrepancies",
    "Show accounts created from same device but different identities",
    "Find transactions from known money mule patterns",
    "Check for any UPI-related unusual activity patterns",
    "Compare customer activity with peer group behavior",
    
    // ADVANCED MERCHANT FRAUD INVESTIGATION QUERIES
    "Identify merchants with unusual refund rates compared to industry average",
    "Show merchants with significant increase in chargeback ratio in last 30 days",
    "Find merchants routing transactions through multiple payment methods to avoid velocity checks",
    "Detect merchants with sudden increase in transaction value after onboarding period",
    "Analyze merchants with mismatch between business category and transaction patterns",
    "Check for merchants with suspicious split payment patterns",
    "Identify merchants with multiple accounts under different business names but same ownership",
    "Show merchants with transaction amounts just below regulatory reporting thresholds",
    "Find merchants with unusual operating hours based on transaction timestamps",
    "Analyze correlation between merchant's social media presence and transaction volume",
    "Detect merchants processing transactions for prohibited goods or services",
    "Identify merchants with significant mismatch between declared and actual business volume",
    "Check for GSTIN inconsistencies across merchant's different account profiles",
    "Show transactions with high-value amounts for newly onboarded merchants",
    "Find merchants with abnormal settlement patterns or frequent balance inquiries",
    "Identify merchants with suspicious transaction decline to approval ratios",
    "Analyze merchants with high volume of international transactions for domestic-only business",
    "Detect merchants with frequent changes in bank account details for settlements",
    "Show transactions processed during merchant account suspension or review periods",
    "Find merchants with consistent authentication failures followed by successful transactions",
    "Identify correlations between customer complaints and specific merchant transaction patterns",
    "Analyze transactions from merchants in high-risk geographic areas of India",
    "Check for merchants using multiple payment terminals from unregistered locations",
    "Show merchants with high velocity of low-value verification transactions",
    "Detect merchants with mismatched business registration details across documents"
];

// Helper function to test if specific search terms work
const testSpecificSearch = (searchTerm: string) => {
    const lowerQuery = searchTerm.toLowerCase().trim();
    const matches = FRAUD_INVESTIGATION_SUGGESTIONS.filter(
        suggestion => suggestion.toLowerCase().includes(lowerQuery)
    );
    console.log(`Test search for "${searchTerm}" found ${matches.length} matches:`);
    matches.forEach(match => console.log(`- ${match}`));
    return matches;
};

// Run test for GSTIN search on module load
console.log("=== TESTING GSTIN SEARCH ===");
testSpecificSearch("GSTIN");
console.log("=== END TEST ===");

// Function to calculate match score between a query and a suggestion
const calculateMatchScore = (query: string, suggestion: string): number => {
    // Allow shorter words to match to handle cases like "get"
    const queryWords = query.toLowerCase().trim().split(/\s+/).filter(word => word.length >= 2);
    const suggestionLower = suggestion.toLowerCase();
    
    // Count how many query words are found in the suggestion
    let matchCount = 0;
    let totalWords = queryWords.length;
    
    // Check if any word in the query matches in the suggestion
    for (const word of queryWords) {
        if (suggestionLower.includes(word)) {
            matchCount++;
        }
    }
    
    // If no matches or query is empty, return 0
    if (matchCount === 0 || totalWords === 0) {
        return 0;
    }
    
    // Calculate match score as percentage of matched words
    return matchCount / totalWords;
};

// Function to find which parts of a suggestion should be highlighted
const getMatchRanges = (query: string, suggestion: string): Array<{start: number, end: number}> => {
    // Allow shorter words to match to handle cases like "get"
    const queryWords = query.toLowerCase().trim().split(/\s+/).filter(word => word.length >= 2);
    const suggestionLower = suggestion.toLowerCase();
    const matchRanges: Array<{start: number, end: number}> = [];
    
    // Find the position of each query word in the suggestion
    for (const word of queryWords) {
        let startIndex = 0;
        let wordIndex: number;
        
        // Look for all occurrences of the word in the suggestion
        while ((wordIndex = suggestionLower.indexOf(word, startIndex)) !== -1) {
            // Add the match
            matchRanges.push({
                start: wordIndex,
                end: wordIndex + word.length
            });
            
            // Move to find next occurrence
            startIndex = wordIndex + word.length;
        }
    }
    
    // Sort ranges by start position and merge overlapping ranges
    if (matchRanges.length > 1) {
        matchRanges.sort((a, b) => a.start - b.start);
        
        const mergedRanges: Array<{start: number, end: number}> = [];
        let currentRange = matchRanges[0];
        
        for (let i = 1; i < matchRanges.length; i++) {
            const nextRange = matchRanges[i];
            
            // Check if ranges overlap
            if (nextRange.start <= currentRange.end) {
                // Merge ranges
                currentRange.end = Math.max(currentRange.end, nextRange.end);
            } else {
                // Add the current range and move to the next one
                mergedRanges.push(currentRange);
                currentRange = nextRange;
            }
        }
        
        // Add the last range
        mergedRanges.push(currentRange);
        
        return mergedRanges;
    }
    
    return matchRanges;
};

export const promptsService = {
    postInvestigationGptPrompts: async (context: any) => {
        const response = await API.post(`/api/v1/chat/investigation-gpt-promopt-suggestions`, { data : context });
        return response.data.prompts;
    },

    getFraudInvestigationSuggestions: async (query?: string): Promise<string[]> => {
        // If we have a backend endpoint, we can use it instead of the static list
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (!query || query.trim() === '') {
                // Return top 5 suggestions, which will be basic queries due to array order
                return FRAUD_INVESTIGATION_SUGGESTIONS.slice(0, 5);
            }
            
            // Filter and score suggestions based on the query
            const trimmedQuery = query.trim();
            
            // Log the search query for debugging purposes
            console.log(`Searching for: "${trimmedQuery}"`);
            
            // Calculate match scores for all suggestions
            const scoredSuggestions = FRAUD_INVESTIGATION_SUGGESTIONS.map(suggestion => ({
                suggestion,
                score: calculateMatchScore(trimmedQuery, suggestion)
            }));
            
            // Filter out suggestions with zero score
            const matches = scoredSuggestions
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score) // Sort by score (highest first)
                .map(item => item.suggestion);
            
            // Log all matching suggestions for debugging
            console.log(`Found ${matches.length} matches for "${trimmedQuery}"`);
            if (matches.length > 0) {
                matches.forEach((match, index) => console.log(`${index+1}. ${match}`));
            }
            
            // Return up to 5 matches
            return matches.slice(0, 5);
        } catch (error) {
            console.error('Error fetching fraud investigation suggestions:', error);
            return FRAUD_INVESTIGATION_SUGGESTIONS.slice(0, 5);
        }
    },
    
    // New function to get suggestions with highlighting information
    getFraudInvestigationSuggestionsWithHighlighting: async (query?: string): Promise<Array<{
        suggestion: string,
        highlightRanges: Array<{start: number, end: number}>
    }>> => {
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (!query || query.trim() === '') {
                // Return top 5 suggestions without highlights
                return FRAUD_INVESTIGATION_SUGGESTIONS.slice(0, 5).map(suggestion => ({
                    suggestion,
                    highlightRanges: []
                }));
            }
            
            const trimmedQuery = query.trim();
            
            // Calculate match scores and highlight ranges for all suggestions
            const scoredSuggestions = FRAUD_INVESTIGATION_SUGGESTIONS.map(suggestion => ({
                suggestion,
                score: calculateMatchScore(trimmedQuery, suggestion),
                highlightRanges: getMatchRanges(trimmedQuery, suggestion)
            }));
            
            // Filter out suggestions with zero score
            const matches = scoredSuggestions
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score) // Sort by score (highest first)
                .slice(0, 5); // Take top 5
            
            return matches;
        } catch (error) {
            console.error('Error fetching fraud investigation suggestions with highlighting:', error);
            return FRAUD_INVESTIGATION_SUGGESTIONS.slice(0, 5).map(suggestion => ({
                suggestion,
                highlightRanges: []
            }));
        }
    }
}