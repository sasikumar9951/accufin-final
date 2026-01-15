"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

export default function Team() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

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
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col"
            >
                <h1 className="text-white text-5xl font-bold mb-4 mt-10">Contact Us</h1>
                <div className="flex items-center space-x-2 text-lg">
                    <Link href="/" className="text-[#00c6fb] hover:underline">Home</Link>
                    <span className="text-white">/</span>
                    <span className="text-white">Contact Us</span>
                </div>
            </motion.div>
        </section>
    );
}
