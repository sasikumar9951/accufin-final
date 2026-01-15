"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function About2() {
    return (
        <section
            className="relative w-full h-[320px] flex flex-col justify-center mb-15"
            style={{
                backgroundImage: "url('/img2.jpg')", 
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
            }}
        >
            <div className="absolute inset-0 bg-black opacity-50"></div>
            
            <motion.div
                className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.4 }}
            >
                <h1 className="text-white text-5xl font-bold mb-4 mt-10">About Accufin</h1>
                <div className="flex items-center space-x-2 text-lg">
                    <Link href="/" className="text-[#00c6fb] hover:underline">Home</Link>
                    <span className="text-white">/</span>
                    <span className="text-white">About Us</span>
                </div>
            </motion.div>
        </section>
    );
}
