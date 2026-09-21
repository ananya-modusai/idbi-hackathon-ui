import * as React from "react"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command"
import { useActiveContext } from "./useActiveContext"
import { ruleIds } from "./constants"
//import { useRouter } from "next/navigation"
import { ActiveContextCommandGroup } from "./ActiveContextCommandGroup"
import { useMerchantIdStore } from "@/app/store/merchant/merchantIdStore"
//import { useCustomerIdStore } from "@/app/store/customer/customerIdStore"
import { useInvestigationCaseStore } from "@/app/store/investigation/investigationCaseStore"
//import { useCustomerIdStore } from "@/app/store/customer/customerIdStore"
import { useInvestigationHubStore } from "@/app/store/caseManagement/InvestigationHubStore"
import { useCompanyStore } from "@/app/store/company/companyStore"
import { useChargebackCaseStore } from "@/app/store/chargeback/chargebackCaseStore"


export function ActiveContext() {
  // Create a ref for the input element
  const inputRef = React.useRef<HTMLInputElement>(null)

  const { merchantIdList } = useMerchantIdStore()
  //const { customerIdList, fetchCustomerIdList } = useCustomerIdStore()
  const { investigationReferences } = useInvestigationHubStore()
  const { companies } = useCompanyStore()
  const { chargebackCases, fetchChargebackCases } = useChargebackCaseStore()
  const { investigationCases } = useInvestigationCaseStore()

  

  const {
    activeContexts,
    inputValue,
    isOpen,
    commandRef,
    setInputValue,
    setIsOpen,
    handleSelect,
    getItemClassName,
    getDisplayText
  } = useActiveContext()

  // Effect to handle navigation when merchant context changes

  // Fetch chargeback cases on component mount
  React.useEffect(() => {
    fetchChargebackCases();
  }, [fetchChargebackCases]);

  // Focus the input when isOpen changes to true
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      // Use a small timeout to ensure the input is rendered before focusing
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [isOpen])

  const displayText = getDisplayText()


  // Transform the company data to match the expected format
  const companyItems = companies.map(company => ({
    value: company.id,
    label: company.legal_name
  }))

  // Transform chargeback case data to match the expected format
  const chargebackCaseItems = chargebackCases.map(chargebackCase => ({
    value: chargebackCase.caseId,
    label: `${chargebackCase.caseId} - ${chargebackCase.caseTitle}`
  }))

  // Transform investigation case data
  const investigationCaseItems = investigationCases.map(c => ({
    value: c.caseId,
    label: c.caseTitle || c.registeredName || c.caseId
  }))


  const commandGroups = [
    {
      heading: "Merchant IDs",
      items: merchantIdList,
      type: "merchant" as const,
      activeValue: activeContexts.merchant
    },
    {
      heading: "Investigation Case IDs",
      items: investigationCaseItems,
      type: "investigation" as const,
      activeValue: activeContexts.investigation
    },
    // {
    //   heading: "Chargeback Case IDs",
    //   items: chargebackCaseItems,
    //   type: "chargeback" as const,
    //   activeValue: activeContexts.chargeback
    // },
    
    // {
    //   heading: "Case IDs",
    //   items: investigationReferences.map(ref => ({
    //     value: ref.case_number,
    //     label: ref.investigation_id
    //   })),
    //   type: "case" as const,
    //   activeValue: activeContexts.case
    // },
    // {
    //   heading: "Rule IDs",
    //   items: ruleIds,
    //   type: "rule" as const,
    //   activeValue: activeContexts.rule
    // },
    // {
    //   heading: "Companies",
    //   items: companyItems,
    //   type: "company" as const,
    //   activeValue: activeContexts.company
    // },
    // {
    //   heading: "Intermediary IDs",
    //   items: intermediaryIds,
    //   type: "intermediary" as const,
    //   activeValue: activeContexts.intermediary
    // }
  ]

  return (
    <div className="relative ml-auto mr-4" ref={commandRef}>
      <div 
        onClick={() => setIsOpen(true)}
        className="h-9 w-[200px] px-3 flex items-center gap-2 rounded-md border shadow-sm cursor-text bg-white"
      >
        <span className="text-sm truncate">
          <span className="text-muted-foreground">{displayText.prefix}</span>
          <span className={displayText.value.startsWith("Select") || displayText.value.startsWith("Search") 
            ? "text-muted-foreground" 
            : "text-blue-600 font-medium"}>
            {displayText.value}
          </span>
        </span>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+4px)] w-[300px] z-[9999]">
          <Command className="rounded-lg border shadow-md">
            <CommandInput 
              ref={inputRef}
              placeholder="Search across all IDs..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              
              {commandGroups.map(group => (
                <ActiveContextCommandGroup
                  key={group.heading}
                  heading={group.heading}
                  items={group.items}
                  activeValue={group.activeValue}
                  inputValue={inputValue}
                  onSelect={(value: string, label: string) => handleSelect(group.type, value, label)}
                  onClear={() => handleSelect(group.type, null, null)}
                  getItemClassName={getItemClassName}
                  type={group.type}
                />
              ))}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}