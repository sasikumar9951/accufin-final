"use client";
import { FaChevronRight, FaArrowRight } from "react-icons/fa";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import BusinessCompliances from "@/app/_component/BusinessCompliance";
import { useState, useRef } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { motion, useInView } from "framer-motion";

const complianceFaqs = [
    {
        q: "Can you handle nationwide compliance?",
        a: "Yes! We support businesses across all Canadian provinces.",
    },
    {
        q: "What if I've missed filings for years?",
        a: "We specialize in compliance catch-up and CRA/WSIB negotiations.",
    },
    {
        q: "Do you provide registered office addresses?",
        a: "Yes—included in our corporate annual plans.",
    },
];

export default function BusinessCompliancesPage() {

    const [open, setOpen] = useState<number | null>(null);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "0px 0px -100px 0px" });

    const renderFaqs = (faqs: typeof complianceFaqs) =>
        faqs.map((item, index) => {
            const isOpen = open === index;

            return (
                <div key={item.q} className="mb-4">
                    <button
                        className={`w-full flex items-center justify-between rounded-lg px-6 py-4 text-left font-semibold text-lg focus:outline-none transition border ${isOpen
                                ? "bg-white text-[#0082a3] border-white"
                                : "bg-transparent text-white border-white"
                            }`}
                        onClick={() => setOpen(isOpen ? null : index)}
                    >
                        <span>{item.q}</span>
                        <MdKeyboardArrowDown
                            className={`ml-2 text-2xl transition-transform ${isOpen ? "rotate-180" : ""
                                }`}
                        />
                    </button>
                    <div
                        className={`overflow-hidden transition-all duration-300 px-6 ${isOpen ? "max-h-40 py-4" : "max-h-0 py-0"
                            }`}
                    >
                        <p className="text-cyan-100 text-base">{item.a}</p>
                    </div>
                </div>
            );
        });

    return (
        <div className="bg-white">
            <Navbar />
            <BusinessCompliances />
            {/* Hero Section */}
            <section className="relative text-white py-20 px-4">
                <div className="max-w-6xl text-center text-black flex items-baseline-last justify-center flex-col">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Why Compliance Matters in Canada</h1>
                    <p className="text-xl mb-8 max-w-3xl">
                        "72% of small businesses face penalties for missed filings. Don't be one of them."
                    </p>
                    <div className="bg-[#008db3] text-white inline-block px-6 py-3 rounded-lg">
                        <p className="font-semibold">We handle the details so you avoid:</p>
                        <ul className="text-left mt-2 space-y-1">
                            <li className="flex items-center">
                                <FaChevronRight className="mr-2 text-sm" />
                                CRA fines
                            </li>
                            <li className="flex items-center">
                                <FaChevronRight className="mr-2 text-sm" />
                                Revoked licenses
                            </li>
                            <li className="flex items-center">
                                <FaChevronRight className="mr-2 text-sm" />
                                Operational shutdowns
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 space-y-16">

                {/* Full Suite of Solutions */}
                <section>
                    <h2 className="text-3xl font-bold text-[#0a2236] mb-8 text-center">
                        Our Full Suite of Solutions
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Business Formation */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="flex items-center mb-4">
                                <span className="text-2xl mr-3">🚀</span>
                                <h3 className="text-xl font-semibold text-[#0a2236]">Business Formation & Registration</h3>
                            </div>
                            <ul className="space-y-2 text-[#5a6a7a]">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Business Structure Guidance: Proprietorship vs. Incorporation</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Name Registration & Name alteration support</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>CRA Business Number (BN) Setup</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Provincial Registrations</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Startup Advisory: Share structure, minute books</span>
                                </li>
                            </ul>
                        </div>

                        {/* Annual Compliance */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="flex items-center mb-4">
                                <span className="text-2xl mr-3">📅</span>
                                <h3 className="text-xl font-semibold text-[#0a2236]">Annual Compliance & Filings</h3>
                            </div>
                            <ul className="space-y-2 text-[#5a6a7a]">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Corporate Annual Returns (federal + provincial)</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Minute Book Maintenance</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Registered Office Services</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Director Change Filings</span>
                                </li>
                            </ul>
                        </div>

                        {/* WorkSafeBC */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="flex items-center mb-4">
                                <span className="text-2xl mr-3">🛡️</span>
                                <h3 className="text-xl font-semibold text-[#0a2236]">WorkSafeBC / WSIB Compliance</h3>
                            </div>
                            <ul className="space-y-2 text-[#5a6a7a]">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Initial Account Registration</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Payroll Reporting & Premium Calculations</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Audit Support & Dispute Resolution</span>
                                </li>
                            </ul>
                        </div>

                        {/* Ongoing Compliance */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="flex items-center mb-4">
                                <span className="text-2xl mr-3">⚖️</span>
                                <h3 className="text-xl font-semibold text-[#0a2236]">Ongoing Business Compliance</h3>
                            </div>
                            <ul className="space-y-2 text-[#5a6a7a]">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>CRA Filings: T4s, T5s, T5018, NR4s</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Industry-Specific Licensing</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Privacy Law Compliance (PIPEDA)</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Payroll Standards (Federal/Provincial)</span>
                                </li>
                            </ul>
                        </div>

                        {/* Strategic Advisory */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <div className="flex items-center mb-4">
                                <span className="text-2xl mr-3">📈</span>
                                <h3 className="text-xl font-semibold text-[#0a2236]">Strategic Business Advisory</h3>
                            </div>
                            <ul className="space-y-2 text-[#5a6a7a]">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Financial Forecasting & Budgeting</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Profitability Optimization</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Succession Planning & Exit Strategies</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>M&A Due Diligence Support</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Industries We Serve */}
                <section>
                    <h2 className="text-3xl font-bold text-[#0a2236] mb-8 text-center">
                        Industries We Serve
                    </h2>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden">
                            <thead className="bg-[#008db3] text-white">
                                <tr>
                                    <th className="text-left py-4 px-6">Industry</th>
                                    <th className="text-left py-4 px-6">Key Compliance Pain Points We Solve</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <tr className="hover:bg-gray-50">
                                    <td className="py-4 px-6 font-medium">Construction</td>
                                    <td className="py-4 px-6 text-[#5a6a7a]">WSIB, T5018 slips, lien holdbacks, contract compliance</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="py-4 px-6 font-medium">Retail/Hospitality</td>
                                    <td className="py-4 px-6 text-[#5a6a7a]">Municipal licensing, sales tax nexus, inventory reporting</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="py-4 px-6 font-medium">Tech Startups</td>
                                    <td className="py-4 px-6 text-[#5a6a7a]">SR&ED documentation, stock option reporting, investor compliance</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="py-4 px-6 font-medium">Healthcare</td>
                                    <td className="py-4 px-6 text-[#5a6a7a]">Professional corporation rules, health privacy (PHIPA)</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="py-4 px-6 font-medium">Non-Profits</td>
                                    <td className="py-4 px-6 text-[#5a6a7a]">T3010 filings, donation receipts, charity status maintenance</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {[
                            { industry: "Construction", points: "WSIB, T5018 slips, lien holdbacks, contract compliance" },
                            { industry: "Retail/Hospitality", points: "Municipal licensing, sales tax nexus, inventory reporting" },
                            { industry: "Tech Startups", points: "SR&ED documentation, stock option reporting, investor compliance" },
                            { industry: "Healthcare", points: "Professional corporation rules, health privacy (PHIPA)" },
                            { industry: "Non-Profits", points: "T3010 filings, donation receipts, charity status maintenance" }
                        ].map((item) => (
                            <div key={item.industry} className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="font-bold text-[#0a2236] text-lg mb-2">{item.industry}</h3>
                                <p className="text-[#5a6a7a]">{item.points}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* The Difference Section */}
                <section className="bg-gradient-to-r from-[#008db3] to-[#0a2236] text-white rounded-xl p-8 md:p-12">
                    <h2 className="text-3xl font-bold mb-8 text-center">
                        The Accufin Difference
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <ul className="space-y-6">
                                <li className="flex items-start">
                                    <span className="bg-white text-[#008db3] rounded-full w-6 h-6 flex items-center justify-center mr-4 mt-1">✓</span>
                                    <div>
                                        <h3 className="font-bold text-lg">Single-Point Accountability</h3>
                                        <p>One partner for all compliance needs—no juggling multiple providers.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-white text-[#008db3] rounded-full w-6 h-6 flex items-center justify-center mr-4 mt-1">✓</span>
                                    <div>
                                        <h3 className="font-bold text-lg">Canadian Expertise</h3>
                                        <p>Province-specific knowledge (BC WorkSafe, New Brunswick WSIB, and other provincial regulations).</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <ul className="space-y-6">
                                <li className="flex items-start">
                                    <span className="bg-white text-[#008db3] rounded-full w-6 h-6 flex items-center justify-center mr-4 mt-1">✓</span>
                                    <div>
                                        <h3 className="font-bold text-lg">Proactive Calendar Management</h3>
                                        <p>We track deadlines, so you never miss a filing.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-white text-[#008db3] rounded-full w-6 h-6 flex items-center justify-center mr-4 mt-1">✓</span>
                                    <div>
                                        <h3 className="font-bold text-lg">Technology-Driven</h3>
                                        <p>Secure client portal for document access and reminders.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <blockquote className="mt-12 text-center text-xl italic max-w-3xl mx-auto">
                        "We're not just advisors—we're your compliance insurance."
                    </blockquote>
                </section>

                {/* 3-Step Process */}
                <section>
                    <h2 className="text-3xl font-bold text-[#0a2236] mb-8 text-center">
                        Simple 3-Step Process
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                            <div className="bg-[#008db3] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                            <h3 className="text-xl font-semibold text-[#0a2236] mb-2">Assess</h3>
                            <p className="text-[#5a6a7a]">Free compliance gap analysis</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                            <div className="bg-[#008db3] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                            <h3 className="text-xl font-semibold text-[#0a2236] mb-2">Implement</h3>
                            <p className="text-[#5a6a7a]">We handle registrations/filings</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                            <div className="bg-[#008db3] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                            <h3 className="text-xl font-semibold text-[#0a2236] mb-2">Monitor</h3>
                            <p className="text-[#5a6a7a]">Ongoing support + bi-annual reviews</p>
                        </div>
                    </div>
                </section>

                {/* Penalty Comparison */}
                <section>
                    <h2 className="text-3xl font-bold text-[#0a2236] mb-8 text-center">
                        Avoid Costly Oversights
                    </h2>

                    <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto">
                        <table className="min-w-full">
                            <thead className="bg-[#008db3] text-white">
                                <tr>
                                    <th className="text-left py-4 px-6">Missed Filing</th>
                                    <th className="text-left py-4 px-6">Potential Penalty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <tr className="hover:bg-gray-50">
                                    <td className="py-4 px-6 font-medium">Corporate Annual Return</td>
                                    <td className="py-4 px-6 text-[#5a6a7a]">$400+ (dissolution risk)</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="py-4 px-6 font-medium">T4 Summary (CRA)</td>
                                    <td className="py-4 px-6 text-[#5a6a7a]">$2,500+</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="py-4 px-6 font-medium">WorkSafeBC Payroll Report</td>
                                    <td className="py-4 px-6 text-[#5a6a7a]">10–100% of premiums</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="py-4 px-6 font-medium">GST/HST Return</td>
                                    <td className="py-4 px-6 text-[#5a6a7a]">5–10% of owed tax</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="bg-[#0a2236] text-white rounded-xl p-8 md:p-12 text-center">
                    <h2 className="text-3xl font-bold mb-6">Ready to Offload Compliance?</h2>
                    <a href="/contact" className="flex items-center justify-center text-[#00c6fb] mb-6">
                        <FaArrowRight className="mr-2" />
                        <span className="font-semibold">Free Compliance Health Check</span>
                    </a>
                    <p className="mb-8 max-w-2xl mx-auto">
                        We'll review your business structure, licenses, and filings to identify:
                    </p>
                    <ul className="space-y-2 mb-8 max-w-md mx-auto text-left">
                        <li className="flex items-center">
                            <FaChevronRight className="mr-2 text-sm" />
                            3 critical compliance risks
                        </li>
                        <li className="flex items-center">
                            <FaChevronRight className="mr-2 text-sm" />
                            2 cost-saving opportunities
                        </li>
                        <li className="flex items-center">
                            <FaChevronRight className="mr-2 text-sm" />
                            1 actionable step to reduce admin
                        </li>
                    </ul>
                    {/* <button className="bg-[#00c6fb] hover:bg-[#008db3] text-white font-bold py-3 px-8 rounded-lg transition duration-300">
                        Get Your Free Assessment
                    </button> */}
                </section>
                

                {/* Why Clients Trust Us */}
                <section>
                    <h2 className="text-3xl font-bold text-[#0a2236] mb-8 text-center">
                        Why Clients Trust Us
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                            <h3 className="text-xl font-semibold text-[#0a2236] mb-2">Fixed-Fee Packages</h3>
                            <p className="text-[#5a6a7a]">No surprises (e.g., "Full Compliance Retainer: From $299/mo")</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                            <h3 className="text-xl font-semibold text-[#0a2236] mb-2">100% Canadian Focus</h3>
                            <p className="text-[#5a6a7a]">Dedicated to Canadian business compliance</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
                            <h3 className="text-xl font-semibold text-[#0a2236] mb-2">Proactive Alerts</h3>
                            <p className="text-[#5a6a7a]">Never miss a deadline again</p>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                {/* <section className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-[#0a2236] mb-8 text-center">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-6">
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-xl font-semibold text-[#0a2236] mb-2">Can you handle nationwide compliance?</h3>
                            <p className="text-[#5a6a7a]">Yes! We support businesses across all Canadian provinces.</p>
                        </div>
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-xl font-semibold text-[#0a2236] mb-2">What if I've missed filings for years?</h3>
                            <p className="text-[#5a6a7a]">We specialize in compliance catch-up and CRA/WSIB negotiations.</p>
                        </div>
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-xl font-semibold text-[#0a2236] mb-2">Do you provide registered office addresses?</h3>
                            <p className="text-[#5a6a7a]">Yes—included in our corporate annual plans.</p>
                        </div>
                    </div>
                </section> */}

                <section className="bg-[#0082a3] text-white py-5 mb-5 rounded-2xl">
                    <motion.div
                        ref={ref}
                        initial={{ opacity: 0, y: 50 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="max-w-6xl mx-auto">
                            <div className="mb-12 text-center">
                                <div className="uppercase tracking-widest text-cyan-200 mb-1 text-xl">FAQ</div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-4">Compliance Questions</h2>
                                <p className="text-cyan-100 text-sm md:text-base max-w-2xl mx-auto">
                                    Get answers to common questions about our business compliance services.
                                </p>
                            </div>

                            <div className="max-w-3xl mx-auto max-sm:ml-3 max-sm:mr-3">
                                {renderFaqs(complianceFaqs)}
                            </div>
                        </div>
                    </motion.div>
                </section>


            </div>

            <Footer />
        </div>
    );
}