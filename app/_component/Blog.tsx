"use client";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef} from "react";

export default function Blog() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      ref={ref}
      className="relative w-full h-[320px] flex flex-col justify-center"
      style={{
        backgroundImage: "url('/img2.jpg')",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col"
      >
        <h1 className="text-white text-5xl font-bold mb-4 mt-10">Our Blogs</h1>
        <div className="flex items-center space-x-2 text-lg">
          <Link href="/" className="text-[#00c6fb] hover:underline">
            Home
          </Link>
          <span className="text-white">/</span>
          <span className="text-white">Blogs</span>
        </div>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      </div>
    </section>
  );
}
