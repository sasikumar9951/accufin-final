"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";

export default function SinglePost() {
    const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (inView) setAnimate(true);
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
                initial={{ opacity: 0, x: -50, rotateY: -10 }}
                animate={animate ? { opacity: 1, x: 0, rotateY: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col"
            >
                <h1 className="text-white text-5xl font-bold mb-4 mt-10">Tutorial</h1>
                <div className="flex items-center space-x-2 text-lg">
                    <Link href="/" className="text-[#00c6fb] hover:underline">Home</Link>
                    <span className="text-white">/</span>
                    <span className="text-white">Tutorial</span>
                </div>
            </motion.div>
        </section>
    );
}
