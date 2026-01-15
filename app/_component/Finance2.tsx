"use client";
import { useRef } from "react";
import { useInView } from "framer-motion";
import ProjectsGrid from "./ProjectsGrid";
import { projects } from "./projects.data";


export default function Finance() {
  const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    return (
    <section>
      <ProjectsGrid
        projects={projects}
        containerClass="bg-[#f7f9fa] py-16 px-4"
        showHeader
        headerEyebrow="Case Studies"
        headerTitle="The Last Project We Worked On"
        headerSubtitle="Stop Guessing. Start Growing, Lets work together to make bookkeeping and accounting streamlined and hassle free."
        sectionRef={sectionRef}
        isInView={isInView}
      />
    </section>
    );
}
