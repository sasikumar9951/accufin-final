"use client";
import { FaCalendarAlt, FaChevronRight } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Blogs } from "@prisma/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const markdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-lg font-bold text-white mb-2">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-base font-bold text-white mb-2">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-sm font-bold text-white mb-1">{children}</h3>
  ),
  p: ({ children }: any) => (
    <p className="text-white mb-2 leading-relaxed">{children}</p>
  ),
  strong: ({ children }: any) => (
    <strong className="font-bold text-white">{children}</strong>
  ),
  em: ({ children }: any) => <em className="italic text-white">{children}</em>,
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside text-white mb-2">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside text-white mb-2">{children}</ol>
  ),
  li: ({ children }: any) => <li className="text-white">{children}</li>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-white/30 pl-3 text-white/90 italic">
      {children}
    </blockquote>
  ),
  code: ({ children }: any) => (
    <code className="bg-white/20 px-1 py-0.5 rounded text-white text-xs font-mono">
      {children}
    </code>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-blue-200 underline hover:no-underline hover:text-blue-100 transition-colors cursor-pointer font-medium"
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </a>
  ),
  img: ({ src, alt }: any) => (
    <img src={src} alt={alt} className="max-w-full h-auto rounded mt-2" />
  ),
  table: ({ children }: any) => (
    <table className="w-full border-collapse border border-white/30 mt-2 mb-4">
      {children}
    </table>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-white/10">{children}</thead>
  ),
  tbody: ({ children }: any) => <tbody>{children}</tbody>,
  tr: ({ children }: any) => (
    <tr className="border border-white/30">{children}</tr>
  ),
  th: ({ children }: any) => (
    <th className="border border-white/30 px-3 py-2 text-white font-bold text-left">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border border-white/30 px-3 py-2 text-white">
      {children}
    </td>
  ),
};

export default function BlogSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const [blogs, setBlogs] = useState<Blogs[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchBlogs = async () => {
      try {
        const response = await fetch("/api/user/blogs");
        if (!response.ok) {
          throw new Error(`Failed to fetch blogs: ${response.status}`);
        }
        const data = await response.json();
        if (isMounted) {
          setBlogs(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
        if (isMounted) {
          setBlogs([]);
        }
      }
    };
    fetchBlogs();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="bg-[#f7f9fa] py-16 px-4" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.7 }}
        className="max-w-7xl mx-auto"
      >
        <div className="text-center mb-2 text-[#008db3] font-semibold tracking-widest uppercase">
          News essentials for you
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] text-center mb-4">
          Important to follow
        </h2>
        <p className="text-center text-[#5a6a7a] mb-10 max-w-2xl mx-auto">
          Important information might be useful for you
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="rounded-lg overflow-hidden border border-[#008db3] bg-white flex flex-col h-full group transition-colors duration-300 hover:bg-[#008db3] hover:text-white"
            >
              <div className="overflow-hidden">
                <img
                  src={"/img9.jpg"}
                  alt={blog.title}
                  className="w-full h-56 object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
              </div>
              <div className="flex-1 flex flex-col p-6 bg-[#008db3] group-hover:bg-[#008db3] transition-colors text-white">
                <div className="font-bold text-lg mb-2">{blog.title}</div>
                <div className="flex items-center text-sm mb-2 opacity-80 group-hover:opacity-100">
                  <FaCalendarAlt className="mr-2" />
                  {blog.createdAt
                    ? new Date(blog.createdAt).toLocaleDateString()
                    : "N/A"}
                </div>
                <div className="mb-4 text-sm flex-1 line-clamp-3">
                  <ReactMarkdown
                    components={markdownComponents}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {blog.content}
                  </ReactMarkdown>
                </div>
                <a
                  href={`/blog/${blog.id}`}
                  className="inline-flex items-center font-semibold text-sm mt-auto text-white group-hover:text-white transition-colors"
                >
                  READ MORE <FaChevronRight className="ml-2" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
