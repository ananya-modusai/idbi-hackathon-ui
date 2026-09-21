"use client";

// Markdown for agent replies — element map written out in the app's own type scale.
// Ported from axis-cam-ui/app/pages/ModusAgent/AgentMarkdown.tsx.

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function AgentMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("text-[14px] leading-[1.65] text-gray-800", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => <h1 className="mb-2 mt-4 text-[17px] font-semibold text-gray-900 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 mt-4 text-[15px] font-semibold text-gray-900 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1.5 mt-3.5 text-[14px] font-semibold text-gray-900 first:mt-0">{children}</h3>,
          ul: ({ children }) => (
            <ul className="mb-3 space-y-1.5 last:mb-0 [&>li]:relative [&>li]:pl-5 [&>li]:before:absolute [&>li]:before:left-1.5 [&>li]:before:top-[0.62em] [&>li]:before:h-1 [&>li]:before:w-1 [&>li]:before:rounded-full [&>li]:before:bg-gray-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1.5 pl-5 last:mb-0 marker:text-gray-400 [&>li]:pl-1">{children}</ol>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 underline underline-offset-2 hover:text-blue-700">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-gray-200 pl-3 text-gray-600 last:mb-0">{children}</blockquote>
          ),
          hr: () => <hr className="my-4 border-gray-200" />,
          code: ({ children, className: cls }) =>
            cls?.startsWith("language-") ? (
              <code className="block overflow-x-auto rounded-lg bg-gray-50 p-3 font-mono text-[12.5px] text-gray-800">{children}</code>
            ) : (
              <code className="rounded bg-gray-100 px-1 py-px font-mono text-[12.5px] text-gray-800">{children}</code>
            ),
          pre: ({ children }) => <pre className="mb-3 last:mb-0">{children}</pre>,
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto rounded-lg border border-gray-200 last:mb-0">
              <table className="w-full border-collapse text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-gray-200 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border-b border-gray-100 px-3 py-2 text-gray-700">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default AgentMarkdown;
