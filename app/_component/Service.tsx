"use client";

import Link from "next/link";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

export default function Service() {
    const controls = useAnimation();
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });

    useEffect(() => {
        if (inView) {
            controls.start({ opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } });
        }
    }, [controls, inView]);

    const breadcrumbControls = useAnimation();
    useEffect(() => {
        if (inView) {
            breadcrumbControls.start({ opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut", delay: 0.2 } });
        }
    }, [breadcrumbControls, inView]);

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
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col">
                <motion.h1
                    className="text-white text-5xl font-bold mb-4 mt-10"
                    initial={{ opacity: 0, y: 50 }}
                    animate={controls}
                >
                    Our Services
                </motion.h1>
                <motion.div
                    className="flex items-center space-x-2 text-lg"
                    initial={{ opacity: 0, x: -50 }}
                    animate={breadcrumbControls}
                >
                    <Link href="/" className="text-[#00c6fb] hover:underline">
                        Home
                    </Link>
                    <span className="text-white">/</span>
                    <span className="text-white">Services</span>
                </motion.div>
            </div>
        </section>
    );
}
