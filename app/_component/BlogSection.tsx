"use client";
import { FaCalendarAlt, FaChevronRight } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Blogs } from "@/lib/generated/prisma";
import { formatTextWithLinks } from "@/lib/utils";

export default function BlogSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  
  
  const [blogs, setBlogs] = useState<Blogs[]>([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      const response = await fetch("/api/user/blogs");
      const data = await response.json();
      setBlogs(data);
    };
    fetchBlogs();
  }, []);

  return (
    <section className="bg-[#f7f9fa] py-16 px-4" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.7 }}
        className="max-w-7xl mx-auto"
      >
        {/* <div className="text-center mb-2 text-[#008db3] font-semibold tracking-widest uppercase">
          Our Blog
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] text-center mb-4">
          Latest Blog & News for You
        </h2>
        <p className="text-center text-[#5a6a7a] mb-10 max-w-2xl mx-auto">
          Stop Guessing. Start Growing, Lets work together to make bookkeeping and accounting streamlined and hassle free.
        </p> */}


      

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
              {blogs && blogs.length > 0 && blogs.map((blog) => (
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
                      {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : "N/A"}

                    </div>
                    <div className="mb-4 text-sm flex-1">{formatTextWithLinks(blog.content, "white")}</div>
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

      </motion.div>
    </section>
  );
}
