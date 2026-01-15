"use client";
import { motion } from "framer-motion";
import { FaArrowRight, FaChartBar, FaHandHoldingUsd } from "react-icons/fa";

export default function Hero() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative bg-[#0a3a4a] text-white min-h-[700px] overflow-hidden mb-0 md:pt-[120px] pt-[160px]">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/bg1.jpg"
                        alt="Background"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-[#0a3a4a] opacity-70"></div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-6xl mx-auto px-4 pt-16 pb-48 md:pb-32">
                    <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="mb-4 text-[#4fd1f9] font-semibold tracking-widest text-lg"
                    >
                        WELCOME TO ACCUFIN SERVICES INC.
                    </motion.div>

                    <motion.h1
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                    >
                        Accelerate with Accurate Bookkeeping & Accounting
                    </motion.h1>

                    <motion.p
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="text-lg md:text-xl mb-8 max-w-2xl"
                    >
                        AT ACCUFIN, we combine accuracy, transparency, and strategic insight to streamline your finances and fuel your success. Our expert team follows the highest accounting standards, ensuring compliance, minimizing risks, and maximizing profitability. Whether you're a small business or a growing enterprise, trust us to keep your finances clear, compliant, and future-ready.
                    </motion.p>

                    <motion.a
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        href="/discovermore"
                        className="inline-flex items-center bg-[#00c6fb] hover:bg-[#00a6d6] text-white font-semibold px-8 py-4 rounded transition-colors text-lg"
                    >
                        {/* <link rel="stylesheet" href="/discovermore" /> */}
                        {/* <a href="/discovermore" className="inline-flex items-center bg-[#00c6fb] hover:bg-[#00a6d6] text-white font-semibold px-8 py-4 rounded transition-colors text-lg"> */}
                            DISCOVER MORE <FaArrowRight className="ml-3" />
                        {/* </a> */}
                    </motion.a>
                </div>
            </section>

            {/* Cards Section */}
            <div className="relative z-30 max-w-6xl mx-auto px-4 -mt-28 md:-mt-20">
                <div className="flex flex-col md:flex-row md:justify-end gap-6">
                    <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="w-full md:w-80 bg-[#008db3] text-white rounded-xl p-6 shadow-lg text-center"
                    >
                        <FaChartBar className="text-4xl mb-4 mx-auto" />
                        <div className="text-2xl font-bold mb-2">Time-Saving</div>
                        <div className="text-base">
                            Your Time is Money—Let Us Save Both
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="w-full md:w-80 bg-[#00c6fb] text-white rounded-xl p-6 shadow-lg text-center"
                    >
                        <FaHandHoldingUsd className="text-4xl mb-4 mx-auto" />
                        <div className="text-2xl font-bold mb-2">Cost-Effective</div>
                        <div className="text-base">
                            More Savings for Your Business – In Your Books & Your Bills
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* White Section Placeholder */}
            <section id="white-section" className="bg-white pt-40 md:pt-0 pb-24 sm:pb-24"></section>
        </>
    );
}
