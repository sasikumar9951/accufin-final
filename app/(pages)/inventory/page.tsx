"use client";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import {
  FaBoxes,
  FaChartLine,
  FaExchangeAlt,
  FaHandshake,
  FaCheckCircle,
} from "react-icons/fa";

export default function InventoryPage() {
  const controls = useAnimation();
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="bg-gray-50 md:pt-[120px] pt-[150px]">
      <Navbar />

      {/* Hero Section */}

      <section
        className="relative w-full h-[400px] md:h-[500px] flex flex-col justify-center"
        style={{
          backgroundImage: "url('/inventory.png')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
        ref={ref} // Moved ref to the section itself
      >
        <div className="absolute inset-0 bg-black opacity-60"></div>{" "}
        {/* Increased opacity */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={container}
          className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col items-start justify-center min-h-full py-12"
        >
          <motion.h1
            className="text-white text-4xl sm:text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg"
            variants={item}
          >
            Financial Restructuring for Inventory Optimization
          </motion.h1>
          <motion.p
            className="text-white text-lg md:text-xl max-w-2xl mb-8 drop-shadow-md"
            variants={item}
          >
            Transforming inventory management into a strategic financial
            advantage
          </motion.p>
          <motion.div
            className="flex items-center space-x-2 text-lg"
            variants={item}
          >
            <Link
              href="/"
              className="text-[#00c6fb] hover:underline font-medium"
            >
              Home
            </Link>
            <span className="text-white">/</span>
            <span className="text-white font-medium">
              Inventory Restructuring
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* Main Content */}
      <motion.main
        initial="hidden"
        animate={controls}
        variants={container}
        className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20"
      >
        {/* Client Background */}
        <motion.section className="mb-20" variants={item}>
          <motion.div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
              Client Background
            </h2>
            <p className="text-gray-600 mb-6">
              A mid-sized manufacturing company was struggling with excessive
              inventory costs, poor cash flow, and inconsistent stock
              availability. Despite high inventory levels, frequent stockouts of
              critical items were disrupting production and leading to lost
              sales. The company needed a financial restructuring strategy to
              align inventory investments with demand while improving working
              capital efficiency.
            </p>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Key Challenges:
              </h3>
              <ul className="space-y-3">
                {[
                  "High Carrying Costs: Obsolete and slow-moving inventory tied up significant capital",
                  "Cash Flow Strain: Excessive stock levels led to liquidity issues",
                  "Demand-Supply Mismatch: Inaccurate forecasting caused overstocking and shortages",
                ].map((challenge) => (
                  <li
                    key={challenge
                      .slice(0, 20)
                      .replace(/\s+/g, "-")
                      .toLowerCase()}
                    className="flex items-start gap-2"
                  >
                    <span className="text-red-600 mt-1">•</span>
                    <span className="text-gray-700">{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Solution Section */}
          <motion.div className="mb-12" variants={item}>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FaBoxes className="text-blue-600" /> Financial Restructuring &
              Inventory Optimization
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: <FaChartLine className="text-2xl" />,
                  title: "ABC Analysis & SKU Rationalization",
                  desc: "Conducted ABC classification to prioritize high-value inventory and eliminate 15% of obsolete stock through liquidation and supplier buyback agreements.",
                },
                {
                  icon: <FaExchangeAlt className="text-2xl" />,
                  title: "Dynamic Forecasting & Procurement",
                  desc: "Implemented demand-driven replenishment models and negotiated flexible payment terms with suppliers.",
                },
                {
                  icon: <FaHandshake className="text-2xl" />,
                  title: "Working Capital Optimization",
                  desc: "Reduced average inventory holding period by 22% through JIT strategies and introduced VMI for critical suppliers.",
                },
                {
                  icon: <FaCheckCircle className="text-2xl" />,
                  title: "Cost Restructuring",
                  desc: "Shifted to smaller, frequent orders and leveraged inventory financing options to improve liquidity.",
                },
              ].map((solution) => (
                <motion.div
                  key={solution.title.replace(/\s+/g, "-").toLowerCase()}
                  variants={item}
                  className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500 hover:shadow-lg transition-shadow"
                >
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-blue-600">
                    {solution.icon}
                  </div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">
                    {solution.title}
                  </h4>
                  <p className="text-gray-600">{solution.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            variants={item}
            className="bg-green-50 rounded-xl p-8 mb-12"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FaCheckCircle className="text-green-600" /> Results Achieved
            </h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                "30% reduction in excess inventory",
                "20% decrease in carrying costs",
                "Zero stockouts of critical items",
                "Improved supplier relationships",
              ].map((result) => (
                <motion.div
                  key={result.replace(/\s+/g, "-").toLowerCase()}
                  variants={item}
                  className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-3"
                >
                  <span className="bg-green-100 text-green-600 p-2 rounded-full">
                    <FaCheckCircle />
                  </span>
                  <span className="text-gray-700">{result}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Key Takeaway */}
          <motion.div
            variants={item}
            className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-12"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Key Takeaway
            </h3>
            <p className="text-gray-600">
              This financial restructuring initiative demonstrated how strategic
              inventory management can transform a company's liquidity,
              operational efficiency, and bottom line. By aligning inventory
              investments with actual demand and optimizing working capital, the
              business achieved sustainable growth while mitigating financial
              risks.
            </p>
          </motion.div>

          {/* CTA Section */}
          <motion.section
            variants={item}
            className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-center text-white"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Optimize Your Inventory Management
            </h2>
            <p className="text-lg mb-6 max-w-3xl mx-auto">
              If your company faces challenges with inventory costs or cash
              flow, I can design a tailored financial restructuring plan to
              optimize your inventory strategy.
            </p>
            <motion.a
              href="/contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-600 font-bold px-8 py-3 rounded-lg shadow-lg hover:bg-gray-100 transition-all"
            >
              Contact for Consultation
            </motion.a>
          </motion.section>
        </motion.section>
      </motion.main>

      <Footer />
    </div>
  );
}
