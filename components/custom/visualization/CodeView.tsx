interface CodeViewProps {
  code: string;
  isEditable?: boolean;
}

export function CodeView({ code, isEditable = false }: CodeViewProps) {
  return (
    <div className="overflow-auto max-h-[300px] p-4 bg-gray-50 rounded text-xs font-mono">
      {isEditable ? (
        <textarea
          className="w-full h-full min-h-[200px] bg-transparent border-none focus:ring-0 resize-none"
          defaultValue={code}
          readOnly={!isEditable}
        />
      ) : (
        <pre>{code}</pre>
      )}
    </div>
  );
} 