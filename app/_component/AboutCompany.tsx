"use client";
import { motion, useInView } from "framer-motion";
import { useState, useRef } from "react";
import { FaPlay, FaChevronRight } from "react-icons/fa";

const YOUTUBE_URL = "https://www.youtube.com/embed/VhBl3dHT5SY?autoplay=1";

export default function AboutCompany() {
  const [showVideo, setShowVideo] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  // Reusable motion props to avoid duplication
  const reveal = (delay: number = 0) => ({
    initial: { x: -50, opacity: 0 },
    animate: isInView ? { x: 0, opacity: 1 } : { x: -50, opacity: 0 },
    transition: { duration: 0.6, delay },
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      ref={ref}
      className="bg-[#FFFFFF] pb-12 px-4 sm:px-6"
    >
      <div className="max-w-[85rem] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-20 items-center">
        {/* Images */}
        <div className="relative flex-shrink-0 w-full lg:w-[420px] mt-8 sm:mt-0   ">
          <img
            src="/img1.jpg"
            alt="Team"
            className="rounded-2xl w-full h-auto max-h-[400px] object-cover"
          />
          <div className="absolute right-0 sm:right-[-10%] bottom-[-50px] sm:bottom-[-70px] w-[200px] sm:w-[260px] md:w-[320px]">
            <div className="relative">
              <img
                src="/img2.jpg"
                alt="Video"
                className="rounded-xl w-full h-auto max-h-[180px] sm:max-h-[200px] object-cover shadow-lg"
              />
              <button
                onClick={() => setShowVideo(true)}
                className="absolute inset-0 flex items-center justify-center"
                aria-label="Play Video"
              >
                <span className="bg-[#00c6fb] hover:bg-[#00a6d6] text-white rounded-full p-3 sm:p-4 shadow-lg transition-colors">
                  <FaPlay className="text-xl sm:text-2xl" />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1 pt-24 md:pt-20 lg:pt-0">
          <motion.div
            {...reveal(0)}
            className="text-[#008db3] font-semibold tracking-widest mb-2 uppercase text-sm sm:text-base"
          >
            About Company
          </motion.div>
          <motion.h2
            {...reveal(0)}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[#0a2236]"
          >
            Your Financial Partner for Success
          </motion.h2>
          <motion.p
            {...reveal(0)}
            className="text-[#5a6a7a] text-base sm:text-lg mb-6"
          >
            We believe in doing the bookkeeping and accounting for your business with just in time approach. Our expertise are into redefining and counting every fraction of a cent to grow in the business and keeping your taxes up-to date and hassle free.
          </motion.p>
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
            {/* Vision */}
            <div className="flex-1">
              <motion.div
                {...reveal(0)}
                className="font-bold text-lg sm:text-xl mb-2 text-[#0a2236]"
              >
                Our Vision
              </motion.div>
              <ul className="space-y-2">
                {[
                  { icon: "🌱", text: "Transforming Numbers into Your Business's Growth Engine" },
                  { icon: "📈", text: "Where Accurate Books Meet Ambitious Futures" },
                  { icon: "🚀", text: "Building Financial Foundations for Tomorrow's Success" },
                  { icon: "🔍", text: "Clarity in Your Finances, Confidence in Your Decisions" },
                ].map((item, idx) => (
                  <li className="flex items-start gap-2" key={item.text}>
                    <motion.span
                      {...reveal(idx * 0.1)}
                      className="text-[#008db3] text-xl"
                    >
                      {item.icon}
                  </motion.span>
                    <motion.span
                      {...reveal(idx * 0.1 + 0.1)}
                      className="text-[#5a6a7a] text-wrap whitespace-normal text-sm sm:text-base flex-1"
                    >
                      {item.text}
                    </motion.span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mission */}
            <div className="flex-1">
              <motion.div
                {...reveal(0)}
                className="font-bold text-lg sm:text-xl mb-2 text-[#0a2236]"
              >
                Our Mission
              </motion.div>
              <ul className="space-y-2">
                {[
                  { icon: "⚖️", text: "Where Every Transaction Matters & Every Client Counts" },
                  { icon: "📈", text: "Meticulous Books for Measurable Growth" },
                  { icon: "🛠️", text: "Fueling Small Business Dreams With Big Financial Insight" },
                ].map((item, idx) => (
                  <li className="flex items-start gap-2" key={item.text}>
                    <motion.span
                      {...reveal(idx * 0.1)}
                      className="text-[#00c6fb] text-xl"
                    >
                      {item.icon}
                    </motion.span>
                    <motion.span
                      {...reveal(idx * 0.1 + 0.1)}
                      className="text-[#5a6a7a] text-wrap whitespace-normal text-sm sm:text-base flex-1"
                    >
                      {item.text}
                    </motion.span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <motion.a
            {...reveal(0)}
            href="/about"
            className="inline-flex items-center bg-[#00c6fb] hover:bg-[#00a6d6] text-white font-semibold px-6 py-3 sm:px-8 sm:py-4 rounded transition-colors text-base sm:text-lg"
          >
            MORE ABOUT US <FaChevronRight className="ml-2 sm:ml-3" />
          </motion.a>
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="relative w-full max-w-4xl mx-auto">
            <button
              className="absolute -top-10 right-0 text-white text-3xl hover:text-gray-300"
              onClick={() => setShowVideo(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="aspect-w-16 aspect-h-9 w-full">
              <iframe
                src={YOUTUBE_URL}
                title="YouTube video"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}