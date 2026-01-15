import React from "react";
import { formatTextWithLinks } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';

// Markdown component renderers defined outside to avoid recreation on each render
const markdownComponents: Components = {
  h1: ({children}) => <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-6">{children}</h1>,
  h2: ({children}) => <h2 className="text-2xl font-bold text-gray-900 mb-3 mt-5">{children}</h2>,
  h3: ({children}) => <h3 className="text-xl font-bold text-gray-900 mb-2 mt-4">{children}</h3>,
  h4: ({children}) => <h4 className="text-lg font-semibold text-gray-900 mb-2 mt-3">{children}</h4>,
  h5: ({children}) => <h5 className="text-base font-semibold text-gray-900 mb-1 mt-2">{children}</h5>,
  h6: ({children}) => <h6 className="text-sm font-semibold text-gray-900 mb-1 mt-2">{children}</h6>,
  p: ({children}) => <p className="text-gray-800 mb-4 leading-relaxed">{children}</p>,
  strong: ({children}) => <strong className="font-bold text-gray-900">{children}</strong>,
  em: ({children}) => <em className="italic text-gray-700">{children}</em>,
  ul: ({children}) => <ul className="list-disc list-inside text-gray-800 mb-4 space-y-1">{children}</ul>,
  ol: ({children}) => <ol className="list-decimal list-inside text-gray-800 mb-4 space-y-1">{children}</ol>,
  li: ({children}) => <li className="text-gray-800">{children}</li>,
  blockquote: ({children}) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 text-gray-700 italic mb-4">
      {children}
    </blockquote>
  ),
  code: ({children}) => (
    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
      {children}
    </code>
  ),
  pre: ({children}) => (
    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm">
      {children}
    </pre>
  ),
  a: ({href, children}) => (
    <a 
      href={href} 
      className="text-blue-500 hover:text-blue-700 underline hover:no-underline transition-colors" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  img: ({src, alt}) => (
    <img 
      src={src} 
      alt={alt} 
      className="max-w-full h-auto rounded-lg shadow-md my-4 mx-auto block" 
    />
  ),
  table: ({children}) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border-collapse border border-gray-300">
        {children}
      </table>
    </div>
  ),
  th: ({children}) => (
    <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">
      {children}
    </th>
  ),
  td: ({children}) => (
    <td className="border border-gray-300 px-4 py-2">
      {children}
    </td>
  ),
  hr: () => <hr className="border-gray-300 my-6" />,
};

const Read: React.FC<{ title: string; content: string; tags: string[] }> = ({
  title,
  content,
  tags,
}) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:pt-[150px] pt-[220px]">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
        {title}
      </h1>
      <div className="space-y-4 text-justify text-base md:text-lg text-gray-800">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <a
            key={tag}
            href={`/blog?tag=${tag}`}
            className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
          >
            {formatTextWithLinks(tag,"blue-500")}
          </a>
        ))}
      </div>
    </div>
  );
};

export default Read;
