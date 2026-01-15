"use client";
import Link from "next/link";
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FaChevronRight, FaCheck, FaTimes } from "react-icons/fa";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";


export default function AuditAssurance() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    // FAQ state
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const faqs = [
        {
            q: "How much does an audit cost?",
            a: "Fees depend on complexity. Contact us for a fixed-fee quote."
        },
        {
            q: "Can you help if I'm behind on filings?",
            a: "Yes! We expedite prior-year audits and liaise with CRA."
        }
    ];

    return (
        <div className="bg-white">
            <Navbar />

            {/* Hero Section */}
            <section
                className="relative w-full h-[320px] flex flex-col justify-center"
                style={{
                    backgroundImage: "url('/audit-assurance.jpg')",
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
                        Audit & Assurance Services
                    </h1>
                    <div className="flex items-center space-x-2 text-lg">
                        <Link href="/" className="text-[#00c6fb] hover:underline">Home</Link>
                        <span className="text-white">/</span>
                        <Link href="/services" className="text-[#00c6fb] hover:underline">Services</Link>
                        <span className="text-white">/</span>
                        <span className="text-white">Audit & Assurance</span>
                    </div>
                </motion.div>
            </section>

            {/* Intro Section */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-6">
                        Go beyond compliance. Gain confidence.
                    </h2>
                    <p className="text-xl text-[#5a6a7a] max-w-4xl mx-auto">
                        At Accufin, we deliver rigorous, insightful audit and assurance services tailored to Canadian businesses. Whether you need statutory compliance, lender requirements, or stakeholder assurance, we provide clarity that empowers smarter decisions and safeguards your reputation.
                    </p>
                </div>

                {/* Why Audits Matter */}
                <div className="bg-[#f8fafc] rounded-xl p-8 md:p-12 mb-16">
                    <h3 className="text-2xl md:text-3xl font-bold text-[#0a2236] mb-8 text-center">
                        Why Audits Matter in Canada
                    </h3>
                    <blockquote className="text-xl italic text-center mb-12 max-w-3xl mx-auto">
                        "In an era of heightened scrutiny, audits aren't just a requirement—they're a competitive advantage. We transform complex financial scrutiny into actionable intelligence."
                    </blockquote>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h4 className="text-xl font-semibold text-[#0a2236] mb-4 flex items-center">
                                <FaTimes className="text-red-500 mr-2" />
                                Without Quality Assurance
                            </h4>
                            <ul className="space-y-3 text-[#5a6a7a]">
                                <li className="flex items-start">
                                    <FaTimes className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Regulatory compliance risks</span>
                                </li>
                                <li className="flex items-start">
                                    <FaTimes className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Unreported financial errors</span>
                                </li>
                                <li className="flex items-start">
                                    <FaTimes className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Stakeholder/lender distrust</span>
                                </li>
                                <li className="flex items-start">
                                    <FaTimes className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Missed operational insights</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h4 className="text-xl font-semibold text-[#0a2236] mb-4 flex items-center">
                                <FaCheck className="text-green-500 mr-2" />
                                With Our Audit Services
                            </h4>
                            <ul className="space-y-3 text-[#5a6a7a]">
                                <li className="flex items-start">
                                    <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>CRA, CAS & CPA Canada compliance</span>
                                </li>
                                <li className="flex items-start">
                                    <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Material misstatement detection</span>
                                </li>
                                <li className="flex items-start">
                                    <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Enhanced credibility & trust</span>
                                </li>
                                <li className="flex items-start">
                                    <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Strategic recommendations</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Solutions Section */}
                <div className="mb-16">
                    <h3 className="text-2xl md:text-3xl font-bold text-[#0a2236] mb-8 text-center">
                        Our Canadian Audit & Assurance Solutions
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Financial Statement Audits */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="flex items-center mb-4">
                                <span className="text-2xl mr-3">🔍</span>
                                <h4 className="text-xl font-semibold text-[#0a2236]">Financial Statement Audits</h4>
                            </div>
                            <ul className="space-y-2 text-[#5a6a7a]">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Statutory Compliance: Meet Canada Business Corporations Act (CBCA), CRA, or provincial requirements</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Lender/Investor Ready: Audits accepted by banks, VC firms, and grant agencies</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Internal Controls Review: Identify weaknesses in financial processes</span>
                                </li>
                            </ul>
                        </div>

                        {/* Review Engagements */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="flex items-center mb-4">
                                <span className="text-2xl mr-3">📈</span>
                                <h4 className="text-xl font-semibold text-[#0a2236]">Review Engagements</h4>
                            </div>
                            <ul className="space-y-2 text-[#5a6a7a]">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Cost-effective alternative to full audits for private businesses</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Provides "negative assurance" under CSRE 2400 standards</span>
                                </li>
                            </ul>
                        </div>

                        {/* Specialized Assurance */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="flex items-center mb-4">
                                <span className="text-2xl mr-3">🏢</span>
                                <h4 className="text-xl font-semibold text-[#0a2236]">Specialized Assurance Services</h4>
                            </div>
                            <ul className="space-y-2 text-[#5a6a7a]">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Employee Benefit Plan (EBP) Audits: Meet pension/benefit regulations</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Agreed-Upon Procedures (AUP): Custom verification for acquisitions, contracts, or disputes</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Internal Audit Outsourcing: Proactive risk management</span>
                                </li>
                            </ul>
                        </div>

                        {/* Industry Expertise */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="flex items-center mb-4">
                                <span className="text-2xl mr-3">🌐</span>
                                <h4 className="text-xl font-semibold text-[#0a2236]">Industry-Specific Expertise</h4>
                            </div>
                            <ul className="space-y-2 text-[#5a6a7a]">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Real Estate & Construction: Project cost audits, WIP reporting</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Manufacturing & Distribution: Inventory valuation assurance</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* The Accufin Difference */}
                <div className="bg-gradient-to-r from-[#008db3] to-[#0a2236] text-white rounded-xl p-8 md:p-12 mb-16">
                    <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center">
                        The Accufin Difference
                    </h3>
                    <h4 className="text-xl font-semibold mb-6 text-center">
                        We Don't Just Audit—We Advise:
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <FaCheck className="mt-1 mr-3 flex-shrink-0" />
                                <span>Proactive Risk Mitigation: Fraud detection & control gap analysis</span>
                            </li>
                            <li className="flex items-start">
                                <FaCheck className="mt-1 mr-3 flex-shrink-0" />
                                <span>Technology-Driven: Data analytics (IDEA, ACL) for precision sampling</span>
                            </li>
                        </ul>
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <FaCheck className="mt-1 mr-3 flex-shrink-0" />
                                <span>Business Insights: Clear reports with strategic recommendations</span>
                            </li>
                            <li className="flex items-start">
                                <FaCheck className="mt-1 mr-3 flex-shrink-0" />
                                <span>Relationship Focus: Dedicated partner—not just an auditor</span>
                            </li>
                        </ul>
                    </div>

                    <blockquote className="mt-12 text-center italic max-w-3xl mx-auto">
                        "Your audit shouldn't be a painful annual event. We make it collaborative, efficient, and valuable."
                    </blockquote>
                </div>

                {/* Our Process */}
                <div className="mb-16">
                    <h3 className="text-2xl md:text-3xl font-bold text-[#0a2236] mb-8 text-center">
                        Our Process: Transparent & Stress-Reduced
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="bg-[#008db3] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                            <h4 className="text-xl font-semibold text-[#0a2236] mb-2 text-center">Scoping & Planning</h4>
                            <p className="text-[#5a6a7a] text-center">Understand your goals, risks, and timelines</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="bg-[#008db3] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                            <h4 className="text-xl font-semibold text-[#0a2236] mb-2 text-center">Fieldwork & Analysis</h4>
                            <p className="text-[#5a6a7a] text-center">Meticulous testing using advanced tools (minimal disruption)</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="bg-[#008db3] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                            <h4 className="text-xl font-semibold text-[#0a2236] mb-2 text-center">Reporting & Debrief</h4>
                            <p className="text-[#5a6a7a] text-center">Clear audit opinion + management letter with actionable insights</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="bg-[#008db3] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
                            <h4 className="text-xl font-semibold text-[#0a2236] mb-2 text-center">Post-Audit Support</h4>
                            <p className="text-[#5a6a7a] text-center">Help implementing recommendations</p>
                        </div>
                    </div>
                </div>

                {/* Who Trusts Us */}
                <div className="mb-16">
                    <h3 className="text-2xl md:text-3xl font-bold text-[#0a2236] mb-8 text-center">
                        Who Trusts Our Assurance Services?
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                            <h4 className="text-xl font-semibold text-[#0a2236] mb-2">Private Companies</h4>
                            <p className="text-[#5a6a7a]">Meeting shareholder/lender requirements</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                            <h4 className="text-xl font-semibold text-[#0a2236] mb-2">Non-Profits & Charities</h4>
                            <p className="text-[#5a6a7a]">CRA compliance & donor confidence</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                            <h4 className="text-xl font-semibold text-[#0a2236] mb-2">Public Sector Entities</h4>
                            <p className="text-[#5a6a7a]">Compliance with Canadian auditing standards</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                            <h4 className="text-xl font-semibold text-[#0a2236] mb-2">Growing Startups</h4>
                            <p className="text-[#5a6a7a]">Preparing for funding or sale</p>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-[#0a2236] text-white rounded-xl p-8 md:p-12 mb-16 text-center">
                    <h3 className="text-2xl md:text-3xl font-bold mb-6">Ready for Confidence in Your Financials?</h3>
                    <div className="flex items-center justify-center text-[#00c6fb] mb-6">
                        <FaChevronRight className="mr-2" />
                        <span className="font-semibold">Limited Offer: Free Audit Readiness Assessment</span>
                    </div>
                    <p className="mb-8 max-w-2xl mx-auto">
                        We'll review your current controls and identify 3 opportunities to streamline your next audit.
                    </p>
                    <a
                        href="/contact"
                        className="w-fit block sm:w-auto text-center text-wrap bg-[#00c6fb] hover:bg-[#008db3] text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition duration-300 text-sm sm:text-base md:text-lg"
                    >
                        Claim Your Free Assessment
                    </a>

                    <p className="mt-6 text-sm text-gray-300">
                        *Audit services do not include assurance on future results or detect all fraud. Licensing requirements vary by province.
                    </p>
                </div>

                {/* FAQ Section */}
                <div className="bg-[#f8fafc] rounded-xl p-8 md:p-12">
                    <h3 className="text-2xl md:text-3xl font-bold text-[#0a2236] mb-8 text-center">
                        Frequently Asked Questions
                    </h3>

                    <div className="max-w-2xl mx-auto space-y-4">
                        {faqs.map((item, index) => {
                            const isOpen = openFaq === index;
                            return (
                                <div key={item.q} className="border-b border-gray-200 pb-4">
                                    <button
                                        className="w-full flex justify-between items-center text-left font-semibold text-lg py-4 focus:outline-none"
                                        onClick={() => setOpenFaq(isOpen ? null : index)}
                                    >
                                        <span>{item.q}</span>
                                        <FaChevronRight className={`ml-2 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 pb-4' : 'max-h-0'}`}>
                                        <p className="text-[#5a6a7a]">{item.a}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}