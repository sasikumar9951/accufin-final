"use client";
import { useRef } from "react";
import { useInView } from "framer-motion";
import TeamGrid from "./TeamGrid";

export default function OurteamCompact() {
    const ref = useRef(null);
    useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="bg-[#f7f9fa] py-0 pb-10 px-4">
            <div className="max-w-7xl mx-auto">
                <TeamGrid containerClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" />
            </div>
        </section>
    );
}
