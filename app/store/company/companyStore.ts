import { create } from 'zustand';
import { 
  fetchIpoCompanies, 
  fetchCompanyAbout, 
  fetchCompanyIndustry, 
  fetchCompanyListings,
  fetchOfferingDetails,
  fetchCompanyOfferingDetails,
  fetchPeerComparison,
  fetchManagementPromoters,
  ManagementPromotersResponse,
  ListingDetails,
  ListingsResponse,
  OfferingDetailsResponse,
  CompanyOfferingDetailsResponse,
  PeerComparisonResponse,
  fetchOfferDocumentReview,
  OfferDocumentReviewResponse,
  OfferDocumentReviewItem,
  fetchComplianceDetails,
  ComplianceDetailsResponse,
  fetchCapitalStructure,
  CapitalStructureResponse
} from '@/app/services/ipoServices';

interface Company {
  id: string;
  legal_name: string;
  cin: string;
}

interface CompanyDetails {
  company_id: string;
  legal_name: string;
  about_company: string;
  about_company_external?: string;
  about_company_external_sources?: string[];
  description: string;
  website: string;
  email: string;
  contact_email: string;
  contact_phone: string;
  registered_address: {
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  business_address: {
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
}

interface IndustryDetails {
  company_id: string;
  legal_name: string;
  about_industry: string;
  about_industry_external?: string;
  about_industry_external_sources?: string[];
  classification: string;
}

interface CompanyStore {
  companies: Company[];
  totalCompanies: number;
  isLoading: boolean;
  selectedCompanyId: string | null;
  selectedCompanyDetails: CompanyDetails | null;
  selectedIndustryDetails: IndustryDetails | null;
  selectedListingsDetails: ListingsResponse | null;
  selectedOfferingDetails: OfferingDetailsResponse | null;
  selectedCompanyOfferingDetails: CompanyOfferingDetailsResponse | null;
  selectedPeerComparison: PeerComparisonResponse | null;
  selectedManagementPromoters: ManagementPromotersResponse | null;
  selectedOfferDocumentReview: OfferDocumentReviewResponse | null;
  selectedComplianceDetails: ComplianceDetailsResponse | null;
  selectedCapitalStructure: CapitalStructureResponse | null;
  fetchCompanies: (skip?: number, limit?: number) => Promise<void>;
  fetchCompanyDetails: (companyId: string) => Promise<void>;
  fetchIndustryDetails: (companyId: string) => Promise<void>;
  fetchListingsDetails: (companyId: string) => Promise<void>;
  fetchOfferingDetails: (listingId: string) => Promise<void>;
  fetchCompanyOfferingDetails: (companyId: string, listingId: string) => Promise<void>;
  fetchPeerComparison: (companyId: string, listingId: string) => Promise<void>;
  fetchManagementPromoters: (companyId: string, listingId: string) => Promise<void>;
  fetchOfferDocumentReview: (companyId: string, listingId: string) => Promise<void>;
  fetchComplianceDetails: (companyId: string, listingId: string) => Promise<void>;
  fetchCapitalStructure: (companyId: string, listingId: string) => Promise<void>;
  setSelectedCompanyId: (id: string) => void;
  getSelectedCompany: () => { id: string; legalName: string } | undefined;
}

export const useCompanyStore = create<CompanyStore>((set, get) => ({
  companies: [],
  totalCompanies: 0,
  isLoading: false,
  selectedCompanyId: null,
  selectedCompanyDetails: null,
  selectedIndustryDetails: null,
  selectedListingsDetails: null,
  selectedOfferingDetails: null,
  selectedCompanyOfferingDetails: null,
  selectedPeerComparison: null,
  selectedManagementPromoters: null,
  selectedOfferDocumentReview: null,
  selectedComplianceDetails: null,
  selectedCapitalStructure: null,

  fetchCompanies: async (skip = 0, limit = 100) => {
    try {
      set({ isLoading: true });
      // Commented out due to 404 error with IPO companies API
      // const data = await fetchIpoCompanies(skip, limit);
      
      set({ 
        companies: [], // Empty array instead of data.companies
        totalCompanies: 0, // Zero instead of data.total
        isLoading: false
      });
    } catch (error) {
      console.error('Error in fetchCompanies:', error);
      set({ isLoading: false });
    }
  },

  fetchCompanyDetails: async (companyId: string) => {
    try {
      set({ isLoading: true });
      const details = await fetchCompanyAbout(companyId);
      
      if (details) {
        set({ selectedCompanyDetails: details });
      }
      set({ isLoading: false });
    } catch (error) {
      console.error('Error in fetchCompanyDetails:', error);
      set({ isLoading: false });
    }
  },

  fetchIndustryDetails: async (companyId: string) => {
    try {
      set({ isLoading: true });
      const details = await fetchCompanyIndustry(companyId);
      
      if (details) {
        set({ selectedIndustryDetails: details });
      }
      set({ isLoading: false });
    } catch (error) {
      console.error('Error in fetchIndustryDetails:', error);
      set({ isLoading: false });
    }
  },

  fetchListingsDetails: async (companyId: string) => {
    try {
      set({ isLoading: true });
      const details = await fetchCompanyListings(companyId);
      
      if (details) {
        set({ selectedListingsDetails: details });
      }
      set({ isLoading: false });
    } catch (error) {
      console.error('Error in fetchListingsDetails:', error);
      set({ isLoading: false });
    }
  },

  fetchOfferingDetails: async (listingId: string) => {
    try {
      set({ isLoading: true });
      const details = await fetchOfferingDetails(listingId);
      
      if (details) {
        set({ selectedOfferingDetails: details });
      }
      set({ isLoading: false });
    } catch (error) {
      console.error('Error in fetchOfferingDetails:', error);
      set({ isLoading: false });
    }
  },

  fetchCompanyOfferingDetails: async (companyId: string, listingId: string) => {
    try {
      set({ isLoading: true });
      const details = await fetchCompanyOfferingDetails(companyId, listingId);
      
      if (details) {
        set({ selectedCompanyOfferingDetails: details });
      }
      set({ isLoading: false });
    } catch (error) {
      console.error('Error in fetchCompanyOfferingDetails:', error);
      set({ isLoading: false });
    }
  },

  fetchPeerComparison: async (companyId: string, listingId: string) => {
    try {
      set({ isLoading: true });
      const data = await fetchPeerComparison(companyId, listingId);
      
      if (data) {
        set({ selectedPeerComparison: data });
      }
      set({ isLoading: false });
    } catch (error) {
      console.error('Error in fetchPeerComparison:', error);
      set({ isLoading: false });
    }
  },

  fetchManagementPromoters: async (companyId: string, listingId: string) => {
    try {
      console.log(`Store: Starting fetchManagementPromoters for company ${companyId}, listing ${listingId}`);
      set({ isLoading: true, selectedManagementPromoters: null });
      
      const details = await fetchManagementPromoters(companyId, listingId);
      console.log('Store: fetchManagementPromoters API result:', details);
      
      if (details) {
        console.log('Store: Setting selectedManagementPromoters with data:', details);
        set({ selectedManagementPromoters: details });
      } else {
        console.log('Store: No data received from API, keeping selectedManagementPromoters as null');
      }
      
      set({ isLoading: false });
      console.log('Store: fetchManagementPromoters completed');
    } catch (error) {
      console.error('Error in fetchManagementPromoters:', error);
      set({ isLoading: false });
    }
  },

  fetchOfferDocumentReview: async (companyId: string, listingId: string) => {
    try {
      set({ isLoading: true });
      const details = await fetchOfferDocumentReview(companyId, listingId);
      
      if (details) {
        set({ 
          selectedOfferDocumentReview: details,
          isLoading: false 
        });
      } else {
        set({ 
          selectedOfferDocumentReview: null,
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Error in fetchOfferDocumentReview:', error);
      set({ 
        selectedOfferDocumentReview: null,
        isLoading: false 
      });
    }
  },

  fetchComplianceDetails: async (companyId: string, listingId: string) => {
    try {
      console.log(`Store: Starting fetchComplianceDetails for company ${companyId}, listing ${listingId}`);
      set({ isLoading: true, selectedComplianceDetails: null });
      
      const details = await fetchComplianceDetails(companyId, listingId);
      console.log('Store: fetchComplianceDetails API result:', details);
      
      if (details) {
        console.log('Store: Setting selectedComplianceDetails with data:', details);
        set({ selectedComplianceDetails: details });
      } else {
        console.log('Store: No data received from API, keeping selectedComplianceDetails as null');
      }
      
      set({ isLoading: false });
      console.log('Store: fetchComplianceDetails completed');
    } catch (error) {
      console.error('Error in fetchComplianceDetails:', error);
      set({ isLoading: false });
    }
  },

  fetchCapitalStructure: async (companyId: string, listingId: string) => {
    try {
      console.log(`Store: Starting fetchCapitalStructure for company ${companyId}, listing ${listingId}`);
      set({ isLoading: true, selectedCapitalStructure: null });
      
      const details = await fetchCapitalStructure(companyId, listingId);
      console.log('Store: fetchCapitalStructure API result:', details);
      
      if (details) {
        console.log('Store: Setting selectedCapitalStructure with data:', details);
        set({ selectedCapitalStructure: details });
      } else {
        console.log('Store: No data received from API, keeping selectedCapitalStructure as null');
      }
      
      set({ isLoading: false });
      console.log('Store: fetchCapitalStructure completed');
    } catch (error) {
      console.error('Error in fetchCapitalStructure:', error);
      set({ isLoading: false });
    }
  },

  setSelectedCompanyId: (id: string) => {
    set({ selectedCompanyId: id });
    const { 
      fetchCompanyDetails, 
      fetchIndustryDetails, 
      fetchListingsDetails,
      fetchOfferDocumentReview,
      fetchComplianceDetails,
      fetchCapitalStructure
    } = get();
    
    fetchCompanyDetails(id);
    fetchIndustryDetails(id);
    
    fetchListingsDetails(id).then(() => {
      const { selectedListingsDetails } = get();
      if (selectedListingsDetails?.listings?.[0]?.id) {
        fetchOfferDocumentReview(id, selectedListingsDetails.listings[0].id);
        fetchComplianceDetails(id, selectedListingsDetails.listings[0].id);
        fetchCapitalStructure(id, selectedListingsDetails.listings[0].id);
      }
    });
  },

  getSelectedCompany: () => {
    const { selectedCompanyId, companies } = get();
    if (!selectedCompanyId) return undefined;
    
    const company = companies.find(c => c.id === selectedCompanyId);
    return company ? { id: company.id, legalName: company.legal_name } : undefined;
  }
}));