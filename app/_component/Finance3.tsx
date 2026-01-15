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
        containerClass="bg-[#f7f9fa] py-0 pb-10 px-4"
        sectionRef={sectionRef}
        isInView={isInView}
      />
    </section>
    );
}
