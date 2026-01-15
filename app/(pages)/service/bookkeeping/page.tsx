"use client";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import BookkeepingService from "@/app/_component/bookkeepingServices";
import { useState } from "react";
import { FaChevronRight, FaArrowRight, FaCalendarAlt, FaSearchDollar, FaCogs } from "react-icons/fa";

interface AccordionItem {
    title: string;
    content: string;
    hasCheckmark?: boolean;
}

interface ServiceItem {
    businessType: string;
    solution: string;
}


export default function BookkeepingPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const items: AccordionItem[] = [
        {
            title: 'CRA-Compliant Expertise',
            content: 'We master Canadian tax laws (GST/HST, payroll, T4s) so you avoid penalties and sleep soundly.'
        },
        {
            title: 'Real-Time Financial Visibility',
            content: 'Access clean, up-to-date books 24/7 via cloud platforms like QuickBooks Online, Xero, or Wave.'
        },
        {
            title: 'Cost-Effective Precision',
            content: 'Save 10+ hours/month and eliminate costly errors with our meticulous record-keeping.',
            hasCheckmark: true
        },
        {
            title: 'Small Business Specialists',
            content: 'We speak your language—no corporate jargon, just solutions built for your needs.'
        }
    ];

    const services: ServiceItem[] = [
        { businessType: "Startups", solution: "Establish scalable systems from Day 1" },
        { businessType: "Small Businesses", solution: "Free owners from DIY bookkeeping stress" },
        { businessType: "E-commerce", solution: "Manage multi-channel sales & platform integrations" },
        { businessType: "Contractors/Trades", solution: "Track project costs & job profitability" }
    ];

    const toggleItem = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };
    
    return (
        <div>
            <Navbar />
            {/* <Cases2 /> */}
            <BookkeepingService />
            <div className="bg-white pb-10  ">
                {/* Hero Section */}
                <div className="max-w-7xl mx-auto px-4 py-10 space-y-16 text-black">

                    <p className="mb-4 text-black text-2xl">
                        <b className="text-3xl">Accurate Bookkeeping Services in Canada:</b> Your Financial Foundation, Done Right
                    </p>
                    <div className="mb-4 text-[#5a6a7a]">
                        <p className="text-xl font-semibold">Stop juggling receipts, chasing invoices, and worrying about CRA compliance. </p>
                        <p>Accufin provides expert bookkeeping services for Canadian businesses, turning your financial chaos into clarity. We handle your day-to-day finances so you can focus on growth.</p>
                    </div>
                </div>

                {/* Main Content Container */}
                <div className="max-w-7xl mx-auto px-4 space-y-16">
                    {/* Why Partner With Us Accordion */}
                    <div>
                        <ul className="list-none pl-0 space-y-2">
                            <li className="text-2xl md:text-3xl font-bold text-[#0a2236] mb-8">
                                Why Partner with Us?
                            </li>

                            {items.map((item, index) => (
                                <li
                                    key={item.title}
                                    className={`border-b border-gray-100 pb-2 ${openIndex === index ? 'is-open' : ''}`}
                                >
                                    <button
                                        className="w-full flex items-start justify-between text-left"
                                        onClick={() => toggleItem(index)}
                                        aria-expanded={openIndex === index}
                                        aria-controls={`accordion-content-${index}`}
                                    >
                                        <div className="flex items-start">
                                            <FaChevronRight
                                                className={`mt-0.5 mr-2 text-[#008db3] transition-transform duration-300 ${openIndex === index ? 'rotate-90' : ''}`}
                                            />
                                            <span className="font-medium text-[#0a2236]">{item.title}</span>
                                        </div>
                                    </button>

                                    <div
                                        id={`accordion-content-${index}`}
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-40' : 'max-h-0'}`}
                                    >
                                        <p className="pl-6 text-[#5a6a7a] mt-2 pb-1">
                                            {item.content}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Core Bookkeeping Services */}
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-[#0a2236] mb-8 text-center">
                            Our Core Bookkeeping Services
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center mb-4">
                                    <span className="text-2xl mr-3">📊</span>
                                    <h3 className="text-xl font-semibold text-[#0a2236]">Essential Financial Management</h3>
                                </div>
                                <ul className="space-y-2 text-[#5a6a7a]">
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Daily/Monthly transaction recording & categorization</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Bank/credit card reconciliations</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Accounts Payable & Receivable management</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Financial reporting (P&L, Balance Sheets, Cash Flow)</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center mb-4">
                                    <span className="text-2xl mr-3">📝</span>
                                    <h3 className="text-xl font-semibold text-[#0a2236]">Tax-Ready Books</h3>
                                </div>
                                <ul className="space-y-2 text-[#5a6a7a]">
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>GST/HST/PST tracking & filing support</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Payroll processing & source deductions</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Year-end cleanup & T4 preparation</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>CRA correspondence assistance</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-center mb-4">
                                    <span className="text-2xl mr-3">🚀</span>
                                    <h3 className="text-xl font-semibold text-[#0a2236]">Growth-Focused Solutions</h3>
                                </div>
                                <ul className="space-y-2 text-[#5a6a7a]">
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Customized reporting for informed decisions</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Software setup/training (QuickBooks, Xero, Sage)</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Cash flow forecasting & budgeting</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Industry-specific bookkeeping (retail, e-commerce, contractors)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Who We Help Section */}
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-[#0a2236] mb-8 text-center">
                            Who We Help
                        </h2>

                        <div className="hidden md:block">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="grid grid-cols-12 bg-[#008db3] text-white font-semibold">
                                    <div className="col-span-5 p-4">Business Type</div>
                                    <div className="col-span-7 p-4">How We Solve Your Pain Points</div>
                                </div>
                                {services.map((service, index) => (
                                    <div
                                        key={service.businessType}
                                        className={`grid grid-cols-12 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                                    >
                                        <div className="col-span-5 p-4 font-medium text-[#0a2236]">
                                            {service.businessType}
                                        </div>
                                        <div className="col-span-7 p-4 text-[#5a6a7a]">
                                            {service.solution}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="md:hidden space-y-4">
                            {services.map((service) => (
                                <div key={service.businessType} className="bg-white p-4 rounded-lg shadow-md">
                                    <h3 className="font-bold text-[#0a2236] text-lg mb-2">
                                        {service.businessType}
                                    </h3>
                                    <p className="text-[#5a6a7a]">
                                        {service.solution}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Accufin Difference Section */}
                    <div>
                        <div className="bg-gradient-to-r from-[#008db3] to-[#0a2236] rounded-xl shadow-xl overflow-hidden">
                            <div className="md:flex">
                                <div className="p-8 md:p-12 md:w-2/3">
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                                        Accufin Services Inc. Difference
                                    </h2>
                                    <blockquote className="text-white text-lg md:text-xl italic mb-6 leading-relaxed">
                                        "We don't just record numbers—we build financial systems that help you:"
                                    </blockquote>
                                    <ul className="space-y-3 text-white">
                                        <li className="flex items-start">
                                            <svg className="w-5 h-5 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Reduce tax liabilities</span>
                                        </li>
                                        <li className="flex items-start">
                                            <svg className="w-5 h-5 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Uncover profit opportunities</span>
                                        </li>
                                        <li className="flex items-start">
                                            <svg className="w-5 h-5 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Secure financing confidently</span>
                                        </li>
                                    </ul>
                                    <div className="mt-8 bg-white/20 backdrop-blur-sm rounded-lg p-4 inline-block">
                                        <p className="text-white font-semibold">
                                            All with 100% CRA compliance.
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden md:block md:w-1/3 bg-[url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80')] bg-cover bg-center">
                                    <div className="h-full bg-black/20"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Get Started Section */}
                    <div>
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                            <div className="md:flex">
                                <div className="p-8 md:p-12 md:w-2/3">
                                    <h2 className="text-2xl md:text-3xl font-bold text-[#0a2236] mb-4">
                                        Ready to Transform Your Books?
                                    </h2>
                                    <div className="flex items-center text-[#008db3] mb-6">
                                        <FaArrowRight className="mr-2" />
                                        <span className="font-semibold">Get Started in 3 Easy Steps:</span>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex">
                                            <div className="flex-shrink-0 mr-4">
                                                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#008db3] text-white">
                                                    <FaCalendarAlt className="h-6 w-6" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-[#0a2236]">1. Book a free consultation</h3>
                                                <p className="text-[#5a6a7a]">Virtual or in-person meeting to understand your needs</p>
                                            </div>
                                        </div>
                                        <div className="flex">
                                            <div className="flex-shrink-0 mr-4">
                                                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#008db3] text-white">
                                                    <FaSearchDollar className="h-6 w-6" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-[#0a2236]">2. We analyze your current books</h3>
                                                <p className="text-[#5a6a7a]">Identify savings opportunities and pain points</p>
                                            </div>
                                        </div>
                                        <div className="flex">
                                            <div className="flex-shrink-0 mr-4">
                                                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#008db3] text-white">
                                                    <FaCogs className="h-6 w-6" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-[#0a2236]">3. Implement tailored solution</h3>
                                                <p className="text-[#5a6a7a]">Custom bookkeeping system designed for your business</p>
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href="/contact"
                                        className="mt-8 inline-block bg-[#00c6fb] hover:translate-y-[-6px] transition-transform text-white font-semibold px-6 py-3 rounded"
                                    >
                                        CONTACT US NOW &rarr;
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    {/* <div
                        className="relative rounded-xl overflow-hidden"
                        style={{
                            backgroundImage: "url('/img5.jpg')",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "cover",
                        }}
                    >
                        <div className="absolute inset-0 bg-black opacity-60"></div>
                        <div className="relative z-10 p-6 flex flex-col items-start">
                            <div className="text-white text-lg font-bold mb-2">
                                Having Trouble Managing <br /> Your Finance?
                            </div>
                            <a
                                href="/contact"
                                className="mt-2 inline-block bg-[#00c6fb] hover:translate-y-[-6px] transition-transform text-white font-semibold px-6 py-3 rounded"
                            >
                                CONTACT US NOW &rarr;
                            </a>
                        </div>
                    </div> */}
                </div>
            </div>

            <Footer />
        </div>
    );
}