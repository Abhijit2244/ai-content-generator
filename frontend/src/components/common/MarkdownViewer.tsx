import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

function sanitizeUrl(href?: string): string | undefined {
  if (!href) return undefined;
  const trimmed = href.trim();
  // Allow safe protocols: http, https, mailto, tel, or relative URLs; block javascript:, data:, vbscript:
  const isSafe = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed);
  return isSafe ? trimmed : undefined;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-viewer text-slate-800 leading-relaxed text-sm ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-2xl font-extrabold text-slate-900 tracking-tight mt-6 mb-3 pb-2 border-b border-slate-200"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-xl font-bold text-slate-900 tracking-tight mt-5 mb-2.5"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold text-slate-900 mt-3 mb-1.5" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="my-2.5 leading-relaxed text-slate-700" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside my-3 space-y-1 pl-2 text-slate-700" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside my-3 space-y-1 pl-2 text-slate-700" {...props} />
          ),
          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-emerald-500 bg-slate-50 pl-4 py-2 my-3 italic text-slate-700 rounded-r-lg"
              {...props}
            />
          ),
          hr: ({ node, ...props }) => <hr className="my-6 border-slate-200" {...props} />,
          a: ({ node, href, children, ...props }) => {
            const safeHref = sanitizeUrl(href);
            if (!safeHref) {
              return (
                <span className="text-slate-500 underline underline-offset-2 cursor-not-allowed" title="Unsafe link neutralized">
                  {children}
                </span>
              );
            }
            return (
              <a
                href={safeHref}
                className="text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
          img: ({ node, src, alt, ...props }) => {
            const safeSrc = sanitizeUrl(src);
            if (!safeSrc) {
              return <span className="text-xs text-slate-400 italic">[Unsafe image blocked]</span>;
            }
            return (
              <img
                src={safeSrc}
                alt={alt || 'Content image'}
                className="rounded-xl max-w-full my-4 border border-slate-200"
                loading="lazy"
                {...props}
              />
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-slate-50 text-slate-900 font-semibold" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-100 bg-white" {...props} />,
          tr: ({ node, ...props }) => <tr className="hover:bg-slate-50/75 transition-colors" {...props} />,
          th: ({ node, ...props }) => (
            <th className="px-3.5 py-2.5 font-bold text-slate-800 uppercase tracking-wider text-[11px]" {...props} />
          ),
          td: ({ node, ...props }) => <td className="px-3.5 py-2.5 text-slate-700" {...props} />,
          code: ({ node, inline, className: codeClassName, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-xs font-semibold border border-slate-200/60"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock code={String(children).replace(/\n$/, '')} language={codeClassName} />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanLang = language ? language.replace(/language-/, '') : '';

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
        <span>{cleanLang || 'plaintext'}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center space-x-1 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};
