import { FC } from 'react';
import { Code2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';

interface CodeArtifactProps {
  code: {
    language: string;
    content: string;
  };
}

export const CodeArtifact: FC<CodeArtifactProps> = ({ code }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-semibold">Code Snippet</h2>
        </div>
        <div className="px-2 py-1 rounded bg-gray-100 text-sm text-gray-600">
          {code.language}
        </div>
      </div>

      <div className="relative">
        <SyntaxHighlighter
          language={code.language}
          style={vscDarkPlus}
          showLineNumbers={true}
          wrapLines={true}
          className="rounded-lg !bg-gray-900"
        >
          {code.content}
        </SyntaxHighlighter>
      </div>
    </motion.div>
  );
}; 