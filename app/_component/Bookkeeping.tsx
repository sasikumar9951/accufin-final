"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FaChevronRight, FaShareAlt } from "react-icons/fa";

const otherServices = [
  "Bookkeeping",
  "Payroll Services",
  "Tax Planning",
  "Audit & Assurance",
  "Financial Statement",
  "Business Compliances",  
];
export default function Bookkeeping() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });


  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="bg-[#f7f9fa] py-8 px-2 min-h-screen" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8"
      >
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <img
            src="/img16.jpg"
            alt="Bookkeeping"
            className="rounded-xl w-full object-cover mb-6"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-[#0a2236] mb-4">
            About Bookkeeping
          </h1>
          <div className="flex flex-wrap items-center gap-4 mb-4 text-[#008db3]">
            <button
              onClick={handleScrollTop}
              className="flex items-center hover:text-[#00c6fb] transition-colors"
            >
              <FaChevronRight className="mr-1" /> Services
            </button>
            <button
              onClick={handleScrollTop}
              className="flex items-center hover:text-[#00c6fb] transition-colors"
            >
              <FaChevronRight className="mr-1" /> Service Detail
            </button>
            <button
              onClick={handleScrollTop}
              className="flex items-center hover:text-[#00c6fb] transition-colors"
            >
              <FaShareAlt className="mr-1" /> Share
            </button>
          </div>
          {/* <p className="mb-4 text-[#5a6a7a] text-2xl">
              <b className="text-2xl">Accurate Bookkeeping Services in Canada:</b> Your Financial Foundation, Done Right
            </p>
            <p className="mb-4 text-[#5a6a7a]">
              <p className="text-xl font-semibold">Stop juggling receipts, chasing invoices, and worrying about CRA compliance. </p>
              <p>Accufin provides expert bookkeeping services for Canadian businesses, turning your financial chaos into clarity. We handle your day-to-day finances so you can focus on growth.</p>
            </p> */}

          {/* <h2 className="text-xl font-bold text-[#0a2236] mb-2 mx-auto">
            Benefits of Using Bookkeeping Services
          </h2> */}


          {/* Addded */}


          <ul className="list-none pl-0 space-y-2 text-[#008db3]">
            {[
              { text: "Bookkeeping", href: "/service/bookkeeping" },
              { text: "Payroll Services", href: "/service/payroll" },
              { text: "Tax Planning", href: "/service/tax" },
              { text: "Audit & Assurance", href: "/service/audit" },
              { text: "Financial Statement", href: "/service/finance" },
              { text: "Business Compliances", href: "/service/businesscompliances" },
            ].map((item) => (
              <li className="flex items-start group" key={item.text}>
                <FaChevronRight className="mt-1 mr-2 text-[#008db3]" />
                <a
                  href={item.href}
                  className="text-[#5a6a7a] hover:text-[#008db3] transition-colors duration-200 flex-1"
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[350px] flex flex-col gap-6">
          {/* Other Services */}
          <div className="bg-[#007399] rounded-xl p-6 text-white mb-2">
            <div className="font-bold text-lg mb-4">Other Services</div>
            <ul className="space-y-2">
              {otherServices.map((service) => (
                <li key={service}>
                  <button
                    onClick={handleScrollTop}
                    className="flex items-center hover:text-[#00c6fb] transition-colors"
                  >
                    <FaChevronRight className="mr-2 text-[#00c6fb]" />
                    {service}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us Now */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              backgroundImage: "url('/img5.jpg')",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
            }}
          >
            <div className="absolute inset-0 bg-black opacity-60"></div>
            <div className="relative z-10 p-6 flex flex-col items-start">
              <div className="text-white text-lg font-bold mb-2">
                Having Trouble Managing <br /> Your Finance?
              </div>
              <a
                href="/contact"
                // onClick={handleScrollTop}
                className="mt-2 inline-block bg-[#00c6fb] hover:translate-y-[-6px] transition-transform text-white font-semibold px-6 py-3 rounded"
              >
                CONTACT US NOW &rarr;
              </a>
            </div>
          </div>

          {/* Get a Free Quote */}
          <form
            className="bg-white border border-[#008db3] rounded-xl p-6 flex flex-col gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="font-bold text-lg mb-2 text-[#0a2236]">
              Get a Free Quote
            </div>
            <input
              type="text"
              placeholder="Name"
              required
              className="border border-[#008db3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00c6fb] text-[#0a2236]"
            />
            <input
              type="email"
              placeholder="Email"
              required
              className="border border-[#008db3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00c6fb] text-[#0a2236]"
            />
            <textarea
              placeholder="Message"
              required
              className="border border-[#008db3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00c6fb] text-[#0a2236] min-h-[80px]"
            />
            <button
              type="submit"
              className="bg-[#00c6fb] hover:bg-[#009fcc] text-white font-semibold px-6 py-3 rounded transition-colors"
            >
              SEND MESSAGE
            </button>
          </form>
        </div>
      </motion.div>
    </section>
  );
}
