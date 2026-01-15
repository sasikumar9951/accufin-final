"use client";
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FaChevronRight, FaCheck, FaTimes } from "react-icons/fa";
import Link from "next/link";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";

export default function TaxPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    const faqs = [
        {
            q: "How much do tax planning services cost?",
            a: "Fees start at $100 for an annual plan. We provide fixed-price proposals after your assessment."
        },
        {
            q: "Is tax planning only for the wealthy?",
            a: "No! Canadians at all income levels benefit—especially business owners, investors, and retirees."
        },
        {
            q: "Can you help if I've already filed my return?",
            a: "Yes. We amend prior returns (up to 3 years) to claim missed deductions."
        }
    ];

    return (
        <div className="bg-white">
            <Navbar />

            {/* Hero Section */}
            <section
                className="relative w-full h-[320px] flex flex-col justify-center"
                style={{
                    backgroundImage: "url('/tax.jpg')",
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
                        Strategic Tax Planning Services in Canada
                    </h1>
                    <div className="flex items-center space-x-2 text-lg">
                        <Link href="/" className="text-[#00c6fb] hover:underline">Home</Link>
                        <span className="text-white">/</span>
                        <Link href="/services" className="text-[#00c6fb] hover:underline">Services</Link>
                        <span className="text-white">/</span>
                        <span className="text-white">Tax Planning</span>
                    </div>
                </motion.div>
            </section>

            {/* Intro Section */}
            <section className="max-w-7xl mx-auto px-4 py-16 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-6">
                    Stop overpaying taxes. Start proactively shaping your financial future.
                </h2>
                <p className="text-xl text-[#5a6a7a] max-w-4xl mx-auto">
                    At Accufin, we go beyond tax preparation. Our specialized Canadian tax planning services help businesses and individuals legally reduce tax burdens, leverage government incentives, and build lasting wealth—all while ensuring full CRA compliance.
                </p>
            </section>

            {/* Why Tax Planning Matters */}
            <section className="bg-[#f8fafc] py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-6">
                            Why Proactive Tax Planning Matters
                        </h2>
                        <blockquote className="text-xl italic max-w-3xl mx-auto">
                            "Failing to plan is planning to fail. With Canada's complex tax laws (including provincial variations), strategic planning can save you thousands annually while preventing costly surprises."
                        </blockquote>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-xl font-semibold text-[#0a2236] mb-4 flex items-center">
                                <FaTimes className="text-red-500 mr-2" />
                                Without Tax Planning
                            </h3>
                            <ul className="space-y-3 text-[#5a6a7a]">
                                <li className="flex items-start">
                                    <FaTimes className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Reactive year-end scrambling</span>
                                </li>
                                <li className="flex items-start">
                                    <FaTimes className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Missed deductions/credits</span>
                                </li>
                                <li className="flex items-start">
                                    <FaTimes className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Cash flow surprises</span>
                                </li>
                                <li className="flex items-start">
                                    <FaTimes className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Generic advice</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-xl font-semibold text-[#0a2236] mb-4 flex items-center">
                                <FaCheck className="text-green-500 mr-2" />
                                With Our Tax Planning
                            </h3>
                            <ul className="space-y-3 text-[#5a6a7a]">
                                <li className="flex items-start">
                                    <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Year-round proactive strategy</span>
                                </li>
                                <li className="flex items-start">
                                    <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Maximized savings opportunities</span>
                                </li>
                                <li className="flex items-start">
                                    <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Tax liability forecasting</span>
                                </li>
                                <li className="flex items-start">
                                    <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                                    <span>Personalized roadmap</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solutions Section */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-12 text-center">
                    Our Canadian Tax Planning Solutions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* For Businesses */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                        <div className="flex items-center mb-4">
                            <span className="text-2xl mr-3">📊</span>
                            <h3 className="text-xl font-semibold text-[#0a2236]">For Businesses</h3>
                        </div>
                        <ul className="space-y-2 text-[#5a6a7a]">
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Corporate Structure Optimization: Ensure tax-efficient incorporation/shareholder arrangements</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Small Business Deductions: Maximize the Canadian Small Business Deduction (SBD) and SR&ED credits</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Income Splitting: Legally distribute income to family members at lower tax rates</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Capital Gains Strategies: Plan asset sales/dispositions to minimize taxes</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Succession Planning: Tax-efficient ownership transfers or exit strategies</span>
                            </li>
                        </ul>
                    </div>

                    {/* For Individuals & Families */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                        <div className="flex items-center mb-4">
                            <span className="text-2xl mr-3">👨‍👩‍👧</span>
                            <h3 className="text-xl font-semibold text-[#0a2236]">For Individuals & Families</h3>
                        </div>
                        <ul className="space-y-2 text-[#5a6a7a]">
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Investment Tax Efficiency: TFSA vs. RRSP vs. non-registered account optimization</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Retirement Income Planning: RRSP/RRIF withdrawal sequencing & pension splitting</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Capital Gains Exemptions: Leverage the Lifetime Capital Gains Exemption (LCGE)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Estate Planning: Minimize probate fees and estate taxes through trusts/gifting</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Cross-Border Planning: Solutions for US/Canada tax complexities</span>
                            </li>
                        </ul>
                    </div>

                    {/* Specialized Services */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                        <div className="flex items-center mb-4">
                            <span className="text-2xl mr-3">🚀</span>
                            <h3 className="text-xl font-semibold text-[#0a2236]">Specialized Services</h3>
                        </div>
                        <ul className="space-y-2 text-[#5a6a7a]">
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Real Estate Investor Tax Strategies</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Medical/Professional Corporation Planning</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>CRA Audit Defense & Voluntary Disclosures</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Value Proposition */}
            <section className="bg-gradient-to-r from-[#008db3] to-[#0a2236] text-white py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
                        How We Deliver Value
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                            <FaCheck className="text-2xl mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Deep CRA Compliance Knowledge</h3>
                            <p>Federal + provincial tax laws (AB, BC, ON, QC, etc.)</p>
                        </div>
                        <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                            <FaCheck className="text-2xl mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Holistic Approach</h3>
                            <p>Integrates with your financial/business goals</p>
                        </div>
                        <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                            <FaCheck className="text-2xl mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Proactive Calendar</h3>
                            <p>Quarterly reviews to adapt to life/tax law changes</p>
                        </div>
                        <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                            <FaCheck className="text-2xl mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Technology-Driven</h3>
                            <p>Scenario modeling using leading tax software (DT Max, TaxCycle, etc.)</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <div className="bg-white rounded-xl shadow-xl p-8 md:p-12 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-6">
                        Ready to Optimize Your Tax Strategy?
                    </h2>
                    <p className="mb-8 max-w-2xl mx-auto">
                        Book a free consultation to discover how much you could be saving with proactive tax planning.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-block bg-[#00c6fb] hover:bg-[#008db3] text-white font-bold py-3 px-8 rounded-lg transition duration-300"
                    >
                        Schedule Your Free Consultation
                    </Link>
                </div>
            </section>

            {/* Compliance Notes */}
            <section className="max-w-4xl mx-auto px-4 py-8 text-center">
                <p className="text-sm text-[#5a6a7a] italic mb-2">
                    "Tax planning is 100% legal and encouraged by the CRA when compliant with the Income Tax Act. We do not engage in aggressive tax avoidance schemes."
                </p>
                <p className="text-sm text-[#5a6a7a] italic">
                    "Results vary based on individual circumstances. Past savings are not guarantees of future outcomes."
                </p>
            </section>

            {/* FAQ Section */}
            <section className="max-w-4xl mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-[#0a2236] mb-8 text-center">
                    Frequently Asked Questions
                </h2>

                <div className="space-y-4">
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
            </section>

            <Footer />
        </div>
    );
}