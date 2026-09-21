'use client';

import { FC, useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import CustomList, { SortField, SortDirection } from '@/components/custom/CustomList/customList';
import { CustomListItemProps } from '@/components/custom/CustomList/customListItem';
import { SortActionButton } from '@/components/custom/CustomList/SortActionButton';
import { Factory, ChevronRight, PenLine, RotateCcw } from 'lucide-react';

import { getColorClasses, getTextColorClass, ColorScheme, colorSchemes } from '@/components/custom/CustomColorScheme';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { EditIndustryDialog } from './EditIndustryDialog';
import CustomLoader from '@/components/custom/CustomLoader';
import { industryService, Industry } from '@/app/services/industryServices';
import { ActionButton } from '@/components/custom/ActionButton';
import { profileService } from '@/app/services/profileService';
import { useProfileStore } from '@/app/store/authentication/profileStore';

export interface IndustryData {
  id: string;
  name: string;
  riskSegment: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High' | 'Severe';
  merchantCount: number;
  averageDeliveryDays: number;
  lastUpdated: string;
}

export const riskSegmentOptions = [
  { value: 'Very Low', label: 'Very Low' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Very High', label: 'Very High' },
  { value: 'Severe', label: 'Severe' },
];

interface IndustryListItem extends CustomListItemProps {
  originalData: IndustryData;
}

const MerchantIndustriesTab: FC = () => {
  const [industries, setIndustries] = useState<IndustryData[]>([]);
  const [editIndustry, setEditIndustry] = useState<IndustryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Extract fetchIndustries as a reusable function
  const fetchIndustries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await industryService.getAllIndustries();
      const mappedIndustries = response.map(industry => ({
        id: industry.industry_id,
        name: industry.industry_name,
        riskSegment: industry.risk_segment as IndustryData['riskSegment'],
        merchantCount: Number(industry.merchant_count) || 0,
        averageDeliveryDays: Number(industry.industry_add) || 0,
        lastUpdated: (industry.last_updated)?.split('T')[0] || new Date().toISOString().split('T')[0]
      }));
      setIndustries(mappedIndustries);
    } catch (error) {
      console.error('Error fetching industries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user profile to check admin status
  useEffect(() => {
    const fetchProfile = async () => {
      setIsProfileLoading(true);
      try {
        await useProfileStore.getState().fetchProfile();
        const profile = useProfileStore.getState().profile;
        if (profile) {
          setIsAdmin(profile.role === 'ADMIN');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchIndustries();
  }, [fetchIndustries]);

  // Sort state management
  const [currentSortField, setCurrentSortField] = useState<string>('originalData.name');
  const [currentSortDirection, setCurrentSortDirection] = useState<SortDirection>('asc');

  // Handler for sort changes
  const handleSortChange = (fieldKey: string, direction: SortDirection) => {
    setCurrentSortField(fieldKey);
    setCurrentSortDirection(direction);
  };

  // Helper function to get color scheme for risk segment (consistent with ProbabilityOfDefault.tsx)
  const getRiskColorScheme = (riskSegment: IndustryData['riskSegment']): ColorScheme => {
    switch (riskSegment) {
      case 'Very Low': return 'green';
      case 'Low': return 'blue';
      case 'Medium': return 'yellow';
      case 'High': return 'orange';
      case 'Very High': return 'red';
      case 'Severe': return 'gray'; // Consistent with ProbabilityOfDefault.tsx which doesn't handle 'Severe'
      default: return 'gray';
    }
  };

  // Define sort fields for the industries
  const sortFields = useMemo<SortField[]>(() => [
    {
      key: 'originalData.name',
      label: 'Industry Name',
      sortFunction: (a, b) => {
        const aData = (a as IndustryListItem).originalData;
        const bData = (b as IndustryListItem).originalData;
        return aData.name.localeCompare(bData.name);
      }
    },
    {
      key: 'originalData.riskSegment',
      label: 'Risk Segment',
      sortFunction: (a, b) => {
        const aData = (a as IndustryListItem).originalData;
        const bData = (b as IndustryListItem).originalData;
        const riskOrder = { 'Severe': 0, 'Very High': 1, 'High': 2, 'Medium': 3, 'Low': 4, 'Very Low': 5 };
        return riskOrder[aData.riskSegment] - riskOrder[bData.riskSegment];
      }
    },
    {
      key: 'originalData.averageDeliveryDays',
      label: 'Average Delivery Days',
      sortFunction: (a, b) => {
        const aData = (a as IndustryListItem).originalData;
        const bData = (b as IndustryListItem).originalData;
        return aData.averageDeliveryDays - bData.averageDeliveryDays;
      }
    },
    {
      key: 'originalData.merchantCount',
      label: 'Merchant Count',
      sortFunction: (a, b) => {
        const aData = (a as IndustryListItem).originalData;
        const bData = (b as IndustryListItem).originalData;
        return (bData.merchantCount || 0) - (aData.merchantCount || 0); // Descending order
      }
    },
    {
      key: 'originalData.lastUpdated',
      label: 'Last Updated',
      sortFunction: (a, b) => {
        const aData = (a as IndustryListItem).originalData;
        const bData = (b as IndustryListItem).originalData;
        const aDate = aData.lastUpdated ? new Date(aData.lastUpdated).getTime() : 0;
        const bDate = bData.lastUpdated ? new Date(bData.lastUpdated).getTime() : 0;
        return bDate - aDate; // Most recent first
      }
    }
  ], []);

  // Helper function to create industry item UI from data
  const createIndustryItem = useCallback((data: IndustryData): IndustryListItem => {
    const riskColorScheme = getRiskColorScheme(data.riskSegment);
    
    return {
      itemID: data.id,
      title: (
        <div className="flex items-center gap-2">
          <BubbleTag
             text={`${data.merchantCount || "0"} Merchants`}
             color="grayTextWhiteBg"
             withBorder={true}
             fixedWidth={100}
           />
          <span className={`text-base font-semibold ${getTextColorClass(riskColorScheme)}`}>
            {data.name}
          </span>
          
        </div>
      ),
      subtitle: undefined,
      mainContent: undefined,
      bottomLeftContent: undefined,
      bottomRightContent: undefined,
      topRightContent: (
        <div className="flex items-center gap-2">
          <BubbleTag
            text={`${data.averageDeliveryDays}d ADD`}
            color="yellowTextWhiteBg"
            withBorder={true}
            fixedWidth={80}
          />
          <BubbleTag
            text={data.riskSegment}
            color={riskColorScheme}
            fixedWidth={80}
          />
          <div
            onClick={(e) => {
              e.stopPropagation();
              setEditIndustry(data);
            }}
            className="cursor-pointer"
          >
            <BubbleTag
              text="Edit"
              color="blueTextWhiteBg"
              hasInsideIcon={true}
              icon={<PenLine className="h-3.5 w-3.5" />}
              onHover={true}
              withBorder={true}
              fixedWidth={80}
            />
          </div>
        </div>
      ),
      rightMainIcon: ChevronRight,
      originalData: data,
      themeColor: getColorClasses(riskColorScheme)
    };
  }, []);

  // Create industry list items with dynamic sorting
  const industryItems: IndustryListItem[] = useMemo(() => {
    const items = industries.map(createIndustryItem);

    // Apply sorting based on current sort field and direction
    if (currentSortField) {
      const sortField = sortFields.find(f => f.key === currentSortField);
      if (sortField && sortField.sortFunction) {
        items.sort((a, b) => {
          const result = sortField.sortFunction!(a, b);
          return currentSortDirection === 'desc' ? -result : result;
        });
      }
    }

    return items;
  }, [industries, createIndustryItem, currentSortField, currentSortDirection, sortFields]);

  // Filter functions
  const riskFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    if (selectedValues.length === 0) return true;
    const industryItem = item as IndustryListItem;
    return selectedValues.includes(industryItem.originalData.riskSegment);
  };

  const addFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    if (selectedValues.length === 0) return true;
    const industryItem = item as IndustryListItem;
    const days = industryItem.originalData.averageDeliveryDays;
    
    return selectedValues.some(range => {
      switch (range) {
        case '0-3': return days >= 0 && days <= 3;
        case '4-15': return days >= 4 && days <= 15;
        case '15+': return days > 15;
        default: return false;
      }
    });
  };

  const searchFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    const query = selectedValues[0] || '';
    if (!query.trim()) return true;
    
    const industryItem = item as IndustryListItem;
    const searchQuery = query.toLowerCase();
    return (
      industryItem.originalData.name.toLowerCase().includes(searchQuery) ||
      industryItem.originalData.riskSegment.toLowerCase().includes(searchQuery) ||
      industryItem.originalData.averageDeliveryDays.toString().includes(searchQuery)
    );
  };

  const handleItemClick = (item: CustomListItemProps) => {
    const industryItem = item as IndustryListItem;
    console.log('Clicked industry:', industryItem.originalData);
    // Add navigation logic here if needed
  };

  const handleEditSave = async (updates: { averageDeliveryDays: number; riskSegment: IndustryData['riskSegment'] }): Promise<void> => {
    if (!editIndustry) return;

    try {
      const result = await industryService.updateIndustryData(editIndustry.id, {
        industry_add: updates.averageDeliveryDays,
        risk_segment: updates.riskSegment
      });

      if (result.success) {
        // Close the popup first
        setEditIndustry(null);
        // Refetch the data to get the updated information from server
        await fetchIndustries();
      } else {
        console.error('Error updating industry:', result.error);
        // You might want to show an error toast here
        throw new Error(result.error || 'Failed to update industry');
      }
    } catch (error) {
      console.error('Error updating industry:', error);
      // You might want to show an error toast here
      throw error; // Re-throw so the dialog can handle the error state
    }
  };

  const addRangeOptions = [
    { value: '0-3', label: '0-3d' },
    { value: '4-15', label: '4-15d' },
    { value: '15+', label: '15d+' },
  ];

  return (
    <motion.div
      className="w-full px-2 pb-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Section Header */}
      <motion.div className="mb-4">
        <SectionHeaderWithFlags
          title="Industry Analysis"
          icon={Factory}
          positiveFlags={[]}
          negativeFlags={[]}
          mildPositiveFlags={[]}
          titleColorClass={colorSchemes.blue.text}
          iconColorClass={colorSchemes.blue.text}

          allowCollapse={false}
          initialRowLimit={5}
        />
      </motion.div>

      <CustomLoader 
        loading={isLoading || isProfileLoading}
        specs={{
          size: 'lg',
          color: 'blue',
          type: 'spinner',
          text: isProfileLoading ? 'Loading profile...' : 'Loading industries...',
          textColor: 'blue'
        }}
      >
        <CustomList
          items={industryItems}
          searchFields={['title']}
          onItemClick={handleItemClick}
          showTimeline={false}
          disableInternalSorting={true}
          showToggleOptionCounts={true}
          initialRowLimit={200}
        primaryFilterGroup={[
          {
            id: 'risk',
            label: 'Risk Segment',
            type: 'togglebuttons',
            options: riskSegmentOptions,
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: riskFilterFunction,
            showLabel: true
          },
          {
            id: 'add',
            label: 'Average Delivery Days',
            type: 'togglebuttons',
            options: addRangeOptions,
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: addFilterFunction,
            showLabel: true,
            actionElements: (
              <div className="flex gap-2 items-center">
                <SortActionButton
                  sortFields={sortFields}
                  currentSortField={currentSortField}
                  currentSortDirection={currentSortDirection}
                  onSortChange={handleSortChange}
                  color="blueTextWhiteBg"
                  border={true}
                />
                {isAdmin && (
                  <ActionButton
                    id="reset-to-default-industries"
                    text="Reset to Default"
                    icon={RotateCcw}
                    color="orange"
                    onClick={() => {
                      // TODO: Add reset functionality for industries
                      console.log('Reset to default clicked for industries');
                    }}
                    border={true}
                  />
                )}
              </div>
            )
          }
        ]}
        secondaryFilterGroups={[
          {
            id: 'search',
            label: 'Search',
            type: 'searchbar',
            options: [],
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: searchFilterFunction,
            showLabel: false,
            searchPlaceholder: 'Search by industry name, risk segment, ADD...',
            onSearchChange: () => {},
          }
        ]}
        emptyState={{
          icon: Factory,
          title: 'No industries found',
          description: 'No industries match your current search criteria.'
        }}
        />
      </CustomLoader>

      {/* Edit Industry Dialog */}
      {editIndustry && (
        <EditIndustryDialog
          isOpen={!!editIndustry}
          onClose={() => setEditIndustry(null)}
          industry={editIndustry}
          onSave={handleEditSave}
        />
      )}
    </motion.div>
  );
};

export default MerchantIndustriesTab;
