"use client";
import { motion } from "framer-motion";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import { FaChartLine, FaSearchDollar, FaHandshake, FaWarehouse, FaMoneyBillWave, FaCheckCircle } from "react-icons/fa";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function FinancialRestructurePage() {
    const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (inView) setAnimate(true);
    }, [inView]);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="bg-gray-50 md:pt-[120px] pt-[150px]">
            <Navbar />
            <section
                ref={ref}
                className="relative w-full h-[400px] md:h-[500px] flex flex-col justify-center"
                style={{
                    backgroundImage: "url('/financialrestructuring.jpg')",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    // backgroundAttachment: "fixed",
                }}
            >
                <div className="absolute inset-0 bg-black opacity-50"></div>

                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={animate ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col items-left text-left"
                >
                    <motion.h1
                        className="text-white text-4xl sm:text-5xl md:text-6xl font-bold mb-4"
                        initial={{ opacity: 0 }}
                        animate={animate ? { opacity: 1 } : {}}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        Financial Restructuring Solutions
                    </motion.h1>
                    <motion.p
                        className="text-white text-lg md:text-xl max-w-2xl mb-8"
                        initial={{ opacity: 0 }}
                        animate={animate ? { opacity: 1 } : {}}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        Transforming financial distress into sustainable success through strategic restructuring
                    </motion.p>
                    <motion.div
                        className="flex items-center space-x-2 text-lg"
                        initial={{ opacity: 0 }}
                        animate={animate ? { opacity: 1 } : {}}
                        transition={{ delay: 0.6, duration: 0.8 }}
                    >
                        <Link href="/" className="text-[#00c6fb] hover:underline">Home</Link>
                        <span className="text-white">/</span>
                        <span className="text-white">Financial Restructuring</span>
                    </motion.div>
                </motion.div>
            </section>

            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 py-12"
            >
                {/* Hero Section */}
                <motion.section
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Financial Restructuring
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Transforming financial distress into sustainable success through strategic restructuring solutions
                    </p>
                </motion.section>

                {/* Case Study Section */}
                <motion.section
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="mb-20"
                >
                    <motion.h2 variants={item} className="text-3xl font-bold text-gray-800 mb-8 text-center">
                        Successful Financial Restructuring of a Distressed Manufacturing Company
                    </motion.h2>

                    {/* Background */}
                    <motion.div variants={item} className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-10">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <FaChartLine className="text-blue-600" /> Background
                        </h3>
                        <p className="text-gray-600 mb-4">
                            A mid-sized manufacturing company with annual revenues of ~$50M was facing severe financial distress due to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600">
                            <motion.li variants={item}>Declining sales and liquidity crunch</motion.li>
                            <motion.li variants={item}>High debt burden with unsustainable interest obligations</motion.li>
                            <motion.li variants={item}>Operational inefficiencies leading to cash flow shortages</motion.li>
                            <motion.li variants={item}>Impending covenant breaches with lenders</motion.li>
                        </ul>
                        <p className="text-gray-600 mt-4">
                            The company needed an urgent financial restructuring to avoid insolvency and stabilize operations.
                        </p>
                    </motion.div>

                    {/* Role & Approach */}
                    <motion.div variants={item} className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-10">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <FaSearchDollar className="text-blue-600" /> My Role & Approach
                        </h3>
                        <p className="text-gray-600 mb-6">
                            As the lead financial restructuring advisor, I spearheaded the following key initiatives:
                        </p>

                        <div className="space-y-6">
                            <motion.div variants={item} className="border-l-4 border-blue-500 pl-4">
                                <h4 className="text-xl font-medium text-gray-800 mb-2">1. Diagnostic Review & Cash Flow Analysis</h4>
                                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                    <li>Conducted a thorough assessment of financial statements, debt obligations, and working capital gaps</li>
                                    <li>Identified key stress points, including high-cost debt and inefficient inventory management</li>
                                </ul>
                            </motion.div>

                            <motion.div variants={item} className="border-l-4 border-blue-500 pl-4">
                                <h4 className="text-xl font-medium text-gray-800 mb-2">2. Debt Restructuring & Lender Negotiations</h4>
                                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                    <li>Engaged with banks and creditors to restructure existing debt, extending maturities and reducing interest rates</li>
                                    <li>Negotiated covenant waivers to prevent default triggers</li>
                                </ul>
                            </motion.div>

                            <motion.div variants={item} className="border-l-4 border-blue-500 pl-4">
                                <h4 className="text-xl font-medium text-gray-800 mb-2">3. Working Capital Optimization</h4>
                                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                    <li>Implemented tighter controls on receivables and payables to improve liquidity</li>
                                    <li>Introduced just-in-time inventory practices to reduce holding costs</li>
                                </ul>
                            </motion.div>

                            <motion.div variants={item} className="border-l-4 border-blue-500 pl-4">
                                <h4 className="text-xl font-medium text-gray-800 mb-2">4. Cost Rationalization & Operational Turnaround</h4>
                                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                    <li>Recommended strategic cost-cutting measures, including overhead reduction and supplier renegotiations</li>
                                    <li>Assisted in restructuring unprofitable business lines to focus on core revenue drivers</li>
                                </ul>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Outcome */}
                    <motion.div variants={item} className="bg-blue-50 rounded-xl p-6 md:p-8">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <FaCheckCircle className="text-green-600" /> Outcome & Impact
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Within 12 months, the company achieved:
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { icon: <FaMoneyBillWave />, text: "Debt reduction by 40% through refinancing and lender concessions" },
                                { icon: <FaChartLine />, text: "Improved EBITDA margins by 15% via cost optimization" },
                                { icon: <FaHandshake />, text: "Positive operating cash flow within 9 months of restructuring" },
                                { icon: <FaWarehouse />, text: "Avoided bankruptcy and restored lender confidence" }
                            ].map((result) => (
                                <motion.div
                                    key={result.text}
                                    variants={item}
                                    className="bg-white p-4 rounded-lg flex items-start gap-3 shadow-sm"
                                >
                                    <span className="bg-green-100 text-green-600 p-2 rounded-full">
                                        {result.icon}
                                    </span>
                                    <span className="text-gray-700">{result.text}</span>
                                </motion.div>
                            ))}
                        </div>

                        <p className="text-gray-600 mt-6">
                            This successful turnaround not only stabilized the business but also positioned it for sustainable growth.
                        </p>
                    </motion.div>
                </motion.section>

                {/* CTA Section */}
                <motion.section
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-center text-white"
                >
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">Why This Matters for Your Business</h2>
                    <p className="text-lg mb-6 max-w-3xl mx-auto">
                        Financial distress can cripple even fundamentally strong companies. My expertise in restructuring ensures that businesses facing liquidity crises, debt burdens, or operational inefficiencies can regain stability and thrive.
                    </p>
                    <motion.a
                        href="/contact"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white text-blue-600 font-bold px-8 py-3 rounded-lg shadow-lg hover:bg-gray-100 transition-all"
                    >
                        Contact Me for a Consultation
                    </motion.a>
                </motion.section>
            </motion.main>

            <Footer />
        </div>
    );
}