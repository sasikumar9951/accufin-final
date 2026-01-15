"use client";
import { motion } from "framer-motion";

type Project = Readonly<{
  img: string;
  title: string;
  desc: string;
}>;

interface ProjectsGridProps {
  projects: Project[];
  containerClass?: string;
  showHeader?: boolean;
  headerEyebrow?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  sectionRef?: React.RefObject<HTMLDivElement | null>;
  isInView?: boolean;
}

export default function ProjectsGrid({
  projects,
  containerClass = "",
  showHeader = false,
  headerEyebrow,
  headerTitle,
  headerSubtitle,
  sectionRef,
  isInView,
}: Readonly<ProjectsGridProps>) {
  const animations = [
    { x: -100, opacity: 0 },
    { y: 100, opacity: 0 },
    { x: 100, opacity: 0 },
  ];

  return (
    <div className={containerClass} ref={sectionRef as any}>
      <div className="max-w-7xl mx-auto">
        {showHeader && (
          <div className="mb-10">
            {headerEyebrow && (
              <div className="text-center mb-2 text-[#008db3] font-semibold tracking-widest uppercase">
                {headerEyebrow}
              </div>
            )}
            {headerTitle && (
              <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] text-center mb-4">
                {headerTitle}
              </h2>
            )}
            {headerSubtitle && (
              <p className="text-center text-[#5a6a7a] mb-10 max-w-2xl mx-auto">
                {headerSubtitle}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              className="rounded-lg border border-[#008db3] bg-white hover:bg-[#008db3] hover:text-white transition-colors p-0 flex flex-col h-full group"
              initial={animations[index % animations.length]}
              animate={isInView ? { x: 0, y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: (index % animations.length) * 0.2, ease: "easeOut" }}
            >
              <div className="overflow-hidden rounded-t-lg">
                <img
                  src={project.img}
                  alt={project.title}
                  className="w-full h-48 object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="font-bold text-lg mb-2">{project.title}</div>
                <div className="mb-4 text-sm flex-1">{project.desc}</div>
                <button
                  type="button"
                  className="inline-flex items-center font-semibold text-sm group-hover:text-white text-[#00c6fb] transition-colors bg-transparent border-none p-0 cursor-pointer"
                >
                  READ MORE →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}


