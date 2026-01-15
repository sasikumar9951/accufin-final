"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function Finance() {
  const topRef = useRef(null);

  const topInView = useInView(topRef, {
    once: true,
    margin: "0px 0px -100px 0px",
  });

  return (
    <section>
      {/* Top Section with Fixed Background */}
      <motion.div
        ref={topRef}
        initial={{ opacity: 0, y: 60 }}
        animate={topInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full h-[320px] flex flex-col items-center justify-center text-center"
        style={{
          backgroundImage: "url('/img5.jpg')",
          backgroundAttachment: "fixed",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 px-4">
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">
            Having Trouble Managing Your Finances?
          </h2>
          <p className="text-white text-base md:text-lg mb-6 max-w-2xl mx-auto">
            Stop Guessing. Start Growing, Lets work together to make bookkeeping
            and accounting streamlined and hassle free.
          </p>
          <a
            href="/contact"
            className="inline-block bg-[#00c6fb] hover:bg-[#00a6d6] text-white font-semibold px-8 py-3 rounded transition-colors text-lg"
          >
            CONTACT US NOW &rarr;
          </a>
        </div>
      </motion.div>

      {/* Case Studies */}

      {/* Our Stages */}
      {/* <motion.div
                ref={stageRef}
                initial={{ opacity: 0, x: 60 }}
                animate={stageInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-[#f7f9fa] py-16 px-4"
            >
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10">
                    <div className="flex-1 flex flex-col gap-8">
                        {stages.map((stage) => (
                            <div key={stage.title} className="flex items-start gap-4">
                                <div>{stage.icon}</div>
                                <div>
                                    <div className="font-bold text-lg text-[#0a2236] mb-1">{stage.title}</div>
                                    <div className="text-[#5a6a7a] text-base">{stage.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex-1">
                        <div className="text-[#008db3] font-semibold tracking-widest mb-2 uppercase">
                            Our Stages
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-4">
                            Easy Process to Manage Your Finances
                        </h2>
                        <p className="text-[#5a6a7a] text-base">
                            In sed nisi vel tortor ornare venenatis sit amet vel felis. Etiam sit amet odio sed nunc lacinia dictum vel quis est. Vivamus in tempor dolor. Sed eget pharetra ligula. Etiam egestas fringilla lectus, et molestie augue auctor sagittis. Nunc sit amet felis ac ex ultricies lacinia. Praesent quis ligula id tortor maximus laoreet. Fusce ultrices sed ante sollicitudin venenatis. Suspendisse potenti. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.
                        </p>
                    </div>
                </div>
            </motion.div> */}
    </section>
  );
}
