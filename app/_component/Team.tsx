"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";

export default function Team() {
    const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
    const [startAnim, setStartAnim] = useState(false);

    useEffect(() => {
        if (inView) setStartAnim(true);
    }, [inView]);

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
                initial={{ opacity: 0, x: 50, rotateY: 15 }}
                animate={startAnim ? { opacity: 1, x: 0, rotateY: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col"
            >
                <h1 className="text-white text-5xl font-bold mb-4 mt-10">Our Team</h1>
                <div className="flex items-center space-x-2 text-lg">
                    <Link href="/" className="text-[#00c6fb] hover:underline">Home</Link>
                    <span className="text-white">/</span>
                    <span className="text-white">Team</span>
                </div>
            </motion.div>
        </section>
    );
}
