"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FaChartBar, FaMoneyCheckAlt, FaClipboardList } from "react-icons/fa";

const stages = [
    {
        icon: <FaChartBar className="text-3xl text-[#00c6fb]" />,
        title: "Consultation",
        desc: "Don't delay. We are just a phone call away",
    },
    {
        icon: <FaMoneyCheckAlt className="text-3xl text-[#00c6fb]" />,
        title: "Choose a Package",
        desc: "Compatible and very exclusive cost effective according to the business needs.",
    },
    {
        icon: <FaClipboardList className="text-3xl text-[#00c6fb]" />,
        title: "Get Your Service",
        desc: "A Bundled package along with all your business and individual/family taxes tailored to your requirements. We will help you to reduce your taxes legally in the best possible way.",
    },
];

export default function OurStages() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section>
            {/* Our Stages */}
            <div ref={ref} className="bg-[#ffffff] py-16 px-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10">
                    {/* Stages List */}
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={isInView ? { y: 0, opacity: 1 } : {}}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex-1 flex flex-col gap-8"
                    >
                        {stages.map((stage, index) => (
                            <motion.div
                                key={stage.title}
                                initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
                                animate={isInView ? { x: 0, opacity: 1 } : {}}
                                transition={{ duration: 0.5, delay: 0.2 * index }}
                                className="flex items-start gap-4"
                            >
                                <div className="border border-[#0082a3] rounded-md p-5 flex items-center justify-center">
                                    {stage.icon}
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-[#0a2236] mb-1">{stage.title}</div>
                                    <div className="text-[#5a6a7a] text-base">{stage.desc}</div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Stages Text */}
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={isInView ? { x: 0, opacity: 1 } : {}}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex-1"
                    >
                        <div className="text-[#008db3] font-semibold tracking-widest mb-2 uppercase">
                            Our Stages
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-4">
                            Easy Process to Manage Your Finances
                        </h2>
                        {/* <p className="text-[#5a6a7a] text-base">
                            In sed nisi vel tortor ornare venenatis sit amet vel felis. Etiam sit amet odio sed nunc lacinia
                            dictum vel quis est. Vivamus in tempor dolor. Sed eget pharetra ligula. Etiam egestas fringilla
                            lectus, et molestie augue auctor sagittis. Nunc sit amet felis ac ex ultricies lacinia. Praesent
                            quis ligula id tortor maximus laoreet. Fusce ultrices sed ante sollicitudin venenatis. Suspendisse
                            potenti. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.
                        </p> */}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
