"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";

const plans = [
    {
        name: "Individual Taxes",
        price: "50",
        features: [
            "Including all your T4/T4A/T5",
            "Understanding individual situation and guiding what could be claimed",
            "Claiming eligible Tuition fees paid in taxes",
            "Guiding on setting up direct deposit",
            "Accessibility to your CRA filings on your personal portal to access anytime"
        ],
        highlight: false,
        description: "Comprehensive individual tax filing service with expert guidance"
    },
    {
        name: "Business",
        price: "108",
        features: [
            "Monthly/Quarterly/Annually bookkeeping services",
            "GST/PST/HST filing services",
            "Books of Accounts preparations for Corporate Tax filings",
            "WCB/Payroll/T4/T4A/T5 filings",
            "Payroll Returns"
        ],
        highlight: true,
        description: "Comprehensive business accounting and tax services for small to medium enterprises"
    },
    {
        name: "Payroll for your business",
        price: "45",
        features: [
            "Set up of Employees",
            "Paystubs preparation",
            "Payroll Taxes remittances",
            "Payroll Return filings",
            "Issuing applicable tax info slips to the individuals/business"
        ],
        highlight: false,
        description: "Full-service payroll solutions to streamline your business operations"
    },
    {
        name: "Business Registration Services",
        price: "200",
        features: [
            "Provincial company registration",
            "Multi-provincial/federal company registrations",
            "Assistance with setting up GST/HST/PST accounts",
            "Assistance with setting up payroll accounts",
            "Assistance with setting up Information return accounts"
        ],
        highlight: true,
        description: "Comprehensive business registration and setup services for new and expanding businesses"
    }
];

export default function Price() {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    const directions = [
        { x: -100, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 0 },
    ];

    return (
        <section ref={sectionRef} className="bg-[#f7f7f7] py-16 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-6">
                    <div className="flex-1">
                        <div className="uppercase text-xs tracking-widest text-[#008db3] mb-1">Pricing Plan</div>
                        <h2 className="text-3xl md:text-5xl font-bold text-[#0a2236] mb-4">The Best Price For You</h2>
                    </div>
                    <div className="flex-1 flex items-center">
                        <p className="text-[#5a6a7a] text-sm md:text-base max-w-xl">
                            We understand that every dollar counts in your business. That's why <b>fair, transparent pricing </b>is core to our service. We don't believe in hidden fees or complicated packages designed to upsell you.
                            Instead, we tailor our bookkeeping and accounting solutions to fit your specific needs and your budget. Whether you're a startup needing essential bookkeeping or a growing business requiring comprehensive financial management, we structure our services to deliver <b> maximum value </b>.
                            Get the expert financial support you need to succeed, without the premium price tag. Let's discuss how we can provide the perfect fit – and the best price – for your unique business.

                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-7">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, ...directions[i % directions.length] }}
                            animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
                            transition={{ duration: 0.8, delay: i * 0.2, ease: "easeOut" }}
                            className={`flex flex-col border rounded-xl p-8 transition shadow-sm ${plan.highlight
                                ? "bg-[#0082a3] text-white shadow-lg"
                                : "bg-white text-[#0a2236] border-[#0082a3]"
                                }`}
                        >
                            <div className="font-bold text-2xl mb-2">{plan.name}</div>
                            <div className="flex items-end mb-2">
                                <span className="mb-2 text-2xl font-semibold"><sup>
                                    From
                                </sup>
                                </span>
                                <span className="text-5xl font-bold mr-2">&nbsp;${plan.price}</span>
                                <span className="text-lg font-semibold">onwards</span>
                            </div>
                            <p className={`mb-6 ${plan.highlight ? "text-white/80" : "text-[#5a6a7a]"}`}>
                                {/* Nam ultrices lacus interdum neque sagittis. Integer porta sem eu facilisis. */}
                            </p>
                            <ul className="mb-8 space-y-2">
                                {plan.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className={`flex items-center border-b last:border-b-0 pb-2 last:pb-0 ${plan.highlight ? "border-white/30" : "border-[#0082a3]/30"
                                            }`}
                                    >
                                        <span className="mr-2 text-[#00b6d6] text-3xl font-bold ">›</span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <a
                                href="/contact"
                                className="mt-auto inline-flex items-center justify-center px-8 py-3 rounded bg-[#00b6d6] text-white font-semibold tracking-wide transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
                            >
                                Get Started <FaArrowRight className="ml-2" />
                            </a>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section >
    );
}
