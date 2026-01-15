"use client";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import Finance from "@/app/_component/Finance";
import Price from "@/app/_component/Price";
import OurStages from "@/app/_component/OurStages";
import Pricing from "@/app/_component/Pricing";
import Partner2 from "@/app/_component/Partner2";

export default function PricingPage() {
  return (
    <div className="md:pt-[120px] pt-[150px]">
      <Navbar />
      <Pricing />
      <Price />
      <Finance />
      <OurStages />
      <Partner2 />
      <Footer />
    </div>
  );
}
