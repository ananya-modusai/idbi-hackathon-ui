import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { usePromptsStore } from "@/app/store/prompts/promptsStore"
import { useWorkspaceContext } from "@/app/hooks/useWorkspaceContext"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function InvestigationGPTSuggestions({ 
  onPromptClick,
  disabled = false
}: { 
  onPromptClick: (prompt: string) => void;
  disabled?: boolean;
}) {
  const { dynamicPrompts, isLoadingPrompts } = usePromptsStore();
  const { refreshContextPrompts } = useWorkspaceContext();

  return (
    <div className="w-full h-8 flex gap-2">
      <Button
        onClick={refreshContextPrompts}
        size="icon"
        variant="outline"
        className="h-8 w-8 shrink-0"
        disabled={isLoadingPrompts || disabled}
      >
        <RefreshCw 
          className={cn(
            "h-3.5 w-3.5",
            (isLoadingPrompts) && "animate-spin"
          )} 
        />
        <span className="sr-only">Refresh prompts</span>
      </Button>
      
      <ScrollArea className="w-full h-full">
        <div className="inline-flex gap-2 h-full pr-4">
          {dynamicPrompts.map((prompt, index) => (
            <button
              key={index}
              className={cn(
                "text-sm px-3 py-1.5 rounded-md shrink-0",
                "bg-blue-50 text-blue-600 hover:bg-blue-100",
                "transition-colors duration-200",
                (isLoadingPrompts || disabled) && "opacity-50 cursor-wait"
              )}
              onClick={() => onPromptClick(prompt)}
              disabled={isLoadingPrompts || disabled}
            >
              {prompt}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
