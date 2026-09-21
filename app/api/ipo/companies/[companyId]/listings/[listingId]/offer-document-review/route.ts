import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * API route to fetch offer document review data for a specific company and listing
 * This is a mock implementation that returns the transformed API response data
 * In a real implementation, this would fetch data from your backend service
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; listingId: string }> }
) {
  try {
    const { companyId, listingId } = await params;
    
    console.log(`Fetching offer document review for company ${companyId}, listing ${listingId}`);

    // Mock API response that matches the new JSON structure with "potentially_inconsistent_information" review type
    const mockResponse = {
      "data": [
        {
            "id": "bc5cc530-d3cb-41d5-a872-725ca5a6ebb0",
            "section_of_offer_document": "Summary of Industry",
            "page_no": "14–15",
            "original_text_excerpt": "\"India's economic outlook remains strong… India is expected to remain the fastest-growing economy...\"",
            "review_content": "No mention of Teja Engineering's actual sector or sub-sector (precision engineering, etc.). Entirely macro-level data irrelevant to the issuer's specific operating industry.",
            "review_type": "additional_information"
        },
        {
            "id": "54e2afa2-4fa0-44e6-9cca-c296c2b71e48",
            "section_of_offer_document": "Risk Factors",
            "page_no": "23, 120",
            "original_text_excerpt": "\"The said limit has been expired on March 08. 2025 as specified terms and condition in the sanction letter dated January 9, 2025, However the company is still utilizing the said limit. As on date aggregating sanction limit of CC limit is 1000.00 Lakh.\"",
            "review_content": "Contradicts \"There have been no instances of rescheduling/ restructuring of borrowings with financial institutions/ banks in respect of our current borrowings from lenders.\"",
            "review_type": "potentially_inconsistent_information"
        },
        {
            "id": "4e993b6c-1607-431a-93ca-2b76882b8183",
            "section_of_offer_document": "Risk Factors",
            "page_no": "21",
            "original_text_excerpt": "\"The pending works order in the name of the proprietorship firm are caried out by the proprietorship firm after 30th June, 2023 as the transfer from Corporates and PSUS is not feasible. The working after 30th June, 2023 though carried out in proprietorship firm is included in the Company's business.\"",
            "review_content": "This statement creates ambiguity regarding revenue recognition. It is unclear how revenue and profits from a separate legal entity (the proprietorship) can be accounted for in the company's financials post the business transfer date. Seek detailed explanation and justification based on accounting standards.",
            "review_type": "clarity_issue"
        },
        {
            "id": "1e524048-d885-432d-b8c4-b9828a13dbd6",
            "section_of_offer_document": "Risk Factors",
            "page_no": "24, 93",
            "original_text_excerpt": "\"We have successfully completed over more than 300 CNG filling station projects of various size and complexities in different states of India. Further, under O&M services, presently we are providing services to more than 450 units on annual basis as on March 31, 2025. For further details of our order on hand, see 'Business Overview' on page no. 93.\"",
            "review_content": "The DRHP touts the number of projects completed and units under maintenance, but does not provide a clear \"Order Book\" or backlog summary with value and timeline. It directs readers to page 93 for \"order on hand\" details, yet there is no explicit table or quantified disclosure of the current order book in the Business Overview section.",
            "review_type": "additional_information"
        },
        {
            "id": "62e3727c-ef9c-4acb-a323-36690de1e989",
            "section_of_offer_document": "Basis For Issue Price",
            "page_no": "71",
            "original_text_excerpt": "\"The profit of the Partnership firm upto June 30, 2023 was included to calculate the EPS for March 31, 2024\"",
            "review_content": "The firm has been incorrectly referred to as a partnership firm. It was formerly a proprietorship firm",
            "review_type": "potentially_inconsistent_information"
        },
        {
            "id": "6f6537a1-e18b-469e-99ee-8f731a634a7b",
            "section_of_offer_document": "Risk Factors",
            "page_no": "33",
            "original_text_excerpt": "\"The Company had made good progress in establishing its name in the readymade garment segment.\"",
            "review_content": "This statement is entirely irrelevant and factually incorrect for Teja Engineering Industries Limited, which operates in the Oil and Gas, Power and Energy Sectors, specializing in Erection & Commissioning, Operation & Maintenance services, and instrument calibration. This indicates a copy-paste error from another DRHP.",
            "review_type": "additional_information"
        },
        {
            "id": "22548c8d-1d73-4173-bb4d-741bcb3c907c",
            "section_of_offer_document": "Risk Factors",
            "page_no": "31",
            "original_text_excerpt": "\"Our Company had negative cash flows from our operating activities, investing activities as well as financing activities in the previous years... [For the period ended on 31st March 2024, Net Cash Generated from Operating Activities was (893.11) Lakhs]\"",
            "review_content": "The company has a history of negative cash flows, particularly a significant negative cash flow from operations in the period ended March 31, 2024. This is a critical indicator of financial health and raises questions about the company's ability to sustain its operations without continuous external financing.",
            "review_type": "additional_information"
        },
        {
            "id": "ca938de4-ca69-47f6-b9d8-7737464e3d60",
            "section_of_offer_document": "Business Overview",
            "page_no": "92",
            "original_text_excerpt": "\"Currently Our company specializes in providing assistance and support services in the Oil and Gas, Power and Energy Sectors... Our major clients are Corporates and PSU engaged in the making and supply of compressor for Gas and oil distribution.\".",
            "review_content": "The DRHP states that major clients are Corporates and PSUs, but it does not provide a disclosure of its top 10 or major customers by revenue. This is crucial for investors to assess client concentration risk, which is especially important when relying on a few large entities.",
            "review_type": "additional_information"
        },
        {
            "id": "c7b1776f-51ab-4498-8f97-45bfd5442779",
            "section_of_offer_document": "Capital Structure",
            "page_no": "76, 149",
            "original_text_excerpt": "\"Our Company has not issued any Equity Shares... during the 18 months preceding the date of this Draft Prospectus, where such issuance is equal to or more than 5% of the fully diluted paid-up share capital of our Company...\". Contradicted by: \"Our Company has issued 2,09,000 Equity Shares on Preferential basis @ Rs. 150/ per shares (including Share Premium Rs. 140 per share)\" on \"December 31, 2024\".",
            "review_content": "While 209,000 shares might technically be just under 5% of the pre-allotment share capital (4,510,300 shares, so ~4.63%). This is a risk as a substantial preferential issue did occur within the 18-month window. The phrasing should be more precise to acknowledge the transaction even if it falls marginally below the 5% threshold, or explicitly state the exact percentage and justification.",
            "review_type": "additional_information"
        },
        {
            "id": "9d48def1-869b-4b1b-bff0-9a381beee2f3",
            "section_of_offer_document": "Financial Information",
            "page_no": "147",
            "original_text_excerpt": "\"The Company has not been following the provisions of Accounting Standard – 15 \\\"Employee Benefits\\\" issued by the Institute of Chartered Accountants of India in respect of recording provision for Gratuity in its Books of Accounts as it is not applicable to our company.\"",
            "review_content": "Given that the company employs \"over 1,700 professionals\", it is highly probable that AS-15 is applicable. Non-provisioning for gratuity would materially understate employee benefit expenses and overstate profits and net worth, creating a misleading financial picture.",
            "review_type": "potentially_inconsistent_information"
        },
        {
            "id": "95ea6e76-1d02-4f41-bcff-3448b40123a3",
            "section_of_offer_document": "Company Information (General)",
            "page_no": "Cover",
            "original_text_excerpt": "\"INITIAL PUBLIC ISSUE OF UPTO 17,00,000 EQUITY SHARES OF FACE VALUE OF 10/- EACH OF HP TELECOM INDIA LIMITED (\"TEIL\" OR THE \"COMPANY\" OR THE \"ISSUER\")\". Also in Management's Discussion and Analysis of Financial Position: \"In this section, unless the context otherwise requires, any reference to \"we\", \"us\" or \"our\" refers to HP Telecom Limited, our Company.\".",
            "review_content": "The company name is Teja Engineering Industries Limited. The repeated mention of \"HP Telecom India Limited\" or \"HP Telecom Limited\" is a significant factual error indicating a templated document that has not been thoroughly reviewed and updated with the correct company's details. This fundamentally misrepresents the issuer.",
            "review_type": "potentially_inconsistent_information"
        },
        {
            "id": "3a379892-560c-453c-b855-2cd68ffd633f",
            "section_of_offer_document": "Industry Overview",
            "page_no": "83, 84, 147",
            "original_text_excerpt": "As the company is dealing in only one segment i.e. Healthcare services hence segment reporting is not applicable.",
            "review_content": "The company's business is clearly described as providing engineering and technical services to the oil and gas sector, not healthcare services. This is a material factual error that misrepresents the company's operations.",
            "review_type": "potentially_inconsistent_information"
        }
      ],
      "labels_map": {
        "id": "ID",
        "section_of_offer_document": "Section of Offer Document",
        "page_no": "Page No.",
        "original_text_excerpt": "Original Text (Excerpt)",
        "review_content": "Review Content",
        "review_type": "Review Type"
      }
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error in offer document review API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch offer document review data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
