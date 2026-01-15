"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const partners = [
    "https://gtkit.rometheme.pro/gaudit/wp-content/uploads/sites/20/2023/03/Partner-1.png",
    "https://gtkit.rometheme.pro/gaudit/wp-content/uploads/sites/20/2023/03/Partner-4.png",
    "https://gtkit.rometheme.pro/gaudit/wp-content/uploads/sites/20/2023/03/Partner-3.png",
    "https://gtkit.rometheme.pro/gaudit/wp-content/uploads/sites/20/2023/03/Partner-2.png",
    "https://gtkit.rometheme.pro/gaudit/wp-content/uploads/sites/20/2023/03/Partner-6.png",
    "https://gtkit.rometheme.pro/gaudit/wp-content/uploads/sites/20/2023/03/Partner-5.png",
];

export default function Logos() {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    return (
        <div
            ref={sectionRef}
            className="bg-[#0082a3] text-white py-10 px-4"
        >
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                {/* Logos */}
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={isInView ? { x: 0, opacity: 1 } : {}}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex-1 flex flex-wrap gap-8 justify-center md:justify-end items-center"
                >
                    {partners.map((src, i) => (
                        <motion.div
                            key={src}
                            initial={{ y: 40 * ((i % 2 === 0) ? 1 : -1), opacity: 0 }}
                            animate={isInView ? { y: 0, opacity: 1 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="w-40 h-15 flex items-center justify-center rounded"
                        >
                            <img src={src} alt="partner logo" className="h-full w-full object-contain" />
                        </motion.div>
                    ))}
                </motion.div>

                {/* Text */}
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={isInView ? { x: 0, opacity: 1 } : {}}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex-1 flex flex-col items-center md:items-start"
                >
                    <div className="uppercase text-xs tracking-widest text-cyan-200 mb-1">Partner</div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white text-center md:text-right">
                        Get to Know Our
                    </h2>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white text-center md:text-right">
                        Partners
                    </h2>
                    <p className="text-cyan-100 text-sm md:text-base max-w-md">
                        Aenean malesuada, elit non dictum sodales erat, et ultricies quam nunc bibendum et. Mauris vehicula porta erat magna.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
