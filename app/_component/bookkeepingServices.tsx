// bookkeeping - services
"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function BookkeepingService() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    return (
        <section
            className="relative w-full h-[320px] flex flex-col justify-center"
            style={{
                backgroundImage: "url('/bookkeeping-services.jpg')", // Changed to bookkeeping-related image
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
            }}
            ref={ref}
        >
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col"
            >
                <h1 className="text-white text-4xl md:text-5xl font-bold mb-4 mt-10">
                    Bookkeeping Services
                </h1>
                <div className="flex items-center space-x-2 text-lg">
                    <Link href="/" className="text-[#00c6fb] hover:underline">
                        Home
                    </Link>
                    <span className="text-white">/</span>
                    <Link href="/service" className="text-[#00c6fb] hover:underline">
                        Services
                    </Link>
                    <span className="text-white">/</span>
                    <span className="text-white">Bookkeeping</span>
                </div>
            </motion.div>
        </section>
    );
}