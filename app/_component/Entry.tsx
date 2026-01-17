"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { FaArrowRight, FaCheck, FaChevronRight, FaRegCalendarAlt, FaRegUser } from "react-icons/fa";
import { Blogs } from "@prisma/client";
import { formatTextWithLinks } from "@/lib/utils";


const otherServices = [
    { name: "Bookkeeping", href: "/service/bookkeeping" },
    { name: "Payroll Services", href: "/service/payroll" },
    { name: "Tax Planning", href: "/service/tax" },
    { name: "Audit & Assurance", href: "/service/audit" },
    { name: "Financial Statement", href: "/service/finance" },
    { name: "Business Compliances", href: "/service/businesscompliances" },
];

export default function Entry() {
    const [blogs, setBlogs] = useState<Blogs[]>([]);

    useEffect(() => {
        const fetchBlogs = async () => {
            const response = await fetch("/api/user/blogs");
            const data = await response.json();
            setBlogs(data);
        };
        fetchBlogs();
    }, []);

    const handleScrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.section
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-[#f7f9fa] py-8 px-2 min-h-screen"
        >
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <img
                        src="/img6.jpg"
                        alt="Double Entry Accounting"
                        className="rounded-xl w-full object-cover mb-6"
                    />
                    <h1 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-2">
                        Double Entry Accounting In a Relational Database
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 mb-4 text-[#008db3] text-sm">
                        <span className="flex items-center">
                            <FaRegUser className="mr-1" /> Accufin
                        </span>
                        <span className="flex items-center">
                            <FaRegCalendarAlt className="mr-1" /> {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold text-[#0a2236] mb-4">Your Financial Data, Structured for Accuracy and Insight</h2>

                    <h3 className="text-xl font-bold text-[#0a2236] mt-6 mb-3">What is Double-Entry Accounting?</h3>
                    <p className="mb-4 text-[#5a6a7a]">
                        Every financial transaction impacts at least two accounts:
                    </p>
                    <ul className="list-none pl-0 space-y-2 text-[#008db3] mb-6">
                        <li className="flex items-start">
                            <FaChevronRight className="mt-1 mr-2" />
                            <span className="text-[#5a6a7a]"><b>    Debits </b>(💰 Entering your business)</span>
                        </li>
                        <li className="flex items-start">
                            <FaChevronRight className="mt-1 mr-2" />
                            <span className="text-[#5a6a7a]"><b>    Credits</b> (💸 Leaving your business)</span>
                        </li>
                    </ul>

                    <p className="mb-4 text-[#5a6a7a] font-semibold">Example: When you invoice a client:</p>
                    <ul className="list-none pl-0 space-y-2 text-[#008db3] mb-6">
                        <li className="flex items-start">
                            <FaChevronRight className="mt-1 mr-2" />
                            <span className="text-[#5a6a7a]">Debit Accounts Receivable (asset increases)</span>
                        </li>
                        <li className="flex items-start">
                            <FaChevronRight className="mt-1 mr-2" />
                            <span className="text-[#5a6a7a]">Credit Revenue (income increases)</span>
                        </li>
                    </ul>

                    <p className="mb-4 text-[#5a6a7a]">This system ensures:</p>
                    <ul className="list-none pl-0 space-y-2 text-[#008db3] mb-6">
                        <li className="flex items-start">
                            <FaChevronRight className="mt-1 mr-2 text-green-500" />
                            <span className="text-[#5a6a7a]"><b> Mathematical Accuracy </b>: Total Debits always equal Total Credits.</span>
                        </li>
                        <li className="flex items-start">
                            <FaChevronRight className="mt-1 mr-2 text-green-500" />
                            <span className="text-[#5a6a7a]"><b> Audit Trails </b>: Every dollar's path is traceable.</span>
                        </li>
                        <li className="flex items-start">
                            <FaChevronRight className="mt-1 mr-2 text-green-500" />
                            <span className="text-[#5a6a7a]"><b> Financial Integrity </b>: Prevents errors and fraud.</span>
                        </li>
                    </ul>

                    <div className="border-t border-gray-300 my-8"></div>

                    <h3 className="text-xl font-bold text-[#0a2236] mt-6 mb-3">Why a Relational Database?</h3>
                    <p className="mb-4 text-[#5a6a7a]">
                        Spreadsheets work for startups—but when you scale, you need a structured foundation. A relational database organizes your finances like a digital ledger on steroids:
                    </p>

                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <table className="w-full">
                            <thead className="bg-[#008db3] text-white">
                                <tr>
                                    <th className="py-2 px-4 text-left">Traditional Spreadsheet</th>
                                    <th className="py-2 px-4 text-left">Relational Database</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-200">
                                    <td className="py-3 px-4 text-[#5a6a7a]">Manual data entry</td>
                                    <td className="py-3 px-4 text-[#5a6a7a]">Automated rules & constraints</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="py-3 px-4 text-[#5a6a7a]">Error-prone formulas</td>
                                    <td className="py-3 px-4 text-[#5a6a7a]">Real-time balance checks</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="py-3 px-4 text-[#5a6a7a]">Siloed files</td>
                                    <td className="py-3 px-4 text-[#5a6a7a]">Centralized, secure data</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4 text-[#5a6a7a]">Limited history</td>
                                    <td className="py-3 px-4 text-[#5a6a7a]">Full audit history</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-gray-300 my-8"></div>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden my-8 border border-gray-200">
                        <div className="bg-[#0a2236] p-4">
                            <h3 className="text-xl font-bold text-white">How We Structure Your Accounting Data</h3>
                            <p className="text-[#00c6fb]">Our system enforces double-entry logic through carefully designed tables:</p>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Accounts Table */}
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <div className="bg-[#00c6fb] text-white rounded-full w-6 h-6 flex items-center justify-center mr-3">1</div>
                                    <h4 className="text-lg font-semibold text-[#0a2236]">Accounts Table</h4>
                                </div>
                                <p className="text-[#5a6a7a] italic">Your Chart of Accounts</p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-gray-50 rounded-lg overflow-hidden">
                                        <thead className="bg-[#008db3] text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Account ID</th>
                                                <th className="px-4 py-3 text-left">Name</th>
                                                <th className="px-4 py-3 text-left">Type</th>
                                                <th className="px-4 py-3 text-left">Normal Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">101</td>
                                                <td className="px-4 py-3 text-[#0a2236]">Cash</td>
                                                <td className="px-4 py-3 text-[#0a2236]">Asset</td>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">Debit</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">401</td>
                                                <td className="px-4 py-3 text-[#0a2236]">Sales Revenue</td>
                                                <td className="px-4 py-3 text-[#0a2236]">Revenue</td>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">Credit</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Transactions Table */}
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <div className="bg-[#00c6fb] text-white rounded-full w-6 h-6 flex items-center justify-center mr-3">2</div>
                                    <h4 className="text-lg font-semibold text-[#0a2236]">Transactions Table</h4>
                                </div>
                                <p className="text-[#5a6a7a] italic">The "Why" Behind Every Entry</p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-gray-50 rounded-lg overflow-hidden">
                                        <thead className="bg-[#008db3] text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Transaction ID</th>
                                                <th className="px-4 py-3 text-left">Date</th>
                                                <th className="px-4 py-3 text-left">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">1001</td>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">2023-10-05</td>
                                                <td className="px-4 py-3 text-[#0a2236]">Client Invoice #205</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Entries Table */}
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <div className="bg-[#00c6fb] text-white rounded-full w-6 h-6 flex items-center justify-center mr-3">3</div>
                                    <h4 className="text-lg font-semibold text-[#0a2236]">Entries Table</h4>
                                </div>
                                <p className="text-[#5a6a7a] italic">Debits & Credits in Perfect Balance</p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-gray-50 rounded-lg overflow-hidden">
                                        <thead className="bg-[#008db3] text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Entry ID</th>
                                                <th className="px-4 py-3 text-left">Transaction ID</th>
                                                <th className="px-4 py-3 text-left">Account ID</th>
                                                <th className="px-4 py-3 text-left">Type</th>
                                                <th className="px-4 py-3 text-left">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">27</td>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">1001</td>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">101</td>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">Debit</td>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">$1,200</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">28</td>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">1001</td>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">401</td>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">Credit</td>
                                                <td className="px-4 py-3 text-[#0a2236] font-mono">$1,200</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Database Enforcement */}
                            <div className="bg-blue-50 border-l-4 border-[#00c6fb] p-4 rounded-r">
                                <div className="flex items-start">
                                    <span className="text-[#00c6fb] mr-2">→</span>
                                    <p className="text-[#0a2236] font-medium">
                                        The database automatically enforces:<br />
                                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">SUM(Debits) = SUM(Credits)</span> for every transaction.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-300 my-8"></div>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden my-8 border border-gray-200">
                        <div className="bg-gradient-to-r from-[#008db3] to-[#0a2236] p-6">
                            <h3 className="text-2xl font-bold text-white">Benefits for Your Business</h3>
                            <p className="text-[#00c6fb] mt-2">Transform your financial management with our robust accounting system</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                            {/* Benefit 1 */}
                            <div className="bg-[#f8fafc] p-5 rounded-lg border border-gray-100 hover:shadow-md transition-all">
                                <div className="flex items-start">
                                    <div className="bg-[#00c6fb] text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">1</div>
                                    <div>
                                        <h4 className="text-xl font-semibold text-[#0a2236] mb-2">Error-Proof Bookkeeping</h4>
                                        <p className="text-[#5a6a7a]">No more unbalanced spreadsheets. The system rejects entries that break accounting rules.</p>
                                        <div className="mt-3 flex items-center">
                                            <FaCheck className="text-green-500 mr-2" />
                                            <span className="text-sm text-[#0a2236]">Automatic validation</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Benefit 2 */}
                            <div className="bg-[#f8fafc] p-5 rounded-lg border border-gray-100 hover:shadow-md transition-all">
                                <div className="flex items-start">
                                    <div className="bg-[#00c6fb] text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">2</div>
                                    <div>
                                        <h4 className="text-xl font-semibold text-[#0a2236] mb-2">Real-Time Financial Visibility</h4>
                                        <p className="text-[#5a6a7a]">Generate accurate reports in seconds:</p>
                                        <ul className="mt-2 space-y-1">
                                            <li className="flex items-center">
                                                <FaChevronRight className="text-[#00c6fb] mr-2 text-xs" />
                                                <span className="text-[#5a6a7a]">Balance Sheets</span>
                                            </li>
                                            <li className="flex items-center">
                                                <FaChevronRight className="text-[#00c6fb] mr-2 text-xs" />
                                                <span className="text-[#5a6a7a]">Profit & Loss Statements</span>
                                            </li>
                                            <li className="flex items-center">
                                                <FaChevronRight className="text-[#00c6fb] mr-2 text-xs" />
                                                <span className="text-[#5a6a7a]">Custom cash flow analyses</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Benefit 3 */}
                            <div className="bg-[#f8fafc] p-5 rounded-lg border border-gray-100 hover:shadow-md transition-all">
                                <div className="flex items-start">
                                    <div className="bg-[#00c6fb] text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">3</div>
                                    <div>
                                        <h4 className="text-xl font-semibold text-[#0a2236] mb-2">Audit-Ready Compliance</h4>
                                        <p className="text-[#5a6a7a]">Every change is tracked. Reconstruct financial history with SQL queries.</p>
                                        <div className="mt-3 bg-blue-50 px-3 py-2 rounded inline-block">
                                            <code className="text-sm text-[#0a2236] font-mono">
                                                SELECT * FROM entries WHERE account_id = 101
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Benefit 4 */}
                            <div className="bg-[#f8fafc] p-5 rounded-lg border border-gray-100 hover:shadow-md transition-all">
                                <div className="flex items-start">
                                    <div className="bg-[#00c6fb] text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">4</div>
                                    <div>
                                        <h4 className="text-xl font-semibold text-[#0a2236] mb-2">Scalability</h4>
                                        <p className="text-[#5a6a7a]">Handles 10 transactions or 10,000 with equal reliability.</p>
                                        <div className="mt-3 flex items-center space-x-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-[#00c6fb]">10</div>
                                                <div className="text-xs text-[#5a6a7a]">Transactions</div>
                                            </div>
                                            <div className="text-gray-300">
                                                <FaArrowRight />
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-[#00c6fb]">10K</div>
                                                <div className="text-xs text-[#5a6a7a]">Transactions</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#f0f9ff] border-t border-gray-200 p-6 text-center">
                            <p className="text-[#0a2236] font-medium">
                                Ready to transform your financial management?{' '}
                                <a href="/contact" className="text-[#00c6fb] hover:underline font-semibold">
                                    Contact us today →
                                </a>
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-gray-300 my-8"></div>

                    <div className="my-12 space-y-8">
                        {/* Header Section */}
                        <div className="text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-4">
                                Accounting Isn't Rocket Science <span className="text-[#00c6fb]">(We Promise!)</span>
                            </h2>
                            <p className="text-xl text-[#5a6a7a] max-w-3xl mx-auto">
                                Think of accounting as telling the story of your business in numbers.
                            </p>
                        </div>

                        {/* Three Questions Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                            <div className="flex flex-col items-center text-center p-4">
                                <div className="text-4xl mb-3">💰</div>
                                <h3 className="text-xl font-semibold text-[#0a2236] mb-2">
                                    Are you making money?
                                </h3>
                                <p className="text-[#5a6a7a]">(Profit & Loss)</p>
                            </div>

                            <div className="flex flex-col items-center text-center p-4">
                                <div className="text-4xl mb-3">🏦</div>
                                <h3 className="text-xl font-semibold text-[#0a2236] mb-2">
                                    What do you own vs. owe?
                                </h3>
                                <p className="text-[#5a6a7a]">(Balance Sheet)</p>
                            </div>

                            <div className="flex flex-col items-center text-center p-4">
                                <div className="text-4xl mb-3">💸</div>
                                <h3 className="text-xl font-semibold text-[#0a2236] mb-2">
                                    Where's your cash going?
                                </h3>
                                <p className="text-[#5a6a7a]">(Cash Flow)</p>
                            </div>
                        </div>

                        <p className="text-center text-[#5a6a7a] text-lg mt-6 max-w-2xl mx-auto">
                            You don't need an accounting degree. You just need a system that makes sense.
                        </p>

                        {/* Divider */}
                        <div className="border-t border-gray-200 my-8 w-3/4 mx-auto"></div>

                        {/* Key Concepts Section */}
                        <div className="max-w-4xl mx-auto">
                            <h3 className="text-2xl font-bold text-[#0a2236] text-center mb-8">
                                The 3 Things Every Business Owner Should Know<br />
                                <span className="text-lg font-normal">(Without Becoming an Accountant)</span>
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-[#00c6fb]">
                                            <th className="text-left py-4 px-4 text-[#0a2236] font-semibold">Concept</th>
                                            <th className="text-left py-4 px-4 text-[#0a2236] font-semibold">What It Means</th>
                                            <th className="text-left py-4 px-4 text-[#0a2236] font-semibold">Why You Care</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        <tr>
                                            <td className="py-4 px-4 font-medium text-[#0a2236]">Revenue</td>
                                            <td className="py-4 px-4 text-[#5a6a7a]">Money coming in from sales/services</td>
                                            <td className="py-4 px-4 text-[#5a6a7a] italic">"Am I attracting enough customers?"</td>
                                        </tr>
                                        <tr>
                                            <td className="py-4 px-4 font-medium text-[#0a2236]">Expenses</td>
                                            <td className="py-4 px-4 text-[#5a6a7a]">Money going out (rent, supplies, payroll, etc.)</td>
                                            <td className="py-4 px-4 text-[#5a6a7a] italic">"Where am I overspending?"</td>
                                        </tr>
                                        <tr>
                                            <td className="py-4 px-4 font-medium text-[#0a2236]">Profit</td>
                                            <td className="py-4 px-4 text-[#5a6a7a]">Revenue – Expenses (what's left for YOU)</td>
                                            <td className="py-4 px-4 text-[#5a6a7a] italic">"Is my business sustainable?"</td>
                                        </tr>
                                        <tr>
                                            <td className="py-4 px-4 font-medium text-[#0a2236]">Cash Flow</td>
                                            <td className="py-4 px-4 text-[#5a6a7a]">Timing of money in/out (e.g., invoices paid late = empty bank account)</td>
                                            <td className="py-4 px-4 text-[#5a6a7a] italic">"Can I pay bills this month?"</td>
                                        </tr>
                                        <tr>
                                            <td className="py-4 px-4 font-medium text-[#0a2236]">Assets</td>
                                            <td className="py-4 px-4 text-[#5a6a7a]">What you OWN (cash, equipment, inventory)</td>
                                            <td className="py-4 px-4 text-[#5a6a7a] italic">"What's my safety net?"</td>
                                        </tr>
                                        <tr>
                                            <td className="py-4 px-4 font-medium text-[#0a2236]">Liabilities</td>
                                            <td className="py-4 px-4 text-[#5a6a7a]">What you OWE (loans, unpaid bills)</td>
                                            <td className="py-4 px-4 text-[#5a6a7a] italic">"How much debt am I carrying?"</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-300 my-8"></div>

                    <div className="py-12 px-4 bg-gradient-to-br from-[#f8fafc] to-[#d5e5f7]">
                        <div className="max-w-4xl mx-auto">
                            {/* Section Header */}
                            <div className="text-center mb-10">
                                <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-4">
                                    Why Most <span className="text-[#00c6fb]">Non-Accountants</span> Struggle
                                </h2>
                                <p className="text-xl text-[#5a6a7a] max-w-2xl mx-auto">
                                    It's not your fault if accounting feels overwhelming
                                </p>
                            </div>

                            {/* Pain Points */}
                            <div className="space-y-5 max-w-2xl mx-auto">
                                <div className="flex items-start">
                                    <div className="text-red-500 mr-4 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-lg text-[#0a2236]">
                                            Terms confuse you <span className="text-[#5a6a7a]">("accruals," "depreciation," "COGS")</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="text-red-500 mr-4 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-lg text-[#0a2236]">Spreadsheets feel like a maze</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="text-red-500 mr-4 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-lg text-[#0a2236]">Tax deadlines sneak up on you</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="text-red-500 mr-4 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-lg text-[#0a2236]">You're unsure if your numbers are right</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="text-red-500 mr-4 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-lg text-[#0a2236]">Bookkeeping steals time from your passion</p>
                                    </div>
                                </div>
                            </div>

                            {/* Good News */}
                            <div className="mt-12 text-center bg-white p-6 rounded-xl shadow-sm max-w-2xl mx-auto">
                                <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                                    Good news
                                </div>
                                <h3 className="text-2xl font-bold text-[#0a2236] mb-3">
                                    You shouldn't be doing this alone
                                </h3>
                                <p className="text-[#5a6a7a] mb-4">
                                    Our experts handle the numbers so you can focus on what you do best
                                </p>
                                <a
                                    href="/contact"
                                    className="inline-block bg-[#00c6fb] hover:bg-[#008db3] text-white font-medium px-6 py-3 rounded-lg transition-colors"
                                >
                                    Get Accounting Help
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-300 my-8"></div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: {
                                opacity: 1,
                                y: 0,
                                transition: { duration: 0.6, staggerChildren: 0.1 }
                            }
                        }}
                        className="py-16 px-4"
                    >
                        <div className="max-w-6xl mx-auto space-y-12">
                            {/* Header Section */}
                            <motion.div
                                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                                className="text-center"
                            >
                                <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-4">
                                    How We Make Accounting <span className="text-[#00c6fb]">Painless</span> For You
                                </h2>
                                <blockquote className="text-xl italic text-[#5a6a7a] max-w-2xl mx-auto">
                                    "We translate 'accounting-speak' into plain English and actionable insights."
                                </blockquote>
                            </motion.div>

                            {/* Innovation Accounting Section */}
                            <motion.div
                                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                                className="space-y-8"
                            >
                                <h3 className="text-2xl font-bold text-[#0a2236] text-center">
                                    Innovation Accounting
                                </h3>

                                <motion.p
                                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                                    className="text-lg text-[#5a6a7a] text-center max-w-3xl mx-auto"
                                >
                                    A rigorous framework for measuring progress when traditional financial metrics fail.
                                </motion.p>

                                {/* Application Areas */}
                                <motion.div
                                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
                                >
                                    {[
                                        "Startups testing new markets",
                                        "Businesses launching disruptive products",
                                        "Teams running experiments (MVPs, pivots, prototypes)"
                                    ].map((item) => (
                                        <motion.div
                                            key={item}
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                visible: {
                                                    opacity: 1,
                                                    y: 0,
                                                    transition: { delay: 0.1 }
                                                }
                                            }}
                                            className="flex items-start"
                                        >
                                            <span className="text-[#00c6fb] mr-2 mt-1">•</span>
                                            <span className="text-[#5a6a7a]">{item}</span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>

                            {/* Comparison Section */}
                            <motion.div
                                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                                className="mt-12"
                            >
                                <h4 className="text-xl font-semibold text-[#0a2236] mb-6 text-center">
                                    Unlike Traditional Accounting...
                                </h4>

                                <motion.div
                                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                                    className="overflow-x-auto"
                                >
                                    <table className="min-w-full border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-[#00c6fb]">
                                                <th className="py-4 px-4 text-left text-[#0a2236] font-semibold">Traditional Accounting</th>
                                                <th className="py-4 px-4 text-left text-[#0a2236] font-semibold">Innovation Accounting</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {[
                                                ["Profit/Loss Statements", "Learning Milestones"],
                                                ["Historical Data", "Forward-Looking Experiments"],
                                                ["\"How much did we earn?\"", "\"What did we learn?\""],
                                                ["Fixed KPIs (Revenue, Expenses)", "Adaptive Metrics (Engagement, Conversion, Retention)"]
                                            ].map(([traditional, innovation], i) => (
                                                <motion.tr
                                                    key={traditional + "|" + innovation}
                                                    variants={{
                                                        hidden: { opacity: 0, x: -20 },
                                                        visible: {
                                                            opacity: 1,
                                                            x: 0,
                                                            transition: { delay: i * 0.1 + 0.3 }
                                                        }
                                                    }}
                                                >
                                                    <td className="py-4 px-4 text-[#5a6a7a]">{traditional}</td>
                                                    <td className="py-4 px-4 text-[#0a2236] font-medium">{innovation}</td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </motion.div>
                            </motion.div>

                            {/* Why Needed Section */}
                            <motion.div
                                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                                className="mt-16 space-y-8"
                            >
                                <h3 className="text-2xl font-bold text-[#0a2236] text-center">
                                    Why Your Business Needs This
                                </h3>

                                <h4 className="text-xl font-semibold text-[#0a2236] text-center">
                                    The Hidden Cost of "Vanity Metrics"
                                </h4>

                                <motion.p
                                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                                    className="text-[#5a6a7a] text-center max-w-3xl mx-auto"
                                >
                                    Tracking page views, total users, or gross revenue feels safe – but it's dangerously misleading.
                                </motion.p>

                                {/* Warning Points */}
                                <motion.div
                                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
                                >
                                    {[
                                        "Burning cash on features nobody wants",
                                        "Scaling a flawed business model",
                                        "Missing early warning signs of failure"
                                    ].map((item) => (
                                        <motion.div
                                            key={item}
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                visible: {
                                                    opacity: 1,
                                                    y: 0,
                                                    transition: { delay: 0.6 }
                                                }
                                            }}
                                            className="flex items-start"
                                        >
                                            <span className="text-red-500 mr-2 mt-1">❌</span>
                                            <span className="text-[#5a6a7a]">{item}</span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>

                            {/* Three Pillars */}
                            <motion.div
                                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                                className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
                            >
                                {[
                                    {
                                        title: "Progress Metrics",
                                        description: "Are customers USING your solution?",
                                        examples: ["Activation rate", "Weekly active users"]
                                    },
                                    {
                                        title: "Learning Velocity",
                                        description: "How fast are you validating hypotheses?",
                                        examples: ["Experiments/week", "Cost per insight"]
                                    },
                                    {
                                        title: "Leading Indicators",
                                        description: "What signals predict future growth?",
                                        examples: ["Referral rates", "Cohort retention"]
                                    }
                                ].map((pillar) => {
                                    let pillarNumber;
                                    if (pillar.title === "Progress Metrics") {
                                        pillarNumber = "1";
                                    } else if (pillar.title === "Learning Velocity") {
                                        pillarNumber = "2";
                                    } else {
                                        pillarNumber = "3";
                                    }
                                    return (
                                        <motion.div
                                            key={pillar.title}
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                visible: {
                                                    opacity: 1,
                                                    y: 0,
                                                    transition: { delay: 0.9 }
                                                }
                                            }}
                                            className="text-center border-b-2 border-e-2 rounded-2xl hover:shadow-xl"
                                        >
                                            <div className="text-4xl font-bold text-[#00c6fb] mb-2">
                                                {/* Use the first word of the title as a unique number for display */}
                                                {pillarNumber}
                                            </div>
                                            <h4 className="text-xl font-semibold text-[#0a2236] mb-2">{pillar.title}</h4>
                                            <p className="text-[#5a6a7a] mb-3">{pillar.description}</p>
                                            <ul className="space-y-1 text-sm text-[#5a6a7a]">
                                                {pillar.examples.map((ex) => (
                                                    <li key={ex} className="flex items-center justify-center">
                                                        <span className="text-[#00c6fb] mr-1 ">→</span> {ex}
                                                    </li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </div>
                    </motion.div>
                    <div className="border-t border-gray-300 my-8"></div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.15,
                                    delayChildren: 0.2
                                }
                            }
                        }}
                        className="py-16 px-4 bg-gradient-to-b from-[#f8fafc] to-[#e6f2ff]"
                    >
                        <div className="max-w-6xl mx-auto">
                            {/* Header */}
                            <motion.div
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                                className="text-center mb-12"
                            >
                                <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-3">
                                    Our Innovation Accounting Framework
                                </h2>
                                <p className="text-xl text-[#5a6a7a]">
                                    A Tactical Roadmap for Uncertain Journeys
                                </p>
                            </motion.div>

                            {/* Framework Steps */}
                            <div className="space-y-12">
                                {[
                                    {
                                        step: 1,
                                        title: "Define Riskiest Assumptions",
                                        items: [
                                            "“Do people actually want this?”",
                                            "“Will they pay $X?”",
                                            "“Can we acquire customers profitably?”"
                                        ],
                                        icon: "🔍"
                                    },
                                    {
                                        step: 2,
                                        title: "Design Experiments",
                                        items: [
                                            "Create low-cost MVPs (landing pages, concierge tests, prototypes)",
                                            "Set measurable success/failure criteria"
                                        ],
                                        icon: "🧪"
                                    },
                                    {
                                        step: 3,
                                        title: "Track Actionable Metrics",
                                        items: [
                                            "Engagement: % users performing “Aha!” actions",
                                            "Value Validation: Customer willingness to pre-pay",
                                            "Scalability: Cost to acquire vs. lifetime value"
                                        ],
                                        icon: "📊"
                                    },
                                    {
                                        step: 4,
                                        title: "Pivot or Persevere",
                                        items: [
                                            "“Double down on Feature X – 80% of test users converted.”",
                                            "“Pivot from B2C to B2B – enterprises signed LOIs.”"
                                        ],
                                        icon: "🔄"
                                    }
                                ].map((stage) => (
                                    <motion.div
                                        key={stage.title}
                                        variants={{
                                            hidden: { opacity: 0, x: -30 },
                                            visible: {
                                                opacity: 1,
                                                x: 0,
                                                transition: {
                                                    type: "spring",
                                                    stiffness: 100
                                                }
                                            }
                                        }}
                                        className="flex flex-col md:flex-row gap-6 items-start"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="bg-[#00c6fb] text-white rounded-full w-12 h-12 flex items-center justify-center text-xl mb-2">
                                                {stage.icon}
                                            </div>
                                            <div className="text-4xl font-bold text-[#0a2236] opacity-20">
                                                0{stage.step}
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-[#0a2236] mb-4">
                                                {stage.title}
                                            </h3>
                                            <ul className="space-y-3">
                                                {stage.items.map((item) => (
                                                    <motion.li
                                                        key={item}
                                                        variants={{
                                                            hidden: { opacity: 0 },
                                                            visible: {
                                                                opacity: 1,
                                                                transition: { delay: 0.1 }
                                                            }
                                                        }}
                                                        className="flex items-start"
                                                    >
                                                        <span className="text-[#00c6fb] mr-3 mt-1">
                                                            {stage.step === 4 ? "→" : "•"}
                                                        </span>
                                                        <span className={`${item.startsWith('"') ? 'italic text-[#5a6a7a]' : 'text-[#0a2236]'}`}>
                                                            {item}
                                                        </span>
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* CTA */}
                            {/* <motion.div
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: { delay: 0.6 }
                                    }
                                }}
                                className="mt-16 text-center"
                            >
                                <a
                                    href="/contact"
                                    className="inline-block bg-[#00c6fb] hover:bg-[#008db3] text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                                >
                                    Implement This Framework For Your Business →
                                </a>
                            </motion.div> */}
                        </div>
                    </motion.div>
                </div>

                {/* Sidebar */}
                <div className="w-full lg:w-[350px] flex flex-col gap-6">
                    {/* Recent Blog */}
                    <div className="bg-[#007399] rounded-xl p-6 text-white mb-2">
                        <div className="font-bold text-lg mb-4">Recent Blog</div>
                        <ul className="space-y-4">
                            {blogs.map((b) => (
                                <li key={b.id}>
                                    <a
                                        href={`/blog/${b.id}`}
                                        onClick={handleScrollToTop}
                                        className="flex items-center gap-4 bg-[#00c6fb] rounded transition-colors p-2 -m-2"
                                    >
                                        <img
                                            src="/img6.jpg"
                                            alt={b.title}
                                            className="w-16 h-12 object-cover rounded"
                                        />
                                        <div>
                                            <div className="font-semibold">{b.title}</div>
                                            <div className="text-xs">
                                                {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "N/A"}
                                            </div>
                                            <div className="text-xs mt-1">{formatTextWithLinks(b.content, "white")}</div>


                                            {/* <div className="text-xs mt-1">{b.content}</div> */}
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>




                    {/* Our Services */}
                    <div className="bg-[#007399] rounded-xl p-6 text-white mb-2">
                        <div className="font-bold text-lg mb-4">Our Services</div>
                        <ul className="space-y-2">
                            {otherServices.map((service) => (
                                <li key={service.href}>
                                    <a
                                        href={service.href}
                                        onClick={handleScrollToTop}
                                        className="flex items-center hover:text-[#00c6fb] transition-colors"
                                    >
                                        <FaChevronRight className="mr-2 text-[#00c6fb]" />
                                        {service.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Get a Free Quote */}
                    <form
                        className="bg-white border border-[#008db3] rounded-xl p-6 flex flex-col gap-4"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <div className="font-bold text-lg mb-2 text-[#0a2236]">Get a Free Quote</div>
                        <input
                            type="text"
                            placeholder="Name"
                            required
                            className="border border-[#008db3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00c6fb] text-[#0a2236]"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            required
                            className="border border-[#008db3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00c6fb] text-[#0a2236]"
                        />
                        <textarea
                            placeholder="Message"
                            required
                            className="border border-[#008db3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00c6fb] text-[#0a2236] min-h-[80px]"
                        />
                        <button
                            type="submit"
                            className="bg-[#00c6fb] hover:bg-[#009fcc] text-white font-semibold px-6 py-3 rounded transition-colors"
                        >
                            SEND MESSAGE
                        </button>
                    </form>

                    {/* Contact Us Now */}
                    <div
                        className="sticky top-0 rounded-xl overflow-hidden"
                        style={{
                            backgroundImage: "url('/img6.jpg')",
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
                    </div>

                </div>
            </div>
        </motion.section>
    );
}