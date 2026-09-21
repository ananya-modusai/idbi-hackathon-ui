import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LucideIcon } from "lucide-react";
import StandardList, { StandardListItemProps } from "./StandardList";

interface AccordionListSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: StandardListItemProps[];
  badges?: React.ReactNode;
  onItemClick?: (item: StandardListItemProps) => void;
}

interface AccordionListProps {
  sections: AccordionListSection[];
  openSections: string[];
  setOpenSections: (value: string[]) => void;
}

export function AccordionList({ sections, openSections, setOpenSections }: AccordionListProps) {
  return (
    <Accordion 
      type="multiple" 
      value={openSections}
      onValueChange={setOpenSections}
    >
      {sections.map((section) => (
        <AccordionItem key={section.id} value={section.id}>
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-2">
                <section.icon className="h-4 w-4" />
                {section.label}
              </div>
              {section.badges}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <StandardList 
                items={section.items}
                onItemClick={section.onItemClick}
                className="space-y-2"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
