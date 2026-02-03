"use client";
import { motion } from "framer-motion";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { team } from "./team.data";

type TeamGridProps = {
  readonly containerClass?: string;
  readonly imgHeight?: string;
};

export default function TeamGrid({ containerClass = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8", imgHeight = "h-[340px]" }: TeamGridProps) {
  return (
    <>
      <div className={containerClass}>
        {team.map((member, idx) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50, y: idx % 3 === 0 ? 30 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.6, delay: idx * 0.2, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="relative w-full rounded-xl overflow-hidden group shadow-md">
              <img src={member.img} alt={member.name} className={`w-full ${imgHeight} object-cover`} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#008db3] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center">
                <div className="flex space-x-4 mb-6">
                  {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn].map((Icon, i) => (
                    <button
                      key={(Icon as any).name ?? i}
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

            <div className="w-full bg-[#007399] text-white text-center rounded-b-xl py-3 mt-2">
              <div className="font-bold text-2xl mb-1">{member.name}</div>
              <div className="text-base">{member.role}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <style>{String.raw`
        @keyframes bounceY {
          0% { transform: translateY(0);}
          20% { transform: translateY(-10px);}
          40% { transform: translateY(8px);}
          60% { transform: translateY(-4px);}
          80% { transform: translateY(2px);}
          100% { transform: translateY(0);}
        }
        .hover\:animate-bounceY:hover {
          animation: bounceY 0.6s;
        }
      `}</style>
    </>
  );
}
