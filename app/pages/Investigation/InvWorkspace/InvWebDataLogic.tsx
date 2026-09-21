import { ColorScheme } from "@/components/custom/CustomColorScheme";
import {
  WebsiteAnalysisKeyValue,
  WebsiteAnalysisValueSentiment,
  WebsiteAnalysisIconName,
} from "../Sample Data/InvCasesSampleData";

/**
 * Helper function to format field names for all tables
 * - Capitalizes first letter of each word
 * - Replaces underscores with spaces
 * - Makes HTTP, HTTPS, URL, SSL, IP all caps if they are standalone words
 * - Removes prefix before dot if removePrefix is true
 */
export const formatFieldName = (
  fieldName: string,
  removePrefix: boolean = false
): string => {
  let formatted = fieldName;

  // Remove prefix before dot if requested
  if (removePrefix) {
    const lastDotIndex = formatted.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      formatted = formatted.substring(lastDotIndex + 1);
    }
  }

  // Replace underscores with spaces
  formatted = formatted.replace(/_/g, " ");

  // Words that should be all caps when standalone
  const allCapsWords = ["HTTP", "HTTPS", "URL", "SSL", "IP"];

  // Split into words and process each
  formatted = formatted
    .split(" ")
    .map((word) => {
      // Check if word (case-insensitive) matches any of the all-caps words
      const upperWord = word.toUpperCase();
      if (allCapsWords.includes(upperWord)) {
        return upperWord;
      }
      // Otherwise, capitalize first letter and lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  return formatted;
};

/**
 * Helper function to transform nested objects into key-value pairs
 */
export const transformToKeyValue = (
  obj: any,
  prefix: string = "",
  icon: WebsiteAnalysisIconName = "Info",
  iconColor: ColorScheme = "gray",
  sentiment: WebsiteAnalysisValueSentiment = "info"
): WebsiteAnalysisKeyValue[] => {
  const result: WebsiteAnalysisKeyValue[] = [];

  if (obj === null || obj === undefined) {
    return result;
  }

  if (
    typeof obj === "string" ||
    typeof obj === "number" ||
    typeof obj === "boolean"
  ) {
    result.push({
      field: prefix || "Value",
      value: String(obj),
      keyIcon: icon,
      keyIconColor: iconColor,
      valueSentiment: sentiment,
    });
    return result;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      result.push({
        field: prefix || "Value",
        value: "No items",
        keyIcon: icon,
        keyIconColor: iconColor,
        valueSentiment: "neutral",
      });
    } else {
      obj.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          const nested = transformToKeyValue(
            item,
            `${prefix}[${index}]`,
            icon,
            iconColor,
            sentiment
          );
          result.push(...nested);
        } else {
          result.push({
            field: `${prefix}[${index}]`,
            value: String(item),
            keyIcon: icon,
            keyIconColor: iconColor,
            valueSentiment: sentiment,
          });
        }
      });
    }
    return result;
  }

  if (typeof obj === "object") {
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      const fieldName = prefix ? `${prefix}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const nested = transformToKeyValue(
          value,
          fieldName,
          icon,
          iconColor,
          sentiment
        );
        result.push(...nested);
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          result.push({
            field: fieldName,
            value: "No items",
            keyIcon: icon,
            keyIconColor: iconColor,
            valueSentiment: "neutral",
          });
        } else {
          value.forEach((item, index) => {
            if (typeof item === "object" && item !== null) {
              const nested = transformToKeyValue(
                item,
                `${fieldName}[${index}]`,
                icon,
                iconColor,
                sentiment
              );
              result.push(...nested);
            } else {
              result.push({
                field: `${fieldName}[${index}]`,
                value: String(item),
                keyIcon: icon,
                keyIconColor: iconColor,
                valueSentiment: sentiment,
              });
            }
          });
        }
      } else {
        result.push({
          field: fieldName,
          value: value === null || value === undefined ? "N/A" : String(value),
          keyIcon: icon,
          keyIconColor: iconColor,
          valueSentiment: sentiment,
        });
      }
    });
  }

  return result;
};

/**
 * Social media platform configuration type
 */
export interface SocialMediaPlatform {
  name: string;
  key: string;
  data: any;
  icon: WebsiteAnalysisIconName;
}

/**
 * Formats a platform key into a human-readable platform name
 * Examples:
 * - "facebook_social_media_data" -> "Facebook"
 * - "play.google_social_media_data" -> "Play Store"
 * - "apps.apple.com_social_media_data" -> "Apple App Store"
 */
const formatPlatformName = (key: string): string => {
  // Remove the _social_media_data suffix
  let platformKey = key.replace(/_social_media_data$/, "");

  // Handle special cases for app stores
  if (platformKey === "play.google") {
    return "Play Store";
  }
  if (platformKey === "apps.apple.com") {
    return "Apple App Store";
  }

  // Replace dots and underscores with spaces, then format
  platformKey = platformKey.replace(/[._]/g, " ");

  // Capitalize first letter of each word
  return platformKey
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Determines the appropriate icon for a platform based on its key
 */
const getPlatformIcon = (key: string): WebsiteAnalysisIconName => {
  // App stores use ShoppingCart icon
  if (key.includes("play.google") || key.includes("apps.apple.com")) {
    return "ShoppingCart";
  }
  // All other social media platforms use Users icon
  return "Users";
};

/**
 * Extracts a field from raw social media data, checking multiple locations
 */
export const extractSocialField = (raw: any, platform: string, fieldNames: string[]) => {
  if (!raw) return null;
  const platformLower = platform.toLowerCase();
  
  for (const f of fieldNames) {
    // 1. Top level
    if (raw[f] !== undefined && raw[f] !== null) return raw[f];
    
    // 2. Site Data
    const sd = raw.site_data;
    if (sd) {
      if (sd[f] !== undefined && sd[f] !== null) return sd[f];
      
      const psd = sd[platformLower];
      if (psd) {
        if (Array.isArray(psd)) {
          if (psd[0] && psd[0][f] !== undefined && psd[0][f] !== null)
            return psd[0][f];
        } else if (psd[f] !== undefined && psd[f] !== null) return psd[f];
      }
      
      const flatKey = `${platformLower}_${f}`;
      if (sd[flatKey] !== undefined && sd[flatKey] !== null)
        return sd[flatKey];

      // Also check 'social_media' array in site_data
      if (Array.isArray(sd.social_media) && sd.social_media[0]) {
        if (sd.social_media[0][f] !== undefined && sd.social_media[0][f] !== null)
          return sd.social_media[0][f];
      }
    }
    
    // 3. Raw Apify / Amplify
    if (raw.raw_apify && raw.raw_apify[f] !== undefined && raw.raw_apify[f] !== null) return raw.raw_apify[f];
    if (raw.raw_amplify && raw.raw_amplify[f] !== undefined && raw.raw_amplify[f] !== null) return raw.raw_amplify[f];
    
    // 4. Special cases for YouTube
    if (platformLower === 'youtube' && raw.raw_apify?.aboutChannelInfo) {
      if (f === 'posts' || f === 'total_videos_or_reels') {
        return raw.raw_apify.aboutChannelInfo.channelTotalVideos;
      }
    }
  }
  return null;
};

/**
 * Extracts and consolidates social media platforms from website data
 * This function is platform-agnostic and will automatically discover any
 * keys ending with "_social_media_data" in the data structure.
 */
export const getSocialMediaPlatforms = (
  websiteDataJson: any
): SocialMediaPlatform[] => {
  const platforms: SocialMediaPlatform[] = [];
  const socialMediaDataSuffix = "_social_media_data";

  if (!websiteDataJson || typeof websiteDataJson !== "object") {
    return platforms;
  }

  // Handle the consolidated 'platforms' object structure if it exists
  if (websiteDataJson.platforms && typeof websiteDataJson.platforms === 'object') {
    Object.keys(websiteDataJson.platforms).forEach((key) => {
      const value = websiteDataJson.platforms[key];
      // Skip if marked as not found
      if (value && value.not_found) return;
      
      if (value) {
        platforms.push({
          name: formatPlatformName(key),
          key: key,
          data: Array.isArray(value) ? value : [value],
          icon: getPlatformIcon(key),
        });
      }
    });
    
    // If we found platforms in the new structure, prefer it
    if (platforms.length > 0) return platforms;
  }

  // Fallback to legacy structure: iterate through all keys in the data object
  Object.keys(websiteDataJson).forEach((key) => {
    // Check if this key represents social media data
    if (key.endsWith(socialMediaDataSuffix)) {
      const value = websiteDataJson[key];

      // Only process if it's a non-empty array
      if (Array.isArray(value) && value.length > 0) {
        platforms.push({
          name: formatPlatformName(key),
          key: key,
          data: value, // Store all items, not just the first one
          icon: getPlatformIcon(key),
        });
      }
    }
  });

  return platforms;
};

/**
 * Transforms key-value data for table display
 */
export const transformKeyValueData = (data: WebsiteAnalysisKeyValue[]) => {
  return data.map((row) => ({
    field: row.field,
    value: row.value,
    keyIcon: row.keyIcon,
    keyIconColor: row.keyIconColor,
    valueSentiment: row.valueSentiment,
  }));
};

/**
 * Gets the selected platform data from the platforms array
 */
export const getSelectedPlatformData = (
  platforms: SocialMediaPlatform[],
  selectedPlatformName: string
): SocialMediaPlatform | null => {
  const platform = platforms.find((p) => p.name === selectedPlatformName);
  if (!platform) {
    // Default to first available platform
    return platforms.length > 0 ? platforms[0] : null;
  }
  return platform;
};

/**
 * Gets all URL entries for a selected platform
 * Returns an array of platform data items, each representing a different URL
 */
export const getAllPlatformUrlEntries = (
  platformData: SocialMediaPlatform | null
): Array<{ url: string; data: any; index: number }> => {
  if (!platformData) return [];

  // platformData.data is now an array of all URL entries
  if (!Array.isArray(platformData.data)) {
    return [];
  }

  return platformData.data.map((item: any, index: number) => {
    // Extract URL from various possible locations
    const url =
      item?.url ||
      item?.raw_apify?.url ||
      item?.raw_amplify?.url ||
      item?.site_data?.facebook?.url ||
      item?.site_data?.social_media?.[0]?.url ||
      item?.site_data?.social_media?.[0]?.profile_url ||
      item?.site_data?.linkedin?.url ||
      item?.site_data?.linkedin_url ||
      item?.site_data?.youtube?.url ||
      `Entry ${index + 1}`;

    return {
      url,
      data: item,
      index,
    };
  });
};

/**
 * Helper function to safely get nested value from object
 * Handles arrays by taking the first element
 */
const getNestedValue = (obj: any, path: string[]): any => {
  let current = obj;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (current === null || current === undefined) return null;

    // If current is an array, take the first element
    if (Array.isArray(current)) {
      if (current.length === 0) return null;
      current = current[0];
    }

    // Access the key
    if (typeof current === "object" && current !== null) {
      current = current[key];
    } else {
      return null;
    }

    if (current === null || current === undefined) return null;
  }
  return current;
};

/**
 * Helper to extract value from various possible paths
 */
const extractValue = (data: any, paths: string[][]): string | null => {
  for (const path of paths) {
    const value = getNestedValue(data, path);
    if (value !== null && value !== undefined && value !== "") {
      return String(value);
    }
  }
  return null;
};

/**
 * Transforms selected platform data into key-value pairs with consolidation
 * Consolidates:
 * - URL, username, description, reasoning into a single row
 * - Followers & number of posts as "Metrics"
 * - Phone, website, physical address as "Contacts"
 * - All other data as "Other Info"
 */
export const getSelectedSocialMediaData = (
  data: any
): WebsiteAnalysisKeyValue[] => {
  if (!data) return [];
  const result: WebsiteAnalysisKeyValue[] = [];

  // 1. Consolidate URL, username, description, reasoning
  const url = extractValue(data, [
    ["url"],
    ["site_data", "facebook", "url"],
    ["site_data", "social_media", "profile_url"],
    ["site_data", "social_media", "url"],
    ["site_data", "linkedin", "url"],
    ["site_data", "youtube", "url"],
  ]);

  const username = extractValue(data, [
    ["site_data", "social_media", "username"],
    ["username"],
  ]);

  const description = extractValue(data, [
    ["description"],
    ["site_data", "facebook", "about_merchant"],
    ["site_data", "facebook", "detailed_about_merchant"],
    ["site_data", "social_media", "about_merchant"],
    ["site_data", "linkedin", "about_merchant"],
  ]);

  // Note: intentionally not including 'aligned_with_lob' reasoning here
  // per request — remove the "Aligned with LOB" row from platform cards.
  const infoParts: string[] = [];
  if (url) infoParts.push(`URL: ${url}`);
  if (username) infoParts.push(`Username: ${username}`);
  if (description) infoParts.push(`Description: ${description}`);

  if (infoParts.length > 0) {
    result.push({
      field: "Information",
      value: infoParts.join("\n\n"),
      keyIcon: "Info",
      keyIconColor: "blue",
      valueSentiment: "info",
    });
  }

  // 2. Consolidate Metrics: Followers, number of posts, number of reels, total videos or reels,
  //    number of employees, app rating, number of downloads, number of subscribers
  const followers = extractValue(data, [
    ["site_data", "facebook", "followers"],
    ["site_data", "social_media", "followers"],
    ["site_data", "linkedin", "followers"],
    ["site_data", "youtube", "followers"],
  ]);

  const numberOfPosts = extractValue(data, [
    ["site_data", "facebook", "number_of_posts"],
    ["site_data", "social_media", "number_of_posts"],
    ["site_data", "linkedin", "number_of_posts"],
    ["site_data", "youtube", "number_of_posts"],
    ["site_data", "social_media", "postsCount"],
    ["site_data", "instagram", "postsCount"],
    ["raw_apify", "postsCount"],
    ["raw_amplify", "postsCount"],
    ["postsCount"],
  ]);

  const numberOfReels = extractValue(data, [
    ["site_data", "social_media", "number_of_reels"],
    ["site_data", "instagram", "number_of_reels"],
  ]);

  const totalVideosOrReels = extractValue(data, [
    ["site_data", "social_media", "total_videos_or_reels"],
    ["site_data", "youtube", "total_videos_or_reels"],
  ]);

  const numberOfEmployees = extractValue(data, [
    ["site_data", "linkedin", "number_of_employees"],
    ["site_data", "social_media", "number_of_employees"],
  ]);

  const appRating = extractValue(data, [
    ["site_data", "play_store_url", "app_rating"],
    ["site_data", "app_rating"],
    ["site_data", "apps", "app_rating"],
    ["site_data", "social_media", "app_rating"],
  ]);

  const numberOfDownloads = extractValue(data, [
    ["site_data", "play_store_url", "number_of_downloads"],
    ["site_data", "number_of_downloads"],
    ["site_data", "apps", "number_of_downloads"],
    ["site_data", "social_media", "number_of_downloads"],
  ]);

  const numberOfSubscribers = extractValue(data, [
    ["site_data", "social_media", "number_of_subscribers"],
    ["site_data", "youtube", "number_of_subscribers"],
    ["site_data", "number_of_subscribers"],
  ]);

  const metrics: string[] = [];
  if (followers) metrics.push(`Followers: ${followers}`);
  if (numberOfPosts) metrics.push(`Posts: ${numberOfPosts}`);
  if (numberOfReels) metrics.push(`Number of Reels: ${numberOfReels}`);
  if (totalVideosOrReels)
    metrics.push(`Total Videos or Reels: ${totalVideosOrReels}`);
  if (numberOfSubscribers)
    metrics.push(`Number of Subscribers: ${numberOfSubscribers}`);
  if (numberOfEmployees)
    metrics.push(`Number of Employees: ${numberOfEmployees}`);
  if (appRating) metrics.push(`App Rating: ${appRating}`);
  if (numberOfDownloads)
    metrics.push(`Number of Downloads: ${numberOfDownloads}`);

  if (metrics.length > 0) {
    result.push({
      field: "Metrics",
      value: metrics.join("\n"),
      keyIcon: "BarChart3",
      keyIconColor: "blue",
      valueSentiment: "info",
    });
  }

  // 3. Consolidate Phone, website, physical address as Contacts
  const phone = extractValue(data, [
    ["site_data", "facebook", "address_or_contact", "mobile"],
    ["site_data", "facebook", "address_or_contact", "phone"],
    ["site_data", "social_media", "contact_info", "phone"],
    ["site_data", "linkedin", "address_or_contact", "phone"],
    ["site_data", "linkedin", "address_or_contact", "mobile"],
  ]);

  const website = extractValue(data, [
    ["site_data", "social_media", "contact_info", "website"],
    ["site_data", "linkedin", "address_or_contact", "website"],
  ]);

  const address = extractValue(data, [
    ["site_data", "facebook", "address_or_contact", "address"],
    ["site_data", "social_media", "contact_info", "physical_address"],
    ["site_data", "linkedin", "address_or_contact", "address"],
  ]);

  const contacts: string[] = [];
  if (phone) contacts.push(`Phone: ${phone}`);
  if (website) contacts.push(`Website: ${website}`);
  if (address) contacts.push(`Address: ${address}`);

  if (contacts.length > 0) {
    result.push({
      field: "Contacts",
      value: contacts.join("\n"),
      keyIcon: "Phone",
      keyIconColor: "blue",
      valueSentiment: "info",
    });
  }

  // 4. All other data as "Other Info"
  // Track values that have already been used in consolidated rows to avoid duplicates
  const usedValues = new Set<string>();

  // Add all extracted values to the used set (normalized for comparison)
  [
    url,
    username,
    description,
    followers,
    numberOfPosts,
    numberOfReels,
    totalVideosOrReels,
    numberOfSubscribers,
    numberOfEmployees,
    appRating,
    numberOfDownloads,
    phone,
    website,
    address,
  ].forEach((value) => {
    if (value) {
      usedValues.add(value.toLowerCase().trim());
    }
  });

  // Track field paths that have been consolidated
  const excludedTopLevelFields = new Set([
    "url",
    "description",
    "aligned_with_lob",
    "username",
  ]);

  // Fields that have been consolidated (as path patterns)
  const consolidatedFieldPatterns = [
    // Information fields - top level
    /^url$/,
    /^description$/,
    /^aligned_with_lob/,
    /^username$/,
    // Information fields - nested in site_data
    /^site_data\.(facebook|social_media|linkedin|youtube)\.(url|about_merchant|detailed_about_merchant|profile_url)/,
    /^site_data\.social_media\.username/,
    /^site_data\.social_media\[0\]\.(url|profile_url|about_merchant|username)/,
    // Metrics fields
    /^site_data\.(facebook|social_media|linkedin|youtube|instagram)\.(followers|number_of_posts|number_of_reels|total_videos_or_reels|number_of_subscribers|number_of_employees)/,
    /^site_data\.social_media\[0\]\.(followers|number_of_posts|number_of_reels|total_videos_or_reels|number_of_subscribers|number_of_employees)/,
    /^site_data\.(play_store_url|apps)\.(app_rating|number_of_downloads)/,
    /^site_data\.(app_rating|number_of_downloads|number_of_subscribers)/,
    // Contacts fields
    /^site_data\.(facebook|social_media|linkedin)\.(address_or_contact|contact_info)/,
    /^site_data\.social_media\[0\]\.(address_or_contact|contact_info)/,
    /^site_data\.(facebook|social_media|linkedin)\.(address_or_contact|contact_info)\..*/,
    /^site_data\.social_media\[0\]\.(address_or_contact|contact_info)\..*/,
  ];

  // Helper to check if a field path should be excluded
  const shouldExcludeField = (fieldPath: string): boolean => {
    // Check top-level excluded fields
    if (excludedTopLevelFields.has(fieldPath)) return true;

    // Check if field path matches any consolidated pattern
    for (const pattern of consolidatedFieldPatterns) {
      if (pattern.test(fieldPath)) {
        return true;
      }
    }

    // Also check if path contains any of the consolidated field names at any level
    const consolidatedFieldNames = [
      "url",
      "description",
      "aligned_with_lob",
      "username",
      "followers",
      "number_of_posts",
      "number_of_reels",
      "total_videos_or_reels",
      "number_of_subscribers",
      "number_of_employees",
      "app_rating",
      "number_of_downloads",
      "address_or_contact",
      "contact_info",
      "phone",
      "mobile",
      "website",
      "address",
      "physical_address",
    ];

    // Check if the field path contains any consolidated field name
    // but only if it's in a context we've already consolidated
    const lowerPath = fieldPath.toLowerCase();
    if (
      lowerPath.includes("site_data") &&
      (lowerPath.includes("facebook") ||
        lowerPath.includes("social_media") ||
        lowerPath.includes("linkedin") ||
        lowerPath.includes("youtube"))
    ) {
      for (const fieldName of consolidatedFieldNames) {
        if (lowerPath.includes(fieldName)) {
          // Make sure it's not a different context (e.g., profile_logo_features should not be excluded)
          if (
            !lowerPath.includes("profile_logo") &&
            !lowerPath.includes("logo") &&
            !lowerPath.includes("features")
          ) {
            return true;
          }
        }
      }
    }

    return false;
  };

  // Helper to check if a value has already been used
  const isValueAlreadyUsed = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    const valueStr = String(value).toLowerCase().trim();
    return usedValues.has(valueStr);
  };

  // Transform remaining fields into "Other Info"
  const otherInfoParts: string[] = [];

  const collectOtherInfo = (
    obj: any,
    prefix: string = "",
    depth: number = 0
  ): void => {
    if (depth > 5) return; // Prevent infinite recursion

    if (obj === null || obj === undefined) return;

    if (typeof obj === "object" && !Array.isArray(obj)) {
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const fieldName = prefix ? `${prefix}.${key}` : key;

        // Skip fields we've already consolidated
        if (shouldExcludeField(fieldName)) {
          return;
        }

        // If this is a nested object that might contain consolidated data, check more carefully
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          // Check if this object is entirely a consolidated object (like address_or_contact or contact_info)
          const isConsolidatedObject =
            key === "address_or_contact" ||
            key === "contact_info" ||
            key === "aligned_with_lob";

          if (isConsolidatedObject && prefix.includes("site_data")) {
            // Skip this entire object as it's been consolidated
            return;
          }

          collectOtherInfo(value, fieldName, depth + 1);
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            if (typeof value[0] === "object") {
              collectOtherInfo(value[0], `${fieldName}[0]`, depth + 1);
            } else {
              // Filter out values that have already been used
              const uniqueValues = value
                .map(String)
                .filter((v) => !isValueAlreadyUsed(v));
              if (uniqueValues.length > 0) {
                const formattedField = formatFieldName(fieldName, true);
                otherInfoParts.push(
                  `${formattedField}: ${uniqueValues.join(", ")}`
                );
              }
            }
          }
        } else {
          // Skip if this value has already been used in consolidated rows
          if (!isValueAlreadyUsed(value)) {
            const formattedField = formatFieldName(fieldName, true);
            otherInfoParts.push(
              `${formattedField}: ${
                value === null || value === undefined ? "N/A" : String(value)
              }`
            );
          }
        }
      });
    }
  };

  // Collect other info, starting from top level but skipping consolidated fields
  Object.keys(data).forEach((key) => {
    if (!excludedTopLevelFields.has(key) && key !== "site_data") {
      const value = data[key];
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        collectOtherInfo(value, key);
      } else if (!Array.isArray(value)) {
        // Skip if this value has already been used
        if (!isValueAlreadyUsed(value)) {
          const formattedField = formatFieldName(key, true);
          otherInfoParts.push(
            `${formattedField}: ${
              value === null || value === undefined ? "N/A" : String(value)
            }`
          );
        }
      }
    }
  });

  // Also collect from site_data, but skip consolidated paths
  if (data.site_data) {
    collectOtherInfo(data.site_data, "site_data");
  }

  if (otherInfoParts.length > 0) {
    result.push({
      field: "Other Info",
      value: otherInfoParts.join("\n"),
      keyIcon: "Info",
      keyIconColor: "gray",
      valueSentiment: "info",
    });
  }

  return result;
};
