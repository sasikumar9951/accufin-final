"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { team } from "./team.data";

export default function Ourteam() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="bg-[#f7f9fa] py-0 pb-10 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {team.map((member, idx) => (
                        <motion.div
                            key={member.name}
                            initial={{
                                opacity: 0,
                                x: idx % 2 === 0 ? -60 : 60,
                                y: idx % 3 === 0 ? 40 : -40,
                            }}
                            animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
                            transition={{
                                duration: 0.7,
                                delay: idx * 0.2,
                                ease: "easeOut",
                            }}
                            className="flex flex-col items-center"
                        >
                            {/* Card with hover effect */}
                            <div className="relative w-full rounded-xl overflow-hidden group shadow-md">
                                <img
                                    src={member.img}
                                    alt={member.name}
                                    className="w-full h-[340px] object-cover"
                                />
                                {/* Overlay with social icons */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#008db3] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center">
                                    <div className="flex space-x-4 mb-6">
                                        {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn].map((Icon, i) => (
                                            <button
                                                key={Icon.name}
                                                type="button"
                                                className="bg-[#00c6fb] rounded-full p-3 flex items-center justify-center transition-transform duration-300 hover:animate-bounceY cursor-pointer"
                                                style={{ transitionDelay: `${i * 50}ms` }}
                                                aria-label={`Social media link ${i + 1}`}
                                            >
                                                <Icon className="text-xl text-white" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Name and Role */}
                            <div className="w-full bg-[#007399] text-white text-center rounded-b-xl py-3 mt-2">
                                <div className="font-bold text-2xl mb-1">{member.name}</div>
                                <div className="text-base">{member.role}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Custom bounce animation for icon */}
            <style>{`
                @keyframes bounceY {
                    0% { transform: translateY(0); }
                    20% { transform: translateY(-10px); }
                    40% { transform: translateY(8px); }
                    60% { transform: translateY(-4px); }
                    80% { transform: translateY(2px); }
                    100% { transform: translateY(0); }
                }
                .hover\\:animate-bounceY:hover {
                    animation: bounceY 0.6s;
                }
            `}</style>
        </section>
    );
}
