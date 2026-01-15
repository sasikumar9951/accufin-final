"use client";

import Link from "next/link";
import {
  FaBook,
  FaMoneyCheckAlt,
  FaCalculator,
  FaClipboardCheck,
  FaChartLine,
  FaBriefcase,
  FaChevronRight,
} from "react-icons/fa";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const services = [
  {
    icon: <FaBook className="text-3xl" />,
    title: "Bookkeeping",
    desc: "Streamline your finances with our precise and reliable bookkeeping services. Accurate records, timely reporting, and expert financial management tailored to your business needs.",
    href: "/service/bookkeeping",
  },
  {
    icon: <FaMoneyCheckAlt className="text-3xl" />,
    title: "Payroll Services",
    desc: "Efficient and accurate payroll services tailored to your business. Timely processing, compliance, and hassle-free payroll management, ensuring your employees are paid accurately and on time.",
    href: "/service/payroll",
  },
  {
    icon: <FaCalculator className="text-3xl" />,
    title: "Tax Planning",
    desc: "Get expert Personal/Corporate Tax services designed just for you. We ensure timely filings, maximize your deductions, and offer proactive advice, making tax management and financial planning hassle-free",
    href: "/service/tax",
  },
  {
    icon: <FaClipboardCheck className="text-3xl" />,
    title: "Audit & Assurance",
    desc: "Improve your business understanding with our Reporting services. We provide clear, easy-to-understand reports that help you make smart decisions for your organization's success.",
    href: "/service/audit",
  },
  {
    icon: <FaChartLine className="text-3xl" />,
    title: "Financial Statement",
    desc: "Count on us for trustworthy Trust Accounting services. We manage your funds with care, ensuring transparency and compliance, giving you peace of mind.",
    href: "/service/finance",
  },
  {
    icon: <FaBriefcase className="text-3xl" />,
    title: "Business Compliances",
    desc: "Keep your workplace worry-free with our help. We manage everything for WCB Compliance, handling paperwork and safety standards to ensure your workplace is secure and worry-free.",
    href: "/service/businesscompliances",
  },
];

export default function Company() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const getInitial = (idx: number) => {
    const angles = [
      { x: -50, y: 0 }, // left
      { x: 0, y: 50 }, // bottom
      { x: 50, y: 0 }, // right
      { x: 0, y: -50 }, // top
    ];
    return angles[idx % angles.length];
  };

  return (
    <section className="mt-15" ref={sectionRef}>
      <div className="bg-[#ffffff] py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-2 text-[#008db3] font-semibold tracking-widest uppercase">
            Our Services
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] text-center mb-4">
            Real Accounting Services for You
          </h2>
          {/* <p className="text-center text-[#5a6a7a] mb-10 max-w-2xl mx-auto">
                        Sed tincidunt accumsan lacus nec bibendum sapien aliquet ut suspendisse
                        pharetra. Finibus condimentum aenean lacinia sem metus Integer.
                    </p> */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => {
              const initialPos = getInitial(idx);
              const isFirst = idx === 0;

              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, x: initialPos.x, y: initialPos.y }}
                  animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className={`rounded-lg border border-[#008db3] transition-colors p-6 flex flex-col h-full group ${
                    isFirst
                      ? "bg-[#008db3] text-white hover:bg-[#007399]"
                      : "bg-white text-[#0a2236] hover:bg-[#008db3] hover:text-white"
                  }`}
                >
                  <div className="mb-4">{service.icon}</div>
                  <div className="font-bold text-lg mb-2">{service.title}</div>
                  <div className="mb-4 text-sm flex-1">{service.desc}</div>
                  <Link
                    href={service.href}
                    className="inline-flex items-center font-semibold text-sm transition-colors text-inherit group-hover:text-white"
                    aria-label={`Learn more about ${service.title}`}
                  >
                    READ MORE <FaChevronRight className="ml-2" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
