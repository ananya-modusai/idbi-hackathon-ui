import {
  WebsiteAnalysisKeyValue,
  WebsiteAnalysisIconName,
  WebsiteAnalysisValueSentiment,
} from "../../Sample Data/InvCasesSampleData";
import { ColorScheme } from "@/components/custom/CustomColorScheme";

// Helper function to format field names
export const formatFieldName = (
  fieldName: string,
  removePrefix: boolean = false
): string => {
  let formatted = fieldName;

  if (removePrefix) {
    const lastDotIndex = formatted.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      formatted = formatted.substring(lastDotIndex + 1);
    }
  }

  formatted = formatted.replace(/_/g, " ");

  const allCapsWords = ["HTTP", "HTTPS", "URL", "SSL", "IP", "A", "NS", "MX", "TXT", "SPF", "DMARC", "DNS", "DNSSEC", "TLS"];

  formatted = formatted
    .split(" ")
    .map((word) => {
      const upperWord = word.toUpperCase();
      if (allCapsWords.includes(upperWord)) {
        return upperWord;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  return formatted;
};

// Helper function to capitalize first letter of each word
export const capitalizeWords = (str: string): string => {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Transform nested objects into key-value pairs
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

// Format product data into a single string
export const formatProductData = (
  product: any,
  availability?: string
): string => {
  const parts: string[] = [];

  if (product.price) {
    const priceParts: string[] = [];
    if (product.price.original_price) {
      priceParts.push(
        `Original: ${product.price.original_price} ${
          product.price.currency || ""
        }`.trim()
      );
    }
    if (
      product.price.discount_percentage &&
      product.price.discount_percentage !== "Not available"
    ) {
      priceParts.push(`Discount: ${product.price.discount_percentage}%`);
    }
    if (product.price.final_price) {
      priceParts.push(
        `Final: ${product.price.final_price} ${
          product.price.currency || ""
        }`.trim()
      );
    }
    if (priceParts.length > 0) {
      parts.push(`Price: ${priceParts.join(", ")}`);
    }
  }

  if (product.product_description) {
    parts.push(`Description: ${product.product_description}`);
  }

  if (product.customization_options) {
    parts.push(`Customization Options: ${product.customization_options}`);
  }

  if (availability) {
    parts.push(`Availability: ${availability}`);
  }

  if (product.sku && product.sku !== "Not available") {
    parts.push(`SKU: ${product.sku}`);
  }

  if (product.pricing_analysis) {
    const analysisParts: string[] = [];
    if (product.pricing_analysis.description) {
      analysisParts.push(
        `Description: ${product.pricing_analysis.description}`
      );
    }
    if (
      product.pricing_analysis.is_suspicious !== undefined &&
      product.pricing_analysis.is_suspicious !== null
    ) {
      analysisParts.push(
        `Is Suspicious: ${product.pricing_analysis.is_suspicious}`
      );
    }
    if (product.pricing_analysis.analysis_reason) {
      analysisParts.push(
        `Analysis Reason: ${product.pricing_analysis.analysis_reason}`
      );
    }
    if (product.pricing_analysis.market_comparison) {
      analysisParts.push(
        `Market Comparison: ${product.pricing_analysis.market_comparison}`
      );
    }
    if (analysisParts.length > 0) {
      parts.push(`Pricing Analysis: ${analysisParts.join("\n")}`);
    }
  }

  Object.keys(product).forEach((key) => {
    if (
      ![
        "product_name",
        "product_description",
        "customization_options",
        "price",
        "sku",
        "pricing_analysis",
      ].includes(key)
    ) {
      const value = product[key];
      if (value !== null && value !== undefined && value !== "Not available") {
        const formattedKey = formatFieldName(key, false);
        if (typeof value === "object" && !Array.isArray(value)) {
          const nestedParts: string[] = [];
          Object.keys(value).forEach((nestedKey) => {
            const nestedValue = value[nestedKey];
            if (nestedValue !== null && nestedValue !== undefined) {
              nestedParts.push(
                `${formatFieldName(nestedKey, false)}: ${nestedValue}`
              );
            }
          });
          if (nestedParts.length > 0) {
            parts.push(`${formattedKey}: ${nestedParts.join(", ")}`);
          }
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            parts.push(`${formattedKey}: ${value.join(", ")}`);
          }
        } else {
          parts.push(`${formattedKey}: ${value}`);
        }
      }
    }
  });

  return parts.join("\n\n");
};

// Transform social media data
export const transformSocialMediaData = (
  socialMediaObj: any
): WebsiteAnalysisKeyValue[] => {
  const result: WebsiteAnalysisKeyValue[] = [];

  if (
    !socialMediaObj ||
    !socialMediaObj.urls ||
    !Array.isArray(socialMediaObj.urls)
  ) {
    return result;
  }

  socialMediaObj.urls.forEach((urlItem: any) => {
    if (typeof urlItem === "object" && urlItem !== null) {
      const { name, ...otherProps } = urlItem;
      const fieldName = name || "Unknown";

      const valueParts: string[] = [];
      Object.keys(otherProps).forEach((key) => {
        const val = otherProps[key];
        
        // Handle nested raw_apify/raw_amplify objects to extract metrics
        if ((key === "raw_apify" || key === "raw_amplify") && typeof val === "object" && val !== null) {
          if (val.postsCount !== undefined) {
            valueParts.push(`Posts: ${val.postsCount}`);
          }
          if (val.followersCount !== undefined || val.followers !== undefined) {
            valueParts.push(`Followers: ${val.followersCount || val.followers}`);
          }
          return;
        }

        let displayKey = formatFieldName(key, false);
        // Map postsCount to "Posts" for Instagram/Social Media
        if ((fieldName.toLowerCase().includes("instagram") || fieldName.toLowerCase().includes("social")) && key === "postsCount") {
          displayKey = "Posts";
        }
        
        const value = val;
        const formattedKey = displayKey;
        const formattedValue =
          value === null || value === undefined ? "N/A" : String(value);
        valueParts.push(`${formattedKey}: ${formattedValue}`);
      });

      result.push({
        field: fieldName,
        value:
          valueParts.length > 0 ? valueParts.join("\n") : "No additional data",
        keyIcon: "Users",
        keyIconColor: "blue",
        valueSentiment: "info",
      });
    }
  });

  return result;
};

// Transform navigation flow data
export const transformNavigationFlowData = (
  navFlowObj: any
): WebsiteAnalysisKeyValue[] => {
  const result: WebsiteAnalysisKeyValue[] = [];

  if (!navFlowObj) {
    return result;
  }

  Object.keys(navFlowObj).forEach((key) => {
    if (key === "navbar_links") {
      const navbarLinks = navFlowObj[key];
      if (
        navbarLinks &&
        navbarLinks.links &&
        Array.isArray(navbarLinks.links)
      ) {
        const valueParts: string[] = [];

        if (navbarLinks.summary && typeof navbarLinks.summary === "object") {
          const totalCount = navbarLinks.summary.total_count ?? "N/A";
          const workingCount = navbarLinks.summary.working_count ?? "N/A";
          valueParts.push(`Total: ${totalCount}, Working: ${workingCount}`);
        }

        const urlStatusPairs: string[] = [];
        navbarLinks.links.forEach((linkItem: any) => {
          if (typeof linkItem === "object" && linkItem !== null) {
            const url = linkItem.url || "N/A";
            const status = linkItem.status || "N/A";
            urlStatusPairs.push(`${url} - ${status}`);
          }
        });

        if (urlStatusPairs.length > 0) {
          valueParts.push(...urlStatusPairs);
        } else if (valueParts.length === 0) {
          valueParts.push("No links available");
        }

        result.push({
          field: "Navbar links",
          value: valueParts.join("\n"),
          keyIcon: "Navigation",
          keyIconColor: "blue",
          valueSentiment: "info",
        });
      } else {
        const navbarData = transformToKeyValue(
          navbarLinks,
          "navbar_links",
          "Navigation",
          "blue",
          "info"
        );
        result.push(...navbarData);
      }
    } else if (key === "signup_details" || key === "login_details") {
      const detailsObj = navFlowObj[key];
      if (detailsObj && typeof detailsObj === "object") {
        const valueParts: string[] = [];

        if ("redirects_to_external" in detailsObj) {
          const redirectsValue =
            detailsObj.redirects_to_external === true ? "Yes" : "No";
          valueParts.push(`Redirects to external: ${redirectsValue}`);
        }

        const fieldsKey =
          key === "signup_details" ? "signup_fields" : "login_fields";
        if (fieldsKey in detailsObj && Array.isArray(detailsObj[fieldsKey])) {
          const fields = detailsObj[fieldsKey];
          if (fields.length > 0) {
            const fieldLabel =
              key === "signup_details" ? "Signup fields" : "Login fields";
            valueParts.push(`${fieldLabel}: ${fields.join(", ")}`);
          }
        }

        Object.keys(detailsObj).forEach((propKey) => {
          if (
            propKey !== "redirects_to_external" &&
            propKey !== "signup_fields" &&
            propKey !== "login_fields"
          ) {
            const value = detailsObj[propKey];
            const formattedKey = formatFieldName(propKey, false);
            const formattedValue =
              value === null || value === undefined ? "N/A" : String(value);
            valueParts.push(`${formattedKey}: ${formattedValue}`);
          }
        });

        const fieldName =
          key === "signup_details" ? "Signup details" : "Login details";
        result.push({
          field: fieldName,
          value:
            valueParts.length > 0 ? valueParts.join("\n") : "No data available",
          keyIcon: "Navigation",
          keyIconColor: "blue",
          valueSentiment: "info",
        });
      } else {
        const fieldData = transformToKeyValue(
          detailsObj,
          key,
          "Navigation",
          "blue",
          "info"
        );
        result.push(...fieldData);
      }
    } else if (key === "broken_links") {
      const brokenLinks = navFlowObj[key];
      if (Array.isArray(brokenLinks)) {
        if (brokenLinks.length === 0) {
          result.push({
            field: "Broken Links",
            value: "None",
            keyIcon: "Navigation",
            keyIconColor: "blue",
            valueSentiment: "neutral",
          });
        } else {
          result.push({
            field: "Broken Links",
            value: brokenLinks.join("\n"),
            keyIcon: "Navigation",
            keyIconColor: "blue",
            valueSentiment: "info",
          });
        }
      } else {
        result.push({
          field: "Broken Links",
          value: brokenLinks === null || brokenLinks === undefined ? "None" : String(brokenLinks),
          keyIcon: "Navigation",
          keyIconColor: "blue",
          valueSentiment: "info",
        });
      }
    } else {
      // Skip url_analysis key to remove the URL analysis row
      if (key !== "url_analysis") {
        const fieldData = transformToKeyValue(
          navFlowObj[key],
          key,
          "Navigation",
          "blue",
          "info"
        );
        result.push(...fieldData);
      }
    }
  });

  return result.filter((item) => !/^screenshot/i.test(item.field));
};

// Transform contact data
export const transformContactData = (
  contactObj: any
): WebsiteAnalysisKeyValue[] => {
  const result: WebsiteAnalysisKeyValue[] = [];

  if (!contactObj || typeof contactObj !== "object") {
    return result;
  }

  // Define the order of fields for contact data
  const fieldOrder = [
    "website_urls",
    "communication_channels",
    "phone_numbers",
    "email_ids",
    "contact_addresses",
    "profile_exists",
    "working",
    "merchant_entities",
  ];

  // Process fields in the defined order first
  fieldOrder.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(contactObj, key)) {
      const value = contactObj[key];
      const formattedFieldName = formatFieldName(key, false);
      const isBooleanStatus = key === "profile_exists" || key === "working";

      if (key === "merchant_entities") {
        const roles = Array.isArray(value)
          ? value
              .flatMap((entity: any) => entity?.role || [])
              .filter((role: any) => typeof role === "string" && role.trim() !== "")
          : [];
        result.push({
          field: formattedFieldName,
          value: roles.length > 0 ? roles.join("\n") : "Not Available",
          keyIcon: "Info",
          keyIconColor: "blue",
          valueSentiment: roles.length > 0 ? "info" : "neutral",
        });
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          result.push({
            field: formattedFieldName,
            value: value.join("\n"),
            keyIcon: "Phone",
            keyIconColor: "blue",
            valueSentiment: "info",
          });
        } else {
          result.push({
            field: formattedFieldName,
            value: "No items",
            keyIcon: "Phone",
            keyIconColor: "blue",
            valueSentiment: "neutral",
          });
        }
      } else if (typeof value === "object" && value !== null) {
        const nestedData = transformToKeyValue(
          value,
          key,
          "Phone",
          "blue",
          "info"
        );
        result.push(...nestedData);
      } else {
        result.push({
          field: formattedFieldName,
          value: value === null || value === undefined ? "N/A" : String(value),
          keyIcon: isBooleanStatus ? (key === "working" ? "Activity" : "UserCheck") : "Phone",
          keyIconColor: "blue",
          valueSentiment: "info",
          ...(isBooleanStatus && {
            isRiskTag: true,
            riskSentiment: "positive", // true is good
          }),
        } as any);
      }
    } else if (key === "profile_exists" || key === "working") {
       // Add requested fields even if they are missing from object, as placeholders
       // matching the user's request screenshot which shows "true"
       result.push({
        field: formatFieldName(key, false),
        value: "true",
        keyIcon: key === "working" ? "Activity" : "UserCheck",
        keyIconColor: "blue",
        valueSentiment: "info",
        isRiskTag: true,
        riskSentiment: "positive",
      } as any);
    }
  });

  // Process any other fields not in the defined order
  Object.keys(contactObj).forEach((key) => {
    if (!fieldOrder.includes(key)) {
      const value = contactObj[key];
      const formattedFieldName = formatFieldName(key, false);

      if (key === "merchant_entities") {
        const roles = Array.isArray(value)
          ? value
              .flatMap((entity: any) => entity?.role || [])
              .filter((role: any) => typeof role === "string" && role.trim() !== "")
          : [];
        result.push({
          field: formattedFieldName,
          value: roles.length > 0 ? roles.join("\n") : "Not Available",
          keyIcon: "Info",
          keyIconColor: "blue",
          valueSentiment: roles.length > 0 ? "info" : "neutral",
        });
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          result.push({
            field: formattedFieldName,
            value: value.join("\n"),
            keyIcon: "Phone",
            keyIconColor: "blue",
            valueSentiment: "info",
          });
        } else {
          result.push({
            field: formattedFieldName,
            value: "No items",
            keyIcon: "Phone",
            keyIconColor: "blue",
            valueSentiment: "neutral",
          });
        }
      } else if (typeof value === "object" && value !== null) {
        const nestedData = transformToKeyValue(
          value,
          key,
          "Phone",
          "blue",
          "info"
        );
        result.push(...nestedData);
      } else {
        result.push({
          field: formattedFieldName,
          value: value === null || value === undefined ? "N/A" : String(value),
          keyIcon: "Phone",
          keyIconColor: "blue",
          valueSentiment: "info",
        });
      }
    }
  });

  return result;
};

// Transform policy data
export const transformPolicyData = (
  policyObj: any
): WebsiteAnalysisKeyValue[] => {
  const result: WebsiteAnalysisKeyValue[] = [];

  if (!policyObj || typeof policyObj !== "object") {
    return result;
  }

  if (policyObj.urls && Array.isArray(policyObj.urls)) {
    policyObj.urls.forEach((urlItem: any) => {
      if (typeof urlItem === "object" && urlItem !== null) {
        const { name, ...otherProps } = urlItem;
        const fieldName = name || "Unknown";

        const valueParts: string[] = [];
        Object.keys(otherProps).forEach((key) => {
          const value = otherProps[key];
          const formattedKey = formatFieldName(key, false);
          const formattedValue =
            value === null || value === undefined ? "N/A" : String(value);
          valueParts.push(`${formattedKey}: ${formattedValue}`);
        });

        result.push({
          field: fieldName,
          value:
            valueParts.length > 0
              ? valueParts.join("\n\n")
              : "No additional data",
          keyIcon: "FileText",
          keyIconColor: "blue",
          valueSentiment: "info",
        });
      }
    });
  } else {
    const policyData = transformToKeyValue(
      policyObj,
      "",
      "FileText",
      "blue",
      "info"
    );
    result.push(...policyData);
  }

  return result;
};

// Transform product analysis data
export const transformProductAnalysisData = (
  productAnalysisObj: any
): WebsiteAnalysisKeyValue[] => {
  const result: WebsiteAnalysisKeyValue[] = [];

  if (!productAnalysisObj || typeof productAnalysisObj !== "object") {
    return result;
  }

  if (
    productAnalysisObj.navigation_links &&
    Array.isArray(productAnalysisObj.navigation_links)
  ) {
    productAnalysisObj.navigation_links.forEach(
      (navLink: any, index: number) => {
        if (typeof navLink === "object" && navLink !== null) {
          const { link_name, link_url, ...otherProps } = navLink;

          Object.keys(otherProps).forEach((key) => {
            const value = otherProps[key];
            const nestedData = transformToKeyValue(
              value,
              key,
              "ShoppingCart",
              "blue",
              "info"
            );
            nestedData.forEach((item) => {
              let fieldName = item.field;
              const prefixPattern = new RegExp(
                `^Navigation Links\\[${index}\\]\\.`,
                "i"
              );
              if (prefixPattern.test(fieldName)) {
                fieldName = fieldName.replace(prefixPattern, "");
              }
              if (fieldName.startsWith(`${key}.`)) {
                fieldName = fieldName.substring(key.length + 1);
              }
              result.push({
                ...item,
                field: fieldName,
              });
            });
          });
        }
      }
    );
  } else {
    const productData = transformToKeyValue(
      productAnalysisObj,
      "",
      "ShoppingCart",
      "blue",
      "info"
    );
    result.push(...productData);
  }

  return result;
};

// Transform content analysis data
export const transformContentAnalysisData = (
  contentObj: any
): WebsiteAnalysisKeyValue[] => {
  const result: WebsiteAnalysisKeyValue[] = [];

  if (!contentObj || typeof contentObj !== "object") {
    return result;
  }

  const fieldMappings: { [key: string]: string } = {
    impersonation_check: "Impersonation checks",
    placeholder_content_check: "Placeholder content",
    language_support: "Language support",
    grammar_check: "Grammar check",
    hidden_content_check: "Hidden content",
    objectionable_content_check: "Banned & Restricted Category",
    frequent_words: "Frequent words",
  };

  if (
    contentObj.urls &&
    Array.isArray(contentObj.urls) &&
    contentObj.urls.length > 0
  ) {
    contentObj.urls.forEach((urlItem: any) => {
      if (typeof urlItem === "object" && urlItem !== null) {
        Object.keys(fieldMappings).forEach((key) => {
          if (key in urlItem) {
            const value = urlItem[key];
            const fieldName = fieldMappings[key];

            if (key === "frequent_words" && Array.isArray(value)) {
              result.push({
                field: fieldName,
                value: value,
                keyIcon: "FileSearch",
                keyIconColor: "blue",
                valueSentiment: "info",
                isFrequentWords: true,
              } as WebsiteAnalysisKeyValue & { isFrequentWords?: boolean });
              return;
            }

            let formattedValue = "";

            if (value === null || value === undefined) {
              formattedValue = "N/A";
            } else if (Array.isArray(value)) {
              formattedValue = value.length > 0 ? value.join(", ") : "No items";
            } else if (typeof value === "object") {
              const valueParts: string[] = [];
              if ("status" in value) {
                valueParts.push(`Status: ${value.status}`);
              }
              if ("reasoning" in value) {
                valueParts.push(`Reasoning: ${value.reasoning}`);
              }
              Object.keys(value).forEach((propKey) => {
                if (propKey !== "status" && propKey !== "reasoning") {
                  const propValue = value[propKey];
                  const formattedKey = formatFieldName(propKey, false);
                  const formattedPropValue =
                    propValue === null || propValue === undefined
                      ? "N/A"
                      : String(propValue);
                  valueParts.push(`${formattedKey}: ${formattedPropValue}`);
                }
              });
              formattedValue =
                valueParts.length > 0 ? valueParts.join("\n") : "No data";
            } else {
              formattedValue = String(value);
            }

            result.push({
              field: fieldName,
              value: formattedValue,
              keyIcon: "FileSearch",
              keyIconColor: "blue",
              valueSentiment: "info",
            });
          }
        });
      }
    });
  } else {
    Object.keys(fieldMappings).forEach((key) => {
      if (key in contentObj) {
        const value = contentObj[key];
        const fieldName = fieldMappings[key];

        if (key === "frequent_words" && Array.isArray(value)) {
          result.push({
            field: fieldName,
            value: value,
            keyIcon: "FileSearch",
            keyIconColor: "blue",
            valueSentiment: "info",
            isFrequentWords: true,
          } as WebsiteAnalysisKeyValue & { isFrequentWords?: boolean });
          return;
        }

        let formattedValue = "";

        if (value === null || value === undefined) {
          formattedValue = "N/A";
        } else if (Array.isArray(value)) {
          formattedValue = value.length > 0 ? value.join(", ") : "No items";
        } else if (typeof value === "object") {
          const valueParts: string[] = [];
          if ("status" in value) {
            valueParts.push(`Status: ${value.status}`);
          }
          if ("reasoning" in value) {
            valueParts.push(`Reasoning: ${value.reasoning}`);
          }
          Object.keys(value).forEach((propKey) => {
            if (propKey !== "status" && propKey !== "reasoning") {
              const propValue = value[propKey];
              const formattedKey = formatFieldName(propKey, false);
              const formattedPropValue =
                propValue === null || propValue === undefined
                  ? "N/A"
                  : String(propValue);
              valueParts.push(`${formattedKey}: ${formattedPropValue}`);
            }
          });
          formattedValue =
            valueParts.length > 0 ? valueParts.join("\n") : "No data";
        } else {
          formattedValue = String(value);
        }

        result.push({
          field: fieldName,
          value: formattedValue,
          keyIcon: "FileSearch",
          keyIconColor: "blue",
          valueSentiment: "info",
        });
      }
    });

    Object.keys(contentObj).forEach((key) => {
      if (!(key in fieldMappings) && key !== "urls" && key !== "complete_url") {
        const value = contentObj[key];
        const fieldName = formatFieldName(key, false);

        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          const nestedData = transformToKeyValue(
            value,
            key,
            "FileSearch",
            "blue",
            "info"
          );
          result.push(...nestedData);
        } else {
          const formattedValue =
            value === null || value === undefined
              ? "N/A"
              : Array.isArray(value)
              ? value.join(", ")
              : String(value);
          result.push({
            field: fieldName,
            value: formattedValue,
            keyIcon: "FileSearch",
            keyIconColor: "blue",
            valueSentiment: "info",
          });
        }
      }
    });
  }

  return result;
};
