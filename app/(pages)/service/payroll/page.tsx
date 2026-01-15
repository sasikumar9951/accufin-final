"use client";

import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import Link from "next/link";
import { useState, useRef } from "react";
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaBook,
  FaCalendarAlt,
  FaCalculator,
  FaFileAlt,
  FaClock,
  FaFileInvoice,
  FaBalanceScale,
  FaMapMarkerAlt,
  FaCogs,
  FaChevronRight,
  FaCheck,
} from "react-icons/fa";
import { motion, useInView } from "framer-motion";

export default function PayrollPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How fast can you onboard my business?",
      a: "Most clients go live in 72 hours!",
    },
    {
      q: "What if I have employees in multiple provinces?",
      a: "We handle all provincial regulations seamlessly.",
    },
  ];
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -100px 0px" });

  const mistakes = [
    {
      icon: <FaBook className="text-xl" />,
      title: "1. Misclassifying Workers (Employee vs. Contractor)",
      cost: "CRA audits, back taxes (CPP, EI, income tax), penalties (up to double the unremitted amounts), plus interest. Employee lawsuits for unpaid benefits/vacation.",
      avoid:
        "Use the CRA's RC4110: Employee or Self-Employed? guide. Never base classification solely on a contract; the actual working relationship determines status. When in doubt, treat as an employee or request a CRA ruling (CPT1 form).",
    },
    {
      icon: <FaCalendarAlt className="text-xl" />,
      title: "2. Missing Remittance Deadlines",
      cost: "Immediate penalties (10% for first late remittance, escalating to 20% for repeated offences within a year), plus compound daily interest. Cash flow disruption.",
      avoid:
        "Know your remittance schedule (monthly, quarterly, accelerated) based on average monthly withholding amount. Automate reminders in payroll software. Remit on or before the due date, considering processing times.",
    },
    {
      icon: <FaCalculator className="text-xl" />,
      title: "3. Incorrectly Calculating & Remitting Source Deductions",
      cost: "Underpayment penalties + interest. Overpayment means you've loaned the CRA money interest-free. Employee frustration/errors on tax returns.",
      avoid:
        "Use current year's CRA payroll deduction tables or certified payroll software. Double-check calculations, especially for bonuses, retroactive pay, terminations. Know CPP exemptions (over 65, certain disability pensions) and EI insurable earnings caps.",
    },
    {
      icon: <FaFileAlt className="text-xl" />,
      title: "4. Errors in Record Keeping & Documentation",
      cost: "CRA penalties for non-compliance ($2,500 per infraction), inability to defend against disputes/audits, operational inefficiency.",
      avoid:
        "Maintain digital records securely for 6+ years (per CRA requirement). Track: hours worked, pay rates, deductions, vacation accrual/use, leave, ROEs, contracts, classification rationale. Use a centralized HRIS/Payroll system.",
    },
    {
      icon: <FaClock className="text-xl" />,
      title: "5. Mishandling Statutory Holidays & Vacation Pay",
      cost: "Back pay owed to employees, penalties, employee grievances, damage to morale/reputation.",
      avoid:
        "Know provincial rules (eligibility, calculation methods - % vs. accrual). Pay correct holiday pay (avg daily wages) and premium pay for hours worked. Accrue vacation pay accurately and pay it out correctly on each pay or annually.",
    },
    {
      icon: <FaFileInvoice className="text-xl" />,
      title: "6. Filing T4/T4A Slips Late or Inaccurately",
      cost: "Penalties ($100 per slip for late filing, $250 per slip for knowingly negligent filing), employee delays in filing taxes, CRA scrutiny.",
      avoid:
        "Reconcile payroll data quarterly. Validate all employee data (SIN, address) well before year-end. Use CRA-approved software for filing (T4 Web Forms, EFILE). File before the Feb 28 deadline. Proofread meticulously.",
    },
    {
      icon: <FaBalanceScale className="text-xl" />,
      title: "7. Not Issuing or Issuing Incorrect Records of Employment (ROEs)",
      cost: "Delays in employees receiving EI benefits (leading to complaints), potential Service Canada penalties, reputational damage.",
      avoid:
        "Issue ROEs electronically via ROE Web within 5 calendar days of an interruption of earnings (pay period end, last day paid). Train HR/Payroll staff thoroughly on ROE Web and code selection. Validate all details.",
    },
    {
      icon: <FaMapMarkerAlt className="text-xl" />,
      title: "8. Overlooking Provincial vs. Federal Regulations",
      cost: "Non-compliance with provincial employment standards (minimum wage, overtime rules, termination pay), leading to fines, back pay orders, lawsuits.",
      avoid:
        "Know which legislation applies (federally regulated industries vs. provincial). Subscribe to updates from your provincial Ministry of Labour and federal Labour Program. Have provincial-specific payroll/HR checklists.",
    },
    {
      icon: <FaMapMarkerAlt className="text-xl" />,
      title: "9. Failing to Account for Remote Workers in Different Provinces",
      cost: "Deducting/remitting to the wrong province, incorrect EI/CPP/QPP treatment, non-compliance with provincial standards (min wage, holidays).",
      avoid:
        "Determine the province of employment (usually where the employee physically reports to work). Update employee profiles immediately upon relocation. Ensure payroll software handles multi-provincial setups correctly.",
    },
    {
      icon: <FaCogs className="text-xl" />,
      title: "10. Manual Processes & Lack of Expertise",
      cost: "Significantly higher error rates, wasted staff time, missed deadlines, inability to scale, vulnerability to staff turnover.",
      avoid:
        "Invest in certified payroll software (e.g., ADP, Ceridian, Wagepoint, QuickBooks Online Payroll) that automates calculations, remittances, filings, and stays updated. If complex (multiple provinces, contractors, equity comp), partner with a payroll provider or accountant specializing in Canadian payroll.",
    },
  ];

  const proactivePlan = [
    "Dedicated Expertise: Assign ownership to trained staff or outsource.",
    "Certified Software: Non-negotiable for accuracy and compliance.",
    "Regular Reconciliation: Match payroll registers to bank statements & GL accounts monthly/quarterly.",
    "Stay Updated: Subscribe to CRA's Payroll News, provincial labour sites, and industry newsletters.",
    "Annual Audit: Conduct an internal or external payroll audit before the CRA does.",
    "Clear Policies: Document payroll procedures, approval workflows, and classification rules.",
    "Training: Invest in ongoing payroll training (CPA Canada, Canadian Payroll Association courses).",
  ];

  return (
    <div className="bg-white">
      <Navbar />

      <section
        className="relative w-full h-[320px] flex flex-col justify-center"
        style={{
          backgroundImage: "url('/payroll.jpg')",
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
            Payroll Services
          </h1>
          <div className="flex items-center space-x-2 text-lg">
            <Link href="/" className="text-[#00c6fb] hover:underline">
              Home
            </Link>
            <span className="text-white">/</span>
            <Link href="/services" className="text-[#00c6fb] hover:underline">
              Services
            </Link>
            <span className="text-white">/</span>
            <span className="text-white">Payroll</span>
          </div>
        </motion.div>
      </section>

      {/* Hero Section */}
      <section className=" max-w-7xl mx-auto rounded-xl mt-10 relative bg-[#093961d2] text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Flawless Canadian Payroll: Accurate, Compliant & Stress-Free
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Stop risking penalties and wasting hours on payroll. Accufin
            delivers error-free, fully compliant payroll processing for Canadian
            businesses—so you pay employees confidently, meet all deadlines, and
            reclaim your time.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            {/* <Link
                            href="/contact"
                            className="bg-[#00c6fb] hover:bg-[#008db3] text-white font-bold py-3 px-8 rounded-lg transition duration-300"
                        >
                            Book Your Free Assessment
                        </Link> */}
            <Link
              href="/pricing"
              className="bg-white text-[#0a2236] hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition duration-300"
            >
              See Pricing Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-6">
            Why Choose Our Canadian Payroll Services?
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <table className="min-w-full">
            <thead className="bg-[#008db3] text-white">
              <tr>
                <th className="text-left py-4 px-6">Benefit</th>
                <th className="text-left py-4 px-6">What It Means for You</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-6 font-medium">
                  CRA Compliance Guarantee
                </td>
                <td className="py-4 px-6 text-[#5a6a7a]">
                  Avoid penalties with precise CPP, EI, tax deductions &
                  remittances
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-6 font-medium">Provincial Expertise</td>
                <td className="py-4 px-6 text-[#5a6a7a]">
                  Accurate calculations for British Columbia, Alberta, & all
                  provinces
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-6 font-medium">Direct Deposit Magic</td>
                <td className="py-4 px-6 text-[#5a6a7a]">
                  Employees paid on time, every time—with digital pay stubs
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-6 font-medium">Year-End Made Simple</td>
                <td className="py-4 px-6 text-[#5a6a7a]">
                  T4s, T4As, and ROEs prepared and filed correctly
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-6 font-medium">Software Synced</td>
                <td className="py-4 px-6 text-[#5a6a7a]">
                  Integrates with QuickBooks, Xero, or your existing tools
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-[#f8fafc] py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-12 text-center">
            Our Comprehensive Payroll Services
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Essential Processing */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📋</span>
                <h3 className="text-xl font-semibold text-[#0a2236]">
                  Essential Processing
                </h3>
              </div>
              <ul className="space-y-2 text-[#5a6a7a]">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Salaried, hourly & contract worker pay runs (bi-weekly,
                    semi-monthly, monthly)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Overtime, bonuses, vacation pay & expense reimbursements
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Automated tax calculations (federal/provincial)</span>
                </li>
              </ul>
            </div>

            {/* Compliance & Reporting */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🛡️</span>
                <h3 className="text-xl font-semibold text-[#0a2236]">
                  Compliance & Reporting
                </h3>
              </div>
              <ul className="space-y-2 text-[#5a6a7a]">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>CPP, EI, and income tax deductions/remittances</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Workers' compensation (WSIB/WCB) reporting</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    T4, T4A, and Record of Employment (ROE) preparation/filing
                  </span>
                </li>
              </ul>
            </div>

            {/* Employee Experience */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">👥</span>
                <h3 className="text-xl font-semibold text-[#0a2236]">
                  Employee Experience
                </h3>
              </div>
              <ul className="space-y-2 text-[#5a6a7a]">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Digital pay stubs & tax forms (secure online portal)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>New hire onboarding support</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Direct deposit setup & management</span>
                </li>
              </ul>
            </div>

            {/* Specialized Support */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🔧</span>
                <h3 className="text-xl font-semibold text-[#0a2236]">
                  Specialized Support
                </h3>
              </div>
              <ul className="space-y-2 text-[#5a6a7a]">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Multi-province payroll solutions</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Sub-contractor/T5 management</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Payroll audits & cleanup</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-12 text-center">
          Who We Serve
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-[#0a2236] mb-3">
              Small Businesses
            </h3>
            <p className="text-[#5a6a7a] italic">
              "No more late nights calculating deductions!"
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-[#0a2236] mb-3">
              Startups
            </h3>
            <p className="text-[#5a6a7a] italic">
              "Scale payroll seamlessly as you hire."
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-[#0a2236] mb-3">
              Restaurants/Retail
            </h3>
            <p className="text-[#5a6a7a] italic">
              "Handle complex schedules, tips, and shift premiums."
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-[#0a2236] mb-3">
              Remote Teams
            </h3>
            <p className="text-[#5a6a7a] italic">
              "Pay Canada-wide employees accurately across provinces."
            </p>
          </div>
        </div>
      </section>

      {/* The Accufin Difference */}
      <section className="bg-gradient-to-r from-[#008db3] to-[#0a2236] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            The Accufin Difference
          </h2>
          <blockquote className="text-xl italic mb-12">
            "We're not just a payroll provider—we're your compliance shield.
            While others automate and hope, our Canadian payroll experts:"
          </blockquote>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <FaCheck className="text-2xl mb-4 mx-auto" />
              <p>Audit every pay run for accuracy</p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <FaCheck className="text-2xl mb-4 mx-auto" />
              <p>Proactively update for tax law changes</p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <FaCheck className="text-2xl mb-4 mx-auto" />
              <p>Fix errors before they cost you</p>
            </div>
          </div>

          <p className="text-xl font-semibold">
            That's peace of mind you can't automate.
          </p>
        </div>
      </section>

      {/* Trust Builders */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-wrap justify-center gap-6">
            <div className="bg-gray-100 px-6 py-3 rounded-full">
              QuickBooks Certified
            </div>
            <div className="bg-gray-100 px-6 py-3 rounded-full">
              CPB Canada Member
            </div>
            <div className="bg-gray-100 px-6 py-3 rounded-full">
              100+ Canadian Clients
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-2xl font-bold text-[#0a2236]">
              98% client retention rate
            </p>
            <p className="text-xl text-[#5a6a7a]">100% on-time filing record</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-md mt-12 max-w-3xl mx-auto">
          <blockquote className="text-lg italic mb-4">
            "Accufin cut our payroll errors to zero and saved us $2K in CRA
            fines last year!"
          </blockquote>
          <p className="font-semibold text-[#0a2236]">
            Navjot Singh, Kalgidhar Construction Ltd.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#0a2236] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready for Payroll That Runs Itself?
          </h2>
          <p className="text-xl mb-8">
            Get a FREE payroll process review (valued at $100). We'll identify
            compliance risks and show you how to save hours monthly.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {/* <Link
                            href="/contact"
                            className="bg-[#00c6fb] hover:bg-[#008db3] text-white font-bold py-3 px-8 rounded-lg transition duration-300"
                        >
                            Book Your Free Assessment
                        </Link> */}
            <Link
              href="/pricing"
              className="bg-white text-[#0a2236] hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition duration-300"
            >
              See Pricing Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-red-600 mb-4 flex items-center justify-center gap-2">
            <FaExclamationTriangle /> Top 10 Costly Payroll Mistakes
          </h1>
          <p className="text-lg text-gray-600">
            Avoid these common payroll errors that could cost your business
            thousands in penalties and back payments
          </p>
        </div>

        <div className="space-y-8">
          {mistakes.map((mistake) => (
            <div
              key={mistake.title}
              className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-red-500"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-red-100 p-3 rounded-full text-red-600">
                    {mistake.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {mistake.title}
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-700 mb-2">
                      Potential Costs:
                    </h4>
                    <p className="text-gray-700">{mistake.cost}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-700 mb-2">
                      How to Avoid:
                    </h4>
                    <p className="text-gray-700">{mistake.avoid}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-blue-50 rounded-xl p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-700 mb-6 flex items-center gap-2">
            <FaCheckCircle /> Proactive Payroll Avoidance Plan
          </h2>

          <ul className="space-y-4">
            {proactivePlan.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-600 rounded-full p-1 mt-1">
                  <FaCheckCircle className="text-sm" />
                </span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 p-6 bg-white rounded-lg border border-blue-200">
            <p className="text-lg font-semibold text-gray-800">
              <span className="text-blue-600"></span> Payroll errors are
              expensive and preventable. Investing in robust systems, expertise,
              and proactive compliance is far cheaper than CRA penalties, back
              payments, lawsuits, and damaged employee trust. Treat payroll as a
              critical risk management function, not just an administrative
              task.
            </p>
          </div>
        </div>
      </div>

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
                  <FaChevronRight
                    className={`ml-2 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 pb-4" : "max-h-0"}`}
                >
                  <p className="text-[#5a6a7a]">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* <div className="mt-12 text-center">
                    <Link
                        href="/resources/payroll-mistakes"
                        className="inline-flex items-center text-[#008db3] hover:underline font-semibold"
                    >
                        Download: 5 Costly Payroll Mistakes Canadian Businesses Make (And How to Avoid Them)
                        <FaChevronRight className="ml-2" />
                    </Link>
                </div> */}
      </section>

      <Footer />
    </div>
  );
}
