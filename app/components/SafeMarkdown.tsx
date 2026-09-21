import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface SafeMarkdownProps {
  children: string;
  className?: string;
  remarkPlugins?: any[];
}

// Safe markdown component that doesn't render HTML tags
export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ 
  children, 
  className,
  remarkPlugins = [remarkGfm]
}) => {
  // Ensure we don't allow HTML elements in markdown to prevent hydration errors
  if (!children) return null;

  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={remarkPlugins}
      components={{
        // Override default HTML element renderers
        html: () => null, // Don't render HTML tags at all
        h1: ({ node, ...props }) => <h1 className={cn("text-xl font-bold my-2", className)} {...props} />,
        h2: ({ node, ...props }) => <h2 className={cn("text-lg font-bold my-2", className)} {...props} />,
        h3: ({ node, ...props }) => <h3 className={cn("text-md font-bold my-1", className)} {...props} />,
        p: ({ node, children, ...props }) => (
          <p className={cn("my-2", className)} {...props}>
            {children}
          </p>
        ),
        ul: ({ node, children, ...props }) => (
          <ul className={cn("list-disc list-inside space-y-1 ml-4", className)} {...props}>
            {children}
          </ul>
        ),
        li: ({ node, children, ...props }) => (
          <li className={cn("my-1", className)} {...props}>
            {children}
          </li>
        ),
        // Ensure other components don't accidentally render html tags
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline && match ? (
            <SyntaxHighlighter
              {...props}
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          )
        }
      }}
    >
      {children}
    </ReactMarkdown>
  )
}