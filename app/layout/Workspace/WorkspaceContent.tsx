export interface WorkspaceContentProps {
  content: React.ReactNode;
  scrollable?: boolean;
}

export function WorkspaceContent({ content, scrollable = true }: WorkspaceContentProps) {
  return (
    <div className={scrollable ? "flex-1 min-h-0 overflow-y-auto" : "flex-1 min-h-0 overflow-hidden"}>
      <div className={scrollable ? "min-h-full p-4 pb-4 flex flex-col" : "h-full min-h-0 p-4 pb-4 flex flex-col"}>
        {content}
      </div>
    </div>
  );
}
