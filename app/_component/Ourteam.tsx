"use client";
import { useRef } from "react";
import { useInView } from "framer-motion";
import TeamGrid from "./TeamGrid";

export default function Ourteam() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="bg-[#f7f9fa] py-16 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-2 text-[#008db3] font-semibold tracking-widest uppercase">
                    Our Team
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] text-center mb-4">
                    Our Experienced Accountants
                </h2>
                <p className="text-center text-[#5a6a7a] mb-10 max-w-2xl mx-auto">
                    Sed tincidunt accumsan lacus nec bibendum sapien aliquet ut suspendisse pharetra. Finibus condimentum aenean lacinia sem metus Integer.
                </p>

                <TeamGrid />
            </div>
        </section>
    );
}
