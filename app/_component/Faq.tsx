"use client";
import { useState, useRef } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { motion, useInView } from "framer-motion";

const faqs = [
    {
        q: "How can you help clients reduce their tax liability?",
        a: "We provide expert tax planning and advice to help minimize your tax liability through legal and effective strategies.",
    },
    {
        q: "What is the process for filing business taxes?",
        a: "Our team will guide you through every step, from gathering documents to submitting your return and ensuring compliance.",
    },
    {
        q: "How do you help risk management?",
        a: "We assess your business risks and implement strategies to mitigate them, protecting your assets and reputation.",
    },
    {
        q: "How can you help with tax preparation?",
        a: "We handle all aspects of tax preparation, ensuring accuracy and maximizing deductions for your business.",
    },
    {
        q: "What is the process for conducting an audit?",
        a: "Our audit process is thorough and transparent, providing you with clear insights and actionable recommendations.",
    },
    {
        q: "How can you help with international tax planning?",
        a: "We offer specialized advice for international tax planning, helping you navigate cross-border regulations and optimize your tax position.",
    },
];

export default function Faq() {
    const [open, setOpen] = useState<number | null>(null);

    const firstHalf = faqs.slice(0, 3);
    const secondHalf = faqs.slice(3);

    const renderFaqs = (list: typeof faqs, offset: number) =>
        list.map((item, i) => {
            const index = i + offset;
            const isOpen = open === index;

            return (
                <div key={index}>
                    <button
                        className={`w-full flex items-center justify-between rounded-lg px-6 py-4 text-left font-semibold text-lg focus:outline-none transition border ${
                            isOpen
                                ? "bg-white text-black border-white"
                                : "bg-transparent text-white border-white"
                        }`}
                        onClick={() => setOpen(isOpen ? null : index)}
                    >
                        <span>{item.q}</span>
                        <MdKeyboardArrowDown
                            className={`ml-2 text-2xl transition-transform ${
                                isOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>
                    <div
                        className={`overflow-hidden transition-all duration-300 px-6 ${
                            isOpen ? "max-h-40 py-4" : "max-h-0 py-0"
                        }`}
                    >
                        <p className="text-cyan-100 text-base">{item.a}</p>
                    </div>
                </div>
            );
        });

    // Add animation trigger
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "0px 0px -100px 0px" });

    return (
        <section className="bg-[#0082a3] text-white py-14 px-4">
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:justify-between gap-8">
                    <div className="flex-1 mb-8 md:mb-0">
                        <div className="uppercase text-xs tracking-widest text-cyan-200 mb-1">FAQ</div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">The Most Questions</h2>
                    </div>
                    <div className="flex-1 flex items-center">
                        {/* <p className="text-cyan-100 text-sm md:text-base max-w-xl">
                            Proin laoreet nisi vitae pharetra mattis. Etiam luctus suscipit velit vitae mixue ultricies. Augue molestie a etiam quis tincidunt est, et efficitur ipsum nunc bibendum ut risus et vehicula proin tempus tellus diam laoreet justo donec tempus.
                        </p> */}
                    </div>
                </div>

                {/* 2-column layout */}
                <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">{renderFaqs(firstHalf, 0)}</div>
                    <div className="space-y-4">{renderFaqs(secondHalf, 3)}</div>
                </div>
            </motion.div>
        </section>
    );
}
