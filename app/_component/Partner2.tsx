"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type Testimonial = {
  id: string;
  name: string;
  role: string;
  text: string;
  imageUrl: string | null;
};

export default function Partner() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [items, setItems] = useState<Testimonial[]>([]);
  
  useEffect(() => {
    fetch("/api/user/testimonials")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((data: Testimonial[]) => setItems(data))
      .catch(() => setItems([]));
  }, []);

  const directions = [
    { x: -80, y: 0 },
    { x: 0, y: 80 },
    { x: 80, y: 0 },
  ];

  const display = items.length > 0 ? items : [];

  return (
    <section ref={sectionRef} className="w-full">
      <div className="bg-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Carousel className="relative">
            <CarouselContent className="-ml-0">
              {(display.length > 0 ? display : []).map((t, i) => (
                <CarouselItem
                  key={t.id}
                  className="basis-full md:basis-1/3 pl-0"
                >
                  <motion.div
                    initial={{
                      opacity: 0,
                      ...directions[i % directions.length],
                    }}
                    animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.2,
                      ease: "easeOut",
                    }}
                    className="mx-2 bg-white border border-[#0082a3] rounded-lg p-8 shadow-sm flex flex-col justify-between min-h-[220px]"
                  >
                    <p className="text-gray-500 italic mb-8">{t.text}</p>
                    <div className="flex items-center mt-auto">
                      <img
                        src={t.imageUrl || "/img1.jpg"}
                        alt={t.name}
                        className="w-14 h-14 rounded-full mr-4 object-cover"
                      />
                      <div>
                        <div className="font-bold text-lg text-gray-900">
                          {t.name}
                        </div>
                        <div className="text-[#0082a3] text-sm">{t.role}</div>
                      </div>
                      <span className="ml-auto text-[#0082a3] text-4xl rotate-180">
                        &#10077;
                      </span>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-3" />
            <CarouselNext className="-right-3" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
