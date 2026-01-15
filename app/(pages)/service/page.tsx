"use client";
import Navbar from "@/app/_component/Navbar";
import Partner from "@/app/_component/Partner";
import Footer from "@/app/_component/Footer";
import Service from "@/app/_component/Service";
import Company from "@/app/_component/Company";
import Finance from "@/app/_component/Finance";
import Price from "@/app/_component/Price";
import OurStages from "@/app/_component/OurStages";

export default function ServicePage() {
  return (
    <div className="md:pt-[120px] pt-[150px]">
      <Navbar />
      <Service />
      <Company />
      <Finance />
      <Price />
      <OurStages />
      {/* <Partner /> */}
      {/* <Logos /> */}

      <Partner />
      <Footer />
    </div>
  );
}
