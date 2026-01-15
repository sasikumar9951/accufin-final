"use client";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import { FaChartLine, FaMoneyBillWave, FaReceipt, FaBoxes, FaCalculator, FaCheckCircle } from "react-icons/fa";

export default function CashFlowPage() {
    const controls = useAnimation();
    const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (inView) setAnimate(true);
    }, [inView]);
    useEffect(() => {
        if (inView) {
            controls.start("visible");
        }
    }, [controls, inView]);

    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="bg-gray-50 md:pt-[120px] pt-[150px]">
            <Navbar />

            {/* Hero Section */}
            {/* <section
                className="relative w-full h-[400px] md:h-[500px] flex flex-col justify-center"
                style={{
                    backgroundImage: "url('/cashflow.jpeg')",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    // backgroundAttachment: "fixed",
                }}
            >
                <div className="absolute inset-0 bg-black opacity-50"></div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={controls}
                    ref={ref}
                    className="relative z-[100] w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col items-center text-center"
                >
                    <motion.h1
                        className="text-white text-4xl sm:text-5xl md:text-6xl font-bold mb-4"
                        variants={item}
                    >
                        Optimizing Cash Flow & Tax Efficiency
                    </motion.h1>
                    <motion.p
                        className="text-white text-lg md:text-xl max-w-2xl mb-8"
                        variants={item}
                    >
                        Strategic financial restructuring for sustainable business health
                    </motion.p>
                    <motion.div
                        className="flex items-center space-x-2 text-lg"
                        variants={item}
                    >
                        <Link href="/" className="text-[#00c6fb] hover:underline">Home</Link>
                        <span className="text-white">/</span>
                        <span className="text-white">Cash Flow & Tax</span>
                    </motion.div>
                </motion.div>
            </section> */}
            <section
                ref={ref}
                className="relative w-full h-[400px] md:h-[500px] flex flex-col justify-center"
                style={{
                    backgroundImage: "url('/cashflow.jpeg')",
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
                        Cash Flow & Tax Efficiency
                    </motion.h1>
                    <motion.p
                        className="text-white text-lg md:text-xl max-w-2xl mb-8"
                        initial={{ opacity: 0 }}
                        animate={animate ? { opacity: 1 } : {}}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        Optimizing liquidity and minimizing tax burdens for sustainable growth
                    </motion.p>
                    <motion.div
                        className="flex items-center space-x-2 text-lg"
                        initial={{ opacity: 0 }}
                        animate={animate ? { opacity: 1 } : {}}
                        transition={{ delay: 0.6, duration: 0.8 }}
                    >
                        <Link href="/" className="text-[#00c6fb] hover:underline">Home</Link>
                        <span className="text-white">/</span>
                        <span className="text-white">Cash Flow & Tax</span>
                    </motion.div>
                </motion.div>
            </section>

            {/* Main Content */}
            <motion.main
                initial="hidden"
                animate={controls}
                variants={container}
                className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20"
            >
                {/* Case Study Section */}
                <motion.section className="mb-20" variants={item}>
                    <motion.div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                            Case Study: Manufacturing Company Turnaround
                        </h2>
                        <p className="text-gray-600 mb-6">
                            During a past assignment, I was engaged by a mid-sized manufacturing company facing severe liquidity constraints due to high debt obligations, inefficient working capital management, and unfavorable tax liabilities. The business was struggling to meet its operational expenses, and without intervention, it risked insolvency.
                        </p>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-8">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">Key Challenges Identified:</h3>
                            <ul className="space-y-3">
                                {[
                                    "Cash Flow Shortfalls – Inconsistent revenue cycles with fixed high-interest debt repayments",
                                    "Excessive Tax Burden – Unoptimized tax structuring increasing liabilities",
                                    "Inefficient Working Capital – Poor inventory management and extended receivables"
                                ].map((challenge) => (
                                    <li key={challenge} className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        <span className="text-gray-700">{challenge}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>

                    {/* Strategic Interventions */}
                    <motion.div className="mb-12" variants={item}>
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <FaChartLine className="text-blue-600" /> Strategic Interventions Implemented
                        </h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                {
                                    icon: <FaMoneyBillWave className="text-2xl" />,
                                    title: "Debt Restructuring",
                                    desc: "Negotiated with lenders to refinance high-cost debt into longer-term, lower-interest obligations, easing immediate cash flow pressure."
                                },
                                {
                                    icon: <FaReceipt className="text-2xl" />,
                                    title: "Tax Optimization",
                                    desc: "Implemented strategies including accelerated depreciation, R&D credits, and entity restructuring to reduce effective tax rates."
                                },
                                {
                                    icon: <FaBoxes className="text-2xl" />,
                                    title: "Working Capital Improvement",
                                    desc: "Introduced just-in-time inventory controls and stricter receivables policies, freeing up over $2M in trapped cash."
                                },
                                {
                                    icon: <FaCalculator className="text-2xl" />,
                                    title: "Cash Flow Forecasting",
                                    desc: "Developed dynamic 12-month rolling cash flow model to improve liquidity planning and avoid future shortfalls."
                                }
                            ].map((intervention) => (
                                <motion.div
                                    key={intervention.title}
                                    variants={item}
                                    className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500 hover:shadow-lg transition-shadow"
                                >
                                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-blue-600">
                                        {intervention.icon}
                                    </div>
                                    <h4 className="text-xl font-semibold text-gray-800 mb-2">{intervention.title}</h4>
                                    <p className="text-gray-600">{intervention.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Results Section */}
                    <motion.div variants={item} className="bg-green-50 rounded-xl p-8 mb-12">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <FaCheckCircle className="text-green-600" /> Results Achieved
                        </h3>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                "35% reduction in annual debt servicing costs",
                                "22% decrease in effective tax rate",
                                "50% reduction in cash conversion cycle",
                                "Returned to profitability within 18 months"
                            ].map((result) => (
                                <motion.div
                                    key={result}
                                    variants={item}
                                    className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-3"
                                >
                                    <span className="bg-green-100 text-green-600 p-2 rounded-full">
                                        <FaCheckCircle />
                                    </span>
                                    <span className="text-gray-700">{result}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Conclusion */}
                    <motion.div variants={item} className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                        <p className="text-gray-600 mb-6">
                            This engagement highlights my ability to diagnose financial distress, implement restructuring strategies, and optimize both cash flow and tax efficiency—delivering sustainable financial health for businesses.
                        </p>
                    </motion.div>
                </motion.section>

                {/* CTA Section */}
                <motion.section
                    variants={item}
                    className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-center text-white"
                >
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">Need Professional Financial Restructuring?</h2>
                    <p className="text-lg mb-6 max-w-3xl mx-auto">
                        Contact me today to discuss how I can optimize your cash flow and tax efficiency for sustainable business growth.
                    </p>
                    <motion.a
                        href="/contact"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white text-blue-600 font-bold px-8 py-3 rounded-lg shadow-lg hover:bg-gray-100 transition-all"
                    >
                        Schedule Consultation
                    </motion.a>
                </motion.section>
            </motion.main>

            <Footer />
        </div>
    );
}