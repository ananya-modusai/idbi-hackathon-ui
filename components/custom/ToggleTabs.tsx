"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ToggleTabsProps {
  value: string
  onValueChange: (value: string) => void
  options: {
    value: string
    label: string
  }[]
  className?: string
  /** Optional custom grid column class. Default is "grid-cols-2". */
  gridColumnClass?: string
}

export function ToggleTabs({ 
  value, 
  onValueChange, 
  options, 
  className,
  gridColumnClass = "grid-cols-2" 
}: ToggleTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={className}>
      <TabsList className={cn(
        "h-7 p-0.5",
        "grid", gridColumnClass
      )}>
        {options.map((option) => (
          <TabsTrigger 
            key={option.value} 
            value={option.value}
            className="px-2 py-0.5 text-xs min-w-[30px] whitespace-nowrap"
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
