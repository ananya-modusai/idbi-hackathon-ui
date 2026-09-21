import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, X, MessageSquare, Search, FileText } from "lucide-react"
import { MessageMode } from "@/app/types"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface InvestigationGPTInputProps {
  message: string
  setMessage: (message: string) => void
  mode: MessageMode
  setMode: (mode: MessageMode) => void
  disabled?: boolean
}

export function InvestigationGPTInput({ 
  message, 
  setMessage, 
  mode, 
  setMode,
  disabled = false
}: InvestigationGPTInputProps) {
  const handleClear = () => {
    setMessage("")
  }

  const getPlaceholder = () => {
    switch (mode) {
      case 'chat':
        return 'Chat...';
      case 'websearch':
        return 'Search the web...';
      case 'document':
        return 'Chat with the document...';
      default:
        return 'Type a message...';
    }
  };

  return (
    <div className="flex-1 relative flex items-center gap-2">
      <Tabs
        value={mode}
        onValueChange={disabled ? undefined : (value) => setMode(value as MessageMode)}
        className="h-8"
      >
        <TabsList className="h-8 p-1 bg-gray-100">
          <TabsTrigger 
            value="chat" 
            className="h-6 px-4 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            disabled={disabled}
          >
            <MessageSquare className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="websearch" 
            className="h-6 px-4 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            disabled={disabled}
          >
            <Search className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="document" 
            className="h-6 px-4 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            disabled={disabled}
          >
            <FileText className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
        placeholder={getPlaceholder()}
        className="min-w-[200px] w-[280px] h-8 px-3 pr-[34px]" 
        disabled={disabled}
      />
      {message && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-3 h-4 w-4 rounded-full bg-gray-100 hover:bg-gray-200"
          onClick={handleClear}
        >
          <X className="h-2.5 w-2.5 text-gray-600" />
          <span className="sr-only">Clear message</span>
        </Button>
      )}
    </div>
  )
}
