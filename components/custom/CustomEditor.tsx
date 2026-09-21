import { FC } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';

interface EditorProps {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
  height?: string;
  className?: string;
}

export const Editor: FC<EditorProps> = ({ 
  language, 
  value, 
  onChange, 
  height = "400px",
  className = ''
}) => {
  const handleEditorDidMount: OnMount = (editor) => {
    editor.focus();
  };

  return (
    <div className={className}>
      <MonacoEditor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="vs-light"
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
        }}
      />
    </div>
  );
}; 