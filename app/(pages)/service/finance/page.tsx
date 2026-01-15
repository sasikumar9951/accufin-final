"use client";
import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { FaChevronRight, FaCheck, FaTimes } from "react-icons/fa";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import Link from "next/link";

export default function FinancePage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const fadeInUpItem = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    const faqs = [
        {
            q: "How long does preparation take?",
            a: "5-10 business days for standard packages after receiving complete data."
        },
        {
            q: "Can you handle complex consolidations?",
            a: "Yes—we specialize in multi-entity and small and mid-sized business needs."
        },
        {
            q: "What if I use spreadsheets, not accounting software?",
            a: "We provide templates and data conversion support."
        }
    ];

    return (
        <div className="bg-white">
            <Navbar />

            {/* Hero Section with enhanced animation */}
            <section
                className="relative w-full h-[320px] flex flex-col justify-center"
                style={{
                    backgroundImage: "url('/finance.jpg')",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                }}
                ref={ref}
            >
                <div className="absolute inset-0 bg-black opacity-50"></div>
                <motion.div
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    variants={staggerContainer}
                    className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col"
                >
                    <motion.h1
                        variants={fadeInUpItem}
                        className="text-white text-4xl md:text-5xl font-bold mb-4 mt-10"
                    >
                        Financial Statement Services
                    </motion.h1>
                    <motion.div
                        variants={fadeInUpItem}
                        className="flex items-center space-x-2 text-lg"
                    >
                        <Link href="/" className="text-[#00c6fb] hover:underline">Home</Link>
                        <span className="text-white">/</span>
                        <Link href="/services" className="text-[#00c6fb] hover:underline">Services</Link>
                        <span className="text-white">/</span>
                        <span className="text-white">Financial Statements</span>
                    </motion.div>
                </motion.div>
            </section>

            {/* Hero Content Section */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeIn}
                className="max-w-7xl rounded-xl mx-auto bg-[#093961d2] relative mt-10 text-white pt-20 pb-10 px-4"
            >
                <div className="max-w-6xl mx-auto text-center">
                    <motion.h1
                        variants={fadeInUpItem}
                        className="text-4xl md:text-5xl font-bold mb-6"
                    >
                        Financial Statement Services: Transform Your Numbers into Strategy
                    </motion.h1>
                    <motion.p
                        variants={fadeInUpItem}
                        className="text-xl mb-5 max-w-3xl mx-auto"
                    >
                        Beyond compliance. Clarity that drives growth. At Accufin, we prepare accurate, compliant financial statements that do more than meet regulatory requirements—they become your roadmap for smarter decisions.
                    </motion.p>
                </div>
            </motion.section>

            {/* Why Financial Statements Matter */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
                className="max-w-7xl mx-auto px-4 py-16"
            >
                <motion.div variants={fadeIn} className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-6">
                        Why Financial Statements Matter
                    </h2>
                    <blockquote className="text-xl italic max-w-3xl mx-auto">
                        "Financial statements are your business's report card. They reveal profitability, expose risks, attract investors, and unlock financing. But only if they're prepared correctly for the Canadian context."
                    </blockquote>
                </motion.div>

                <motion.div
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    <motion.div variants={fadeIn} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-xl font-semibold text-[#0a2236] mb-4 flex items-center">
                            <FaTimes className="text-red-500 mr-2" />
                            DIY/Generic Statements
                        </h3>
                        <ul className="space-y-3 text-[#5a6a7a]">
                            <li className="flex items-start">
                                <FaTimes className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                                <span>Risk of CRA compliance gaps</span>
                            </li>
                            <li className="flex items-start">
                                <FaTimes className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                                <span>Missed trends & red flags</span>
                            </li>
                            <li className="flex items-start">
                                <FaTimes className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                                <span>Generic templates</span>
                            </li>
                            <li className="flex items-start">
                                <FaTimes className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                                <span>Delayed or inaccurate data</span>
                            </li>
                        </ul>
                    </motion.div>

                    <motion.div variants={fadeIn} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-xl font-semibold text-[#0a2236] mb-4 flex items-center">
                            <FaCheck className="text-green-500 mr-2" />
                            Our Professional Preparation
                        </h3>
                        <ul className="space-y-3 text-[#5a6a7a]">
                            <li className="flex items-start">
                                <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                                <span>Full ASPE/IFRS compliance</span>
                            </li>
                            <li className="flex items-start">
                                <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                                <span>Strategic insights & KPIs</span>
                            </li>
                            <li className="flex items-start">
                                <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                                <span>Tailored to your industry</span>
                            </li>
                            <li className="flex items-start">
                                <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                                <span>Timely, accurate reporting</span>
                            </li>
                        </ul>
                    </motion.div>
                </motion.div>
            </motion.section>

            {/* Services Section */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
                className="bg-[#f8fafc] py-16 px-4"
            >
                <div className="max-w-7xl mx-auto">
                    <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-12 text-center">
                        Our Canadian Financial Statement Services
                    </motion.h2>

                    {/* Tailored Reporting Packages */}
                    <motion.div variants={fadeIn} className="mb-16">
                        <h3 className="text-2xl font-bold text-[#0a2236] mb-6 flex items-center">
                            <span className="text-2xl mr-3">📑</span>{" "}
                            Tailored Reporting Packages
                        </h3>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 max-sm:overflow-x-scroll"
                        >
                            <table className="min-w-full">
                                <thead className="bg-[#008db3] text-white">
                                    <tr>
                                        <th className="text-left py-4 px-6">Service Level</th>
                                        <th className="text-left py-4 px-6">Best For</th>
                                        <th className="text-left py-4 px-6">Key Deliverables</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr className="hover:bg-gray-50">
                                        <td className="py-4 px-6 font-medium">Notice to Reader (Compilation)</td>
                                        <td className="py-4 px-6 text-[#5a6a7a]">Basic compliance, internal use</td>
                                        <td className="py-4 px-6 text-[#5a6a7a]">Simplified financial summary</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="py-4 px-6 font-medium">Review Engagement</td>
                                        <td className="py-4 px-6 text-[#5a6a7a]">Lender requirements, mid-size businesses</td>
                                        <td className="py-4 px-6 text-[#5a6a7a]">Analytical procedures + limited assurance</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="py-4 px-6 font-medium">Audited Statements</td>
                                        <td className="py-4 px-6 text-[#5a6a7a]">Regulatory compliance, investors, acquisitions</td>
                                        <td className="py-4 px-6 text-[#5a6a7a]">Full audit opinion + detailed disclosures</td>
                                    </tr>
                                </tbody>
                            </table>
                        </motion.div>
                    </motion.div>

                    {/* Specialized Statements */}
                    <motion.div variants={fadeIn}>
                        <h3 className="text-2xl font-bold text-[#0a2236] mb-6 flex items-center">
                            <span className="text-2xl mr-3">📊</span>{" "}
                            Specialized Statements
                        </h3>

                        <motion.div
                            variants={staggerContainer}
                            className="grid grid-cols-1 md:grid-cols-2 gap-8"
                        >
                            <motion.div variants={fadeIn} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                                <ul className="space-y-3 text-[#5a6a7a]">
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span><strong>Management Discussion & Analysis (MD&A):</strong> Interpret results with forward-looking insights</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span><strong>Consolidated Financials:</strong> For groups or multiple entities</span>
                                    </li>
                                </ul>
                            </motion.div>
                            <motion.div variants={fadeIn} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                                <h4 className="font-semibold text-[#0a2236] mb-3">Industry-Specific Reports:</h4>
                                <ul className="space-y-2 text-[#5a6a7a]">
                                    <li className="flex items-start">
                                        <span className="mr-2">→</span>
                                        <span><strong>Real Estate:</strong> Project-level profitability, occupancy metrics</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">→</span>
                                        <span><strong>Manufacturing:</strong> Cost of production, inventory turnover</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">→</span>
                                        <span><strong>NFPs:</strong> Fund-restricted reporting, T3010 support</span>
                                    </li>
                                </ul>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.section>

            {/* The Value We Deliver */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
                className="max-w-7xl mx-auto px-4 py-16"
            >
                <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-12 text-center">
                    The Value We Deliver
                </motion.h2>

                <motion.div
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
                >
                    {[
                        {
                            icon: <FaCheck className="text-2xl text-[#008db3] mb-4" />,
                            title: "CRA-Compliant & Lender-Ready",
                            desc: "Prepared under Canadian ASPE or IFRS standards—accepted by banks and regulators"
                        },
                        {
                            icon: <FaCheck className="text-2xl text-[#008db3] mb-4" />,
                            title: "Strategic Intelligence",
                            desc: "Benchmarking, trend analysis, and KPIs that reveal growth opportunities"
                        },
                        {
                            icon: <FaCheck className="text-2xl text-[#008db3] mb-4" />,
                            title: "Time & Cost Savings",
                            desc: "No more spreadsheet chaos. We handle data integration from your systems"
                        },
                        {
                            icon: <FaCheck className="text-2xl text-[#008db3] mb-4" />,
                            title: "Peace of Mind",
                            desc: "CPA-reviewed accuracy with proactive error detection"
                        }
                    ].map((item) => (
                        <motion.div
                            key={item.title}
                            variants={fadeInUpItem}
                            className="bg-white p-6 rounded-lg shadow-md border border-gray-100"
                        >
                            {item.icon}
                            <h3 className="text-xl font-semibold text-[#0a2236] mb-2">{item.title}</h3>
                            <p className="text-[#5a6a7a]">{item.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.blockquote
                    variants={fadeIn}
                    className="text-xl italic text-center max-w-3xl mx-auto"
                >
                    "We don't just report history—we help you write your future."
                </motion.blockquote>
            </motion.section>

            {/* Toolkit Section */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
                className="bg-[#f8fafc] py-16 px-4"
            >
                <div className="max-w-5xl mx-auto">
                    <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-8 text-center">
                        Your Financial Statement Toolkit
                    </motion.h2>
                    <motion.p variants={fadeIn} className="text-center text-[#5a6a7a] mb-12 max-w-3xl mx-auto">
                        What You Receive:
                    </motion.p>

                    <motion.div
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {[
                            "Balance Sheet",
                            "Income Statement",
                            "Cash Flow Statement",
                            "Notes to Financials",
                            "Custom KPIs",
                            "Executive Summary"
                        ].map((item, index) => (
                            <motion.div
                                key={item}
                                variants={fadeInUpItem}
                                whileHover={{ y: -5 }}
                                className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center"
                            >
                                <h3 className="text-xl font-semibold text-[#0a2236] mb-2">{item}</h3>
                                {index === 4 && <p className="text-[#5a6a7a]">(e.g., gross margin, ROI, liquidity ratios)</p>}
                                {index === 5 && <p className="text-[#5a6a7a]">(plain-English insights)</p>}
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.p
                        variants={fadeIn}
                        className="text-center mt-8 text-[#5a6a7a]"
                    >
                        + Bonus: Secure digital access via client portal.
                    </motion.p>
                </div>
            </motion.section>

            {/* Who We Serve */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
                className="max-w-7xl mx-auto px-4 py-16"
            >
                <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-12 text-center">
                    Who We Serve
                </motion.h2>

                <motion.div
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
                >
                    {[
                        {
                            title: "Startups",
                            desc: "Investor-ready financials for seed rounds"
                        },
                        {
                            title: "SMEs",
                            desc: "Monthly/quarterly packages for active management"
                        },
                        {
                            title: "Corporations",
                            desc: "Year-end statements for shareholders"
                        },
                        {
                            title: "Non-Profits",
                            desc: "T3010-compliant charitable reporting"
                        },
                        {
                            title: "Professionals",
                            desc: "Medical/dental practice performance dashboards"
                        }
                    ].map((item) => (
                        <motion.div
                            key={item.title}
                            variants={fadeInUpItem}
                            whileHover={{ scale: 1.03 }}
                            className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center"
                        >
                            <h3 className="text-xl font-semibold text-[#0a2236] mb-2">{item.title}</h3>
                            <p className="text-[#5a6a7a]">{item.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.section>

            {/* Our Process */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
                className="bg-gradient-to-r from-[#008db3] to-[#0a2236] text-white py-16 px-4"
            >
                <div className="max-w-7xl mx-auto">
                    <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold mb-12 text-center">
                        Our Process: Simple & Collaborative
                    </motion.h2>

                    <motion.div
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-4 gap-8"
                    >
                        {[
                            {
                                step: "1",
                                title: "Data Sync",
                                desc: "Connect your accounting software (or share files securely)"
                            },
                            {
                                step: "2",
                                title: "Analysis & Preparation",
                                desc: "We reconcile, analyze, and draft statements"
                            },
                            {
                                step: "3",
                                title: "Review & Refine",
                                desc: "Collaborative session to explain findings"
                            },
                            {
                                step: "4",
                                title: "Delivery & Support",
                                desc: "Receive final statements + 30-min strategy debrief"
                            }
                        ].map((item) => (
                            <motion.div
                                key={item.step}
                                variants={fadeInUpItem}
                                whileHover={{ scale: 1.05 }}
                                className="bg-white/10 p-6 rounded-lg backdrop-blur-sm text-center"
                            >
                                <div className="bg-white text-[#008db3] rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">{item.step}</div>
                                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                <p>{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.section>

            {/* CTA Section */}
            <motion.section
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-7xl mx-auto px-4 py-16"
            >
                <div className="bg-white rounded-xl shadow-xl p-8 md:p-12 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-6">
                        Ready for Financial Clarity?
                    </h2>
                    <div className="flex items-center justify-center text-[#008db3] mb-6">
                        <FaChevronRight className="mr-2" />
                        <a href="/contact" className="font-semibold">Limited Offer: Free Financial Health Check</a>
                    </div>
                    <p className="mb-8 max-w-2xl mx-auto">
                        We'll analyze your latest statements and identify:
                    </p>
                    <ul className="space-y-2 mb-8 max-w-md mx-auto text-left">
                        <li className="flex items-center">
                            <FaChevronRight className="mr-2 text-sm" />
                            3 opportunities to improve profitability
                        </li>
                        <li className="flex items-center">
                            <FaChevronRight className="mr-2 text-sm" />
                            1 critical compliance risk
                        </li>
                        <li className="flex items-center">
                            <FaChevronRight className="mr-2 text-sm" />
                            Custom reporting package recommendation
                        </li>
                    </ul>
                </div>
            </motion.section>

            {/* Trust Builders */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
                className="max-w-7xl mx-auto px-4 py-16"
            >
                <motion.div
                    variants={staggerContainer}
                    className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12"
                >
                    <motion.div variants={fadeIn} className="text-center md:text-left">
                        <p className="text-2xl font-bold text-[#0a2236]">1,200+ financial statements prepared</p>
                        <p className="text-xl text-[#5a6a7a]">98% client retention</p>
                    </motion.div>
                    <motion.div variants={fadeIn} className="bg-white p-6 rounded-lg shadow-md max-w-md">
                        <p className="text-sm text-[#5a6a7a] italic mb-2">Authority Note:</p>
                        <p className="font-semibold text-[#0a2236]">"Founded by Sanjeev Garg, Accountant and bookkeeper with 6+ years specializing in Canadian financial reporting."</p>
                    </motion.div>
                </motion.div>

                <motion.div
                    variants={fadeIn}
                    className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto"
                >
                    <p className="text-sm text-[#5a6a7a] italic text-center">
                        *Financial statement services do not include audit or assurance unless specified. Past performance not indicative of future results.
                    </p>
                </motion.div>
            </motion.section>

            {/* FAQ Section */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
                className="max-w-4xl mx-auto px-4 py-16"
            >
                <motion.h2 variants={fadeIn} className="text-3xl font-bold text-[#0a2236] mb-8 text-center">
                    Frequently Asked Questions
                </motion.h2>

                <motion.div
                    variants={staggerContainer}
                    className="space-y-4"
                >
                    {faqs.map((item, index) => {
                        const isOpen = openFaq === index;
                        return (
                            <motion.div
                                key={item.q}
                                variants={fadeIn}
                                className="border-b border-gray-200 pb-4"
                            >
                                <button
                                    className="w-full flex justify-between items-center text-left font-semibold text-lg py-4 focus:outline-none"
                                    onClick={() => setOpenFaq(isOpen ? null : index)}
                                >
                                    <span>{item.q}</span>
                                    <motion.div
                                        animate={{ rotate: isOpen ? 90 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <FaChevronRight className="ml-2" />
                                    </motion.div>
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="text-[#5a6a7a] pb-4">{item.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </motion.section>

            <Footer />
        </div>
    );
}